<?php
/**
 * ProToolBox Unified Media Downloader Gateway (PHP)
 * Pinterest, YouTube (Videos + Shorts), Instagram
 *
 * Changes in this version:
 *  1. YouTube: progressive (video + audio already combined) formats claim a quality tier first,
 *     so 360p/720p with guaranteed sound is no longer replaced by a video-only "merged" item.
 *  2. SSL verification is ON everywhere. CA bundle auto-detected. Escape hatch via config.php.
 *  3. stream and merge_stream: set_time_limit(0), longer curl timeout, manual redirect hops
 *     where every hop is validated against the CDN allowlist.
 *  4. Separate rate limit buckets: "api" 15/min (resolve) and "dl" 40/min (stream, merge_stream).
 *  5. Provider forwarding uses isHostPublic() (DNS based) instead of the broken IP-only check.
 *  6. Height detection also reads width/height/size fields, uses the short side (Shorts safe).
 *
 * Optional config.php (same folder):
 *   define('PTB_CA_BUNDLE', '/full/path/to/cacert.pem');
 *   define('PTB_ALLOW_INSECURE_SSL', true); // only if your host has no CA bundle at all
 */

@ini_set('max_execution_time', 45);
@ini_set('memory_limit', '256M');
@ini_set('display_errors', '0');
error_reporting(E_ALL);

// ==== 1. STRICT CORS ====
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://protoolbox.in',
    'https://www.protoolbox.in',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:8000'
];

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: ' . 'true');
} else {
    header('Access-Control-Allow-Origin: https://protoolbox.in');
}
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ==== SAFE SYSTEM PROCESS AVAILABILITY CHECKS ====
function isShellExecAvailable(): bool {
    if (!function_exists('shell_exec')) return false;
    $disabled = ini_get('disable_functions');
    if (!empty($disabled)) {
        $arr = array_map('trim', explode(',', strtolower($disabled)));
        if (in_array('shell_exec', $arr, true)) return false;
    }
    return true;
}

function isProcOpenAvailable(): bool {
    if (!function_exists('proc_open')) return false;
    $disabled = ini_get('disable_functions');
    if (!empty($disabled)) {
        $arr = array_map('trim', explode(',', strtolower($disabled)));
        if (in_array('proc_open', $arr, true)) return false;
    }
    return true;
}

// Fatal errors always become JSON
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'FATAL_SERVER_ERROR',
                'message' => 'An unexpected server error occurred: ' . ($error['message'] ?? 'Internal Error')
            ]
        ]);
    }
});

// ==== OPTIONAL SECRET CONFIG ====
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// ==== SSL HELPER (verification ON, CA bundle auto-detected) ====
function applySsl($ch): void {
    $ca = '';
    $candidates = [];
    if (defined('PTB_CA_BUNDLE')) $candidates[] = PTB_CA_BUNDLE;
    $candidates[] = __DIR__ . '/cacert.pem';
    $candidates[] = '/etc/ssl/certs/ca-certificates.crt';
    $candidates[] = '/etc/pki/tls/certs/ca-bundle.crt';
    $candidates[] = '/etc/ssl/cert.pem';
    foreach ($candidates as $c) {
        if ($c && @is_readable($c)) { $ca = $c; break; }
    }
    if ($ca !== '') {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_CAINFO, $ca);
        return;
    }
    if (defined('PTB_ALLOW_INSECURE_SSL') && PTB_ALLOW_INSECURE_SSL === true) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        return;
    }
    // Default: rely on PHP's own curl.cainfo, verification stays ON
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
}

// ==== 2. CLIENT IP & RATE LIMITING ====
function ipInIpv4Cidr(string $ip, string $cidr): bool {
    list($subnet, $bits) = explode('/', $cidr);
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) return false;
    $ipLong = ip2long($ip);
    $subnetLong = ip2long($subnet);
    $mask = -1 << (32 - (int)$bits);
    return ($ipLong & $mask) === ($subnetLong & $mask);
}

function ipInIpv6Cidr(string $ip, string $cidr): bool {
    list($subnet, $bits) = explode('/', $cidr);
    $ipBin = @inet_pton($ip);
    $subnetBin = @inet_pton($subnet);
    if ($ipBin === false || $subnetBin === false) return false;
    $bits = (int)$bits;
    $bytes = (int)($bits / 8);
    $remainder = $bits % 8;
    if (substr($ipBin, 0, $bytes) !== substr($subnetBin, 0, $bytes)) {
        return false;
    }
    if ($remainder > 0) {
        $mask = 0xFF << (8 - $remainder);
        if ((ord($ipBin[$bytes]) & $mask) !== (ord($subnetBin[$bytes]) & $mask)) {
            return false;
        }
    }
    return true;
}

function isCloudflareProxyIp(string $ip): bool {
    static $cfIpv4 = [
        '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
        '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
        '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
        '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
    ];
    static $cfIpv6 = [
        '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
        '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'
    ];
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        foreach ($cfIpv4 as $cidr) {
            if (ipInIpv4Cidr($ip, $cidr)) return true;
        }
    } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        foreach ($cfIpv6 as $cidr) {
            if (ipInIpv6Cidr($ip, $cidr)) return true;
        }
    }
    return false;
}

function getTrustedClientIp(): string {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $remote = trim(explode(',', $remote)[0]);

    if (isCloudflareProxyIp($remote) && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $cf = trim(explode(',', $_SERVER['HTTP_CF_CONNECTING_IP'])[0]);
        if (filter_var($cf, FILTER_VALIDATE_IP)) {
            return $cf;
        }
    }
    return $remote;
}

// Two buckets: "api" (resolve) and "dl" (stream, merge_stream)
function checkRateLimit(string $bucket = 'api', int $limit = 15) {
    $WINDOW_SECONDS = 60;
    $ip = getTrustedClientIp();

    $storageDir = sys_get_temp_dir() . '/ptb_security';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0700, true);
    }
    $file = $storageDir . '/rate_' . $bucket . '_' . md5($ip) . '.json';

    $now = time();
    $data = ['count' => 0, 'start' => $now];

    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        if ($raw) {
            $parsed = json_decode($raw, true);
            if ($parsed && !empty($parsed['start'])) {
                if ($now - $parsed['start'] < $WINDOW_SECONDS) {
                    $data = $parsed;
                }
            }
        }
    }

    if ($data['count'] >= $limit) {
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'RATE_LIMIT',
                'message' => "Rate limit exceeded ($limit requests/min). Please wait a moment and try again."
            ]
        ]);
        exit;
    }

    $data['count']++;
    @file_put_contents($file, json_encode($data), LOCK_EX);
}

// ==== 3. STRICT SSRF & HOST ALLOWLIST VALIDATION ====
function isHostAllowlisted(string $host, array $allowedList): bool {
    $host = strtolower(trim($host));
    if (!$host) return false;
    foreach ($allowedList as $allowed) {
        $allowed = strtolower(trim($allowed));
        if ($host === $allowed || str_ends_with($host, '.' . $allowed)) {
            return true;
        }
    }
    return false;
}

function isPrivateOrReservedIp(string $ip): bool {
    $ip = trim($ip, '[]');
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return true; // Not a valid IP -> block
    }
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return true;
    }
    $ipLower = strtolower($ip);
    if ($ipLower === '::1' || $ipLower === '0.0.0.0' || $ipLower === '::' || $ipLower === 'localhost') {
        return true;
    }
    if (str_starts_with($ipLower, '::ffff:')) {
        $v4 = substr($ipLower, 7);
        if (!filter_var($v4, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return true;
        }
    }
    $bin = @inet_pton($ip);
    if ($bin !== false && strlen($bin) === 16) {
        $b0 = ord($bin[0]);
        if (($b0 & 0xFE) === 0xFC) return true; // fc00::/7
        if ($b0 === 0xFE && (ord($bin[1]) & 0xC0) === 0x80) return true; // fe80::/10
    }
    return false;
}

// True only if the host resolves and NO resolved IP is private or reserved
function isHostPublic(string $host): bool {
    $host = trim(strtolower($host), '[]');
    if ($host === '') return false;
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return !isPrivateOrReservedIp($host);
    }
    if ($host === 'localhost' || str_ends_with($host, '.local') || str_ends_with($host, '.internal') || str_ends_with($host, '.lan')) {
        return false;
    }
    $records = @dns_get_record($host, DNS_A | DNS_AAAA);
    if (empty($records)) return false;
    foreach ($records as $r) {
        $ip = $r['ip'] ?? $r['ipv6'] ?? '';
        if ($ip && isPrivateOrReservedIp($ip)) return false;
    }
    return true;
}

function isAllowedDomain($url, $context = 'resolve') {
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
    if (!$host) return false;

    if ($host === 'localhost' || str_ends_with($host, '.local') || str_ends_with($host, '.internal') || str_ends_with($host, '.lan')) {
        return false;
    }

    $platformDomains = [
        'pinterest.com', 'pin.it', 'www.pinterest.com', 'in.pinterest.com', 'api.pinterest.com',
        'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
        'instagram.com', 'www.instagram.com'
    ];

    $cdnDomains = [
        'pinimg.com', 'i.pinimg.com', 'v.pinimg.com', 'v1.pinimg.com', 'v2.pinimg.com', 's.pinimg.com',
        'googlevideo.com', 'ytimg.com', 'i.ytimg.com',
        'chocolatemoo53.com', 'jing.rocks', 'nerdvpn.de', 'projectsegfau.lt', 'slipfox.xyz', 'nadeko.net', 'protokolla.fi',
        'cdninstagram.com', 'fbcdn.net'
    ];

    $targetList = ($context === 'stream') ? $cdnDomains : $platformDomains;

    if (!isHostAllowlisted($host, $targetList)) {
        return false;
    }

    if (filter_var(trim($host, '[]'), FILTER_VALIDATE_IP)) {
        if (isPrivateOrReservedIp($host)) {
            return false;
        }
    } else {
        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        if (!empty($records)) {
            foreach ($records as $r) {
                $checkIp = $r['ip'] ?? $r['ipv6'] ?? '';
                if ($checkIp && isPrivateOrReservedIp($checkIp)) {
                    return false;
                }
            }
        } else {
            $fallbackIp = @gethostbyname($host);
            if ($fallbackIp === $host || isPrivateOrReservedIp($fallbackIp)) {
                return false;
            }
        }
    }

    return true;
}

// Resolve a Location header (absolute, protocol-relative or relative) against the current URL
function resolveLocation(string $currentUrl, string $location): string {
    $location = trim($location);
    if (str_starts_with($location, '//')) {
        return 'https:' . $location;
    }
    if (!preg_match('/^https?:\/\//i', $location)) {
        $parts = parse_url($currentUrl);
        $base = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
        return $base . (str_starts_with($location, '/') ? '' : '/') . $location;
    }
    return $location;
}

// ==== 4. SAFE MULTI-HOP REDIRECT FETCHER (validates every hop) ====
function safeFetchUrl($startUrl, $maxHops = 5) {
    $currentUrl = $startUrl;
    $hops = 0;

    while ($hops < $maxHops) {
        $hops++;
        if (!isAllowedDomain($currentUrl, 'resolve')) {
            return [
                'success' => false,
                'error' => 'Security check failed: Redirect destination not allowed.',
                'code' => 403
            ];
        }

        $ch = curl_init($currentUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        applySsl($ch);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.9',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        if ($response === false) {
            return ['success' => false, 'error' => 'Network error connecting to platform.', 'code' => 502];
        }

        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);

        if (in_array($httpCode, [301, 302, 303, 307, 308], true)) {
            if (preg_match('/^Location:\s*(.*)$/mi', $headers, $locMatches)) {
                $currentUrl = resolveLocation($currentUrl, $locMatches[1]);
                continue;
            }
        }

        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'html' => $body,
            'httpCode' => $httpCode,
            'finalUrl' => $currentUrl
        ];
    }

    return ['success' => false, 'error' => 'Too many redirects.', 'code' => 310];
}

// ==== STREAM HELPER (manual redirect hops, each hop validated) ====
function streamDownload(string $startUrl, string $filename, bool $isMediaVideo, int $maxBytes): array {
    $url = $startUrl;
    $res = ['sent' => false, 'status' => 0, 'tooLarge' => false, 'blockedHost' => '', 'lastHost' => ''];
    $lower = strtolower($filename);

    for ($hop = 0; $hop <= 5; $hop++) {
        $res['lastHost'] = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        if ($hop > 0 && !isAllowedDomain($url, 'stream')) {
            $res['status'] = 0;
            $res['blockedHost'] = $res['lastHost'];
            return $res;
        }

        $status = 0;
        $clen = 0;
        $type = '';
        $location = '';
        $bytes = 0;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        applySsl($ch);
        curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36');
        if (preg_match('/pinimg\.com/i', $url)) {
            curl_setopt($ch, CURLOPT_REFERER, 'https://www.pinterest.com/');
        }

        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($c, $line) use (&$status, &$clen, &$type, &$location) {
            $len = strlen($line);
            if (preg_match('#^HTTP/[\d\.]+\s+(\d+)#i', $line, $m)) {
                $status = (int)$m[1];
                $clen = 0;
                $type = '';
                $location = '';
            } elseif (preg_match('/^Content-Length:\s*(\d+)/i', $line, $m)) {
                $clen = (int)$m[1];
            } elseif (preg_match('/^Content-Type:\s*([^\r\n;]+)/i', $line, $m)) {
                $type = trim($m[1]);
            } elseif (preg_match('/^Location:\s*(\S+)/i', $line, $m)) {
                $location = $m[1];
            }
            return $len;
        });

        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($c, $data) use (&$res, &$status, &$clen, &$type, &$bytes, $maxBytes, $filename, $lower, $isMediaVideo) {
            $len = strlen($data);

            // Skip bodies of redirect responses
            if ($status >= 300 && $status < 400) {
                return $len;
            }

            if (!$res['sent']) {
                if ($status !== 200 && $status !== 206) {
                    return 0; // upstream error, abort
                }
                if ($clen > $maxBytes) {
                    $res['tooLarge'] = true;
                    return 0;
                }

                header('Content-Disposition: attachment; filename="' . $filename . '"');
                if (str_ends_with($lower, '.mp4')) {
                    header('Content-Type: video/mp4');
                } elseif (str_ends_with($lower, '.m4a')) {
                    header('Content-Type: audio/mp4');
                } elseif (str_ends_with($lower, '.mp3')) {
                    header('Content-Type: audio/mpeg');
                } elseif ($type && !str_contains($type, 'text/html')) {
                    header('Content-Type: ' . $type);
                } else {
                    header('Content-Type: ' . ($isMediaVideo ? 'video/mp4' : 'image/jpeg'));
                }
                if ($clen > 0 && $clen <= $maxBytes) {
                    header('Content-Length: ' . (int)$clen);
                }
                header('Cache-Control: public, max-age=86400');
                header('X-Accel-Buffering: no');
                $res['sent'] = true;
            }

            $bytes += $len;
            if ($bytes > $maxBytes) {
                return 0;
            }

            echo $data;
            if (ob_get_level() > 0) {
                @ob_flush();
            }
            flush();
            return $len;
        });

        curl_exec($ch);
        curl_close($ch);

        $res['status'] = $status;

        if ($status >= 300 && $status < 400 && $location !== '') {
            $url = resolveLocation($url, $location);
            continue;
        }
        return $res;
    }

    $res['status'] = 310;
    return $res;
}

// ==== READ REQUEST INPUT ====
$action = $_GET['action'] ?? $_POST['action'] ?? 'resolve';
$inputUrl = trim($_GET['url'] ?? $_POST['url'] ?? '');

if (empty($inputUrl)) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $inputUrl = trim($body['url'] ?? '');
    if (empty($action) || $action === 'resolve') {
        $action = $body['action'] ?? 'resolve';
    }
}

// Rate limit: downloads get a bigger bucket than resolve
if ($action === 'stream' || $action === 'merge_stream') {
    checkRateLimit('dl', 40);
} else {
    checkRateLimit('api', 15);
}

// =============================================================================
// ACTION: MERGE_STREAM (server-side FFmpeg audio + video muxing)
// =============================================================================
if ($action === 'merge_stream') {
    $videoUrl = $_GET['video_url'] ?? $_POST['video_url'] ?? '';
    $audioUrl = $_GET['audio_url'] ?? $_POST['audio_url'] ?? '';
    $filename = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $_GET['filename'] ?? 'protoolbox_hd_video.mp4');
    if (!str_ends_with(strtolower($filename), '.mp4')) {
        $filename .= '.mp4';
    }

    if (empty($videoUrl) || !isAllowedDomain($videoUrl, 'stream')) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => ['code' => 'INVALID_VIDEO_URL', 'message' => 'Disallowed or missing video stream URL.']]);
        exit;
    }

    $findFfmpeg = function (): ?string {
        if (!isProcOpenAvailable()) {
            return null;
        }

        $candidates = [
            dirname(__DIR__, 2) . '/ffmpeg_bin/ffmpeg',
            dirname(__DIR__, 1) . '/bin/ffmpeg',
            __DIR__ . '/ffmpeg_bin/ffmpeg',
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/bin/ffmpeg',
            'ffmpeg'
        ];

        foreach ($candidates as $bin) {
            if (str_starts_with($bin, '/') && (!file_exists($bin) || !is_executable($bin))) {
                continue;
            }
            $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
            $p = @proc_open("$bin -version", $descriptors, $pipes);
            if (is_resource($p)) {
                fclose($pipes[0]);
                $ver = stream_get_contents($pipes[1]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                $code = proc_close($p);
                if ($code === 0 && stripos($ver, 'ffmpeg version') !== false) {
                    return $bin;
                }
            }
        }
        return null;
    };

    $ffmpegBin = $findFfmpeg();
    if (!$ffmpegBin) {
        // 501 tells the frontend to run the client-side WebAssembly merge
        http_response_code(501);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'SERVER_MERGE_UNAVAILABLE',
                'message' => 'Server FFmpeg unavailable. Client fallback will process merge.'
            ]
        ]);
        exit;
    }

    @set_time_limit(0);
    @ignore_user_abort(false);

    header('Content-Type: video/mp4');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: public, max-age=86400');
    header('X-Accel-Buffering: no');
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }

    $ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
    $binEscaped = escapeshellarg($ffmpegBin);
    $cmd = "$binEscaped -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5"
         . " -headers " . escapeshellarg("User-Agent: $ua\r\n")
         . " -i " . escapeshellarg($videoUrl);

    if (!empty($audioUrl) && isAllowedDomain($audioUrl, 'stream')) {
        $cmd .= " -headers " . escapeshellarg("User-Agent: $ua\r\n")
             . " -i " . escapeshellarg($audioUrl)
             . " -c:v copy -c:a aac -strict -2 -movflags +faststart+frag_keyframe+empty_moov -f mp4 pipe:1";
    } else {
        $cmd .= " -c:v copy -strict -2 -movflags +faststart+frag_keyframe+empty_moov -f mp4 pipe:1";
    }

    $proc = proc_open($cmd, [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ], $pipes);

    if (is_resource($proc)) {
        fclose($pipes[0]);
        fclose($pipes[2]);
        while (!feof($pipes[1])) {
            $data = fread($pipes[1], 65536);
            if ($data !== false && strlen($data) > 0) {
                echo $data;
                flush();
            }
            if (connection_aborted()) {
                break;
            }
        }
        fclose($pipes[1]);
        proc_close($proc);
        exit;
    }

    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => ['code' => 'PROC_FAILED', 'message' => 'Could not spawn merge process.']]);
    exit;
}

// =============================================================================
// ACTION: STREAM (safe CDN download proxy with size limits)
// =============================================================================
if ($action === 'stream') {
    if (empty($inputUrl) || !isAllowedDomain($inputUrl, 'stream')) {
        http_response_code(400);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Invalid or disallowed download URL.';
        exit;
    }

    // Validation passed: allow long downloads
    @set_time_limit(0);
    @ini_set('zlib.output_compression', '0');

    $streamTargetUrl = $inputUrl;

    $filename = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $_GET['filename'] ?? 'protoolbox_download');
    if (!str_contains($filename, '.')) {
        $filename .= '.jpg';
    }

    $isMediaVideo = str_contains($streamTargetUrl, '.mp4')
        || preg_match('/v[0-9]*\.pinimg\.com/i', $streamTargetUrl)
        || str_contains($streamTargetUrl, 'videoplayback')
        || str_ends_with(strtolower($filename), '.mp4')
        || str_ends_with(strtolower($filename), '.m4a')
        || str_ends_with(strtolower($filename), '.mp3');
    $MAX_ALLOWED_BYTES = $isMediaVideo ? 150 * 1024 * 1024 : 30 * 1024 * 1024;

    $res = streamDownload($streamTargetUrl, $filename, (bool)$isMediaVideo, $MAX_ALLOWED_BYTES);

    if (!$res['sent']) {
        if ($res['tooLarge']) {
            http_response_code(413);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'ok' => false,
                'error' => ['code' => 'FILE_TOO_LARGE', 'message' => 'File exceeds maximum allowed download limit.']
            ]);
            exit;
        }
        $st = (int)$res['status'];
        header('Content-Type: application/json; charset=utf-8');
        if (!empty($res['blockedHost'])) {
            http_response_code(502);
            echo json_encode([
                'ok' => false,
                'error' => [
                    'code' => 'REDIRECT_BLOCKED',
                    'message' => 'Redirect blocked by allowlist or DNS check. Host: ' . $res['blockedHost']
                ]
            ]);
            exit;
        }
        http_response_code($st >= 400 && $st < 600 ? $st : 502);
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'STREAM_FAILED',
                'message' => 'Could not stream media file. Upstream server response code: ' . ($st ?: 'Connection Failed')
                    . ' (host: ' . ($res['lastHost'] ?: 'unknown') . ')'
            ]
        ]);
    }
    exit;
}

// Fast HEAD check helper (Referer and Range fallback)
function verifyMediaHead(string $url, int $timeout = 4): array {
    if (empty($url)) return ['ok' => false, 'code' => 0, 'type' => ''];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36');
    if (preg_match('/pinimg\.com/i', $url)) {
        curl_setopt($ch, CURLOPT_REFERER, 'https://www.pinterest.com/');
    }
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: '';
    curl_close($ch);

    if ($code < 200 || $code >= 400) {
        $ch2 = curl_init($url);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch2, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch2, CURLOPT_MAXREDIRS, 3);
        curl_setopt($ch2, CURLOPT_RANGE, '0-100');
        curl_setopt($ch2, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36');
        if (preg_match('/pinimg\.com/i', $url)) {
            curl_setopt($ch2, CURLOPT_REFERER, 'https://www.pinterest.com/');
        }
        curl_exec($ch2);
        $code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        $type2 = curl_getinfo($ch2, CURLINFO_CONTENT_TYPE) ?: $type;
        curl_close($ch2);
        if ($code2 >= 200 && $code2 < 400) {
            $code = $code2;
            $type = $type2;
        }
    }
    return ['ok' => ($code >= 200 && $code < 400), 'code' => $code, 'type' => $type];
}

// =============================================================================
// ACTION: RESOLVE MEDIA METADATA AND DOWNLOAD LINKS
// =============================================================================
header('Content-Type: application/json; charset=utf-8');

if (empty($inputUrl)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => [
            'code' => 'EMPTY_URL',
            'message' => 'Please provide a valid media link.'
        ]
    ]);
    exit;
}

if (!isAllowedDomain($inputUrl, 'resolve')) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => [
            'code' => 'UNSUPPORTED_DOMAIN',
            'message' => 'Only public links from Pinterest, YouTube, and Instagram are supported.'
        ]
    ]);
    exit;
}

$host = strtolower(parse_url($inputUrl, PHP_URL_HOST) ?? '');
$platform = 'unknown';
if (str_contains($host, 'pinterest') || str_contains($host, 'pin.it')) {
    $platform = 'pinterest';
} elseif (str_contains($host, 'youtube') || str_contains($host, 'youtu.be')) {
    $platform = 'youtube';
} elseif (str_contains($host, 'instagram')) {
    $platform = 'instagram';
}

// ==== 1. PINTEREST RESOLVER ====
if ($platform === 'pinterest') {
    $fetchRes = safeFetchUrl($inputUrl, 5);

    if (!$fetchRes['success'] || empty($fetchRes['html'])) {
        $code = $fetchRes['httpCode'] ?? 404;
        http_response_code($code === 403 ? 403 : 404);
        echo json_encode([
            'ok' => false,
            'platform' => 'pinterest',
            'error' => [
                'code' => $code === 403 ? 'SECURITY_BLOCKED' : 'NOT_FOUND',
                'message' => $fetchRes['error'] ?? 'Could not fetch this Pinterest pin. The pin may be private, deleted, or requires a user login.'
            ]
        ]);
        exit;
    }

    $finalUrl = rtrim($fetchRes['finalUrl'] ?? '', '/');
    if (in_array($finalUrl, ['https://pinterest.com', 'https://www.pinterest.com', 'https://in.pinterest.com'], true)) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'platform' => 'pinterest',
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'The Pinterest link expired, was deleted, or redirected to the home page.'
            ]
        ]);
        exit;
    }

    $html = $fetchRes['html'];

    $title = '';
    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $title = $m[1];
    } elseif (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:title["\']/i', $html, $m)) {
        $title = $m[1];
    } elseif (preg_match('/<title>([^<]+)<\/title>/i', $html, $m)) {
        $title = trim($m[1]);
    }
    $title = html_entity_decode(trim(preg_replace('/\s*[\-\|]\s*Pinterest.*$/i', '', $title)), ENT_QUOTES, 'UTF-8');
    if (!$title) $title = 'Pinterest Image';

    $imgUrl = '';
    if (preg_match('/"images_orig":\s*\{[^}]*"url":\s*"([^"]+)"/i', $html, $m)) {
        $imgUrl = stripslashes($m[1]);
    }
    if (empty($imgUrl) && preg_match('/"image":\s*"(https?:\\\\?\/\\\\?\/i\.pinimg\.com\\\\?\/originals\\\\?\/[^"]+)"/i', $html, $m)) {
        $imgUrl = stripslashes($m[1]);
    }
    if (empty($imgUrl) && preg_match('/<link[^>]+id=["\']pin-image-preload["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    } elseif (empty($imgUrl) && preg_match('/<link[^>]+href=["\']([^"\']+)["\'][^>]+id=["\']pin-image-preload["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    }
    if (empty($imgUrl) && preg_match('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    } elseif (empty($imgUrl) && preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:image["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    }

    if ($imgUrl && str_contains($imgUrl, 'd53b014d86a6b6761bf649a0ed813c2b')) {
        $imgUrl = '';
    }

    $isVideoPin = (
        preg_match('/"isVideo":\s*true/i', $html) ||
        preg_match('/"video_list"/i', $html) ||
        preg_match('/<meta[^>]+property=["\']og:type["\'][^>]+content=["\']video/i', $html) ||
        preg_match('/<meta[^>]+content=["\']video[^"\']*["\'][^>]+property=["\']og:type["\']/i', $html) ||
        preg_match('/"digitalMediaSourceType":\s*"VIDEO"/i', $html) ||
        preg_match('/v[0-9]*\.pinimg\.com\\\\?\/videos/i', $html)
    );

    $videoUrl = '';
    $videoCandidates = [];

    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:video(?::secure_url|:url)?["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $videoCandidates[] = stripslashes($m[1]);
    } elseif (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:video(?::secure_url|:url)?["\']/i', $html, $m)) {
        $videoCandidates[] = stripslashes($m[1]);
    }

    if (preg_match_all('/https?:\\\\?\/\\\\?\/v[0-9]*\.pinimg\.com\\\\?\/videos\\\\?\/[^\s"\'<>]+\.mp4/i', $html, $mAllMp4)) {
        foreach ($mAllMp4[0] as $rawMp4) {
            $cleaned = stripslashes($rawMp4);
            if (str_contains($cleaned, '720p') || str_contains($cleaned, '1080p')) {
                array_unshift($videoCandidates, $cleaned);
            } else {
                $videoCandidates[] = $cleaned;
            }
        }
    }

    if (preg_match_all('/https?:\\\\?\/\\\\?\/v[0-9]*\.pinimg\.com\\\\?\/videos\\\\?\/[^\s"\'<>]+\.m3u8/i', $html, $mAllHls)) {
        foreach ($mAllHls[0] as $rawHls) {
            $hls = stripslashes($rawHls);
            $mp4_720 = preg_replace('/\/hls\//i', '/720p/', $hls);
            $mp4_720 = preg_replace('/\.m3u8(\?.*)?$/i', '.mp4$1', $mp4_720);
            $videoCandidates[] = $mp4_720;

            $mp4_exp = preg_replace('/\/hls\//i', '/exp/', $hls);
            $mp4_exp = preg_replace('/\.m3u8(\?.*)?$/i', '.mp4$1', $mp4_exp);
            $videoCandidates[] = $mp4_exp;
        }
    }

    $videoCandidates = array_values(array_unique(array_filter($videoCandidates)));

    foreach ($videoCandidates as $candidate) {
        $vHead = verifyMediaHead($candidate, 4);
        if ($vHead['ok']) {
            $videoUrl = $candidate;
            $isVideoPin = true;
            break;
        }
    }

    if (empty($videoUrl) && !empty($videoCandidates)) {
        foreach ($videoCandidates as $candidate) {
            if (str_contains(strtolower($candidate), '.mp4')) {
                $videoUrl = $candidate;
                $isVideoPin = true;
                break;
            }
        }
    }

    $notice = null;
    if ($isVideoPin && empty($videoUrl)) {
        $notice = "Ye video pin hai, lekin iska video stream load nahi ho saka. Sirf thumbnail image available hai.";
    }

    if (empty($imgUrl) && empty($videoUrl)) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'platform' => 'pinterest',
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'No downloadable media could be found for this pin. The pin may be private, deleted, or requires a login.'
            ]
        ]);
        exit;
    }

    $originalUrl = preg_replace('/\/[0-9]+x[0-9]*\//', '/originals/', $imgUrl);
    $origFormat = str_ends_with(strtolower($originalUrl), '.png') ? 'PNG' : (str_ends_with(strtolower($originalUrl), '.webp') ? 'WEBP' : 'JPG');

    $hdUrl = '';
    $hdFormat = 'JPG';

    if (preg_match('/"images_736x":\s*\{[^}]*"url":\s*"([^"]+)"/i', $html, $m736)) {
        $hdCandidate = stripslashes($m736[1]);
    } else {
        $hdCandidate = preg_replace('/\/originals\//', '/736x/', $originalUrl);
    }

    if ($hdCandidate !== $originalUrl) {
        $headRes = verifyMediaHead($hdCandidate);
        if ($headRes['ok']) {
            $hdUrl = $hdCandidate;
            $hdFormat = str_ends_with(strtolower($hdUrl), '.png') ? 'PNG' : (str_ends_with(strtolower($hdUrl), '.webp') ? 'WEBP' : 'JPG');
        } else {
            if (str_ends_with(strtolower($hdCandidate), '.png')) {
                $altJpg = preg_replace('/\.png$/i', '.jpg', $hdCandidate);
                $altHead = verifyMediaHead($altJpg);
                if ($altHead['ok']) {
                    $hdUrl = $altJpg;
                    $hdFormat = 'JPG';
                }
            }
        }
    }

    $items = [];
    if (!empty($videoUrl)) {
        $items[] = [
            'type' => 'video',
            'quality' => 'HD Video (MP4)',
            'format' => 'MP4',
            'url' => $videoUrl
        ];
    }
    if (!empty($originalUrl)) {
        $items[] = [
            'type' => 'image',
            'quality' => !empty($videoUrl) ? 'Cover Thumbnail (Original)' : 'Original (Highest Resolution)',
            'format' => $origFormat,
            'url' => $originalUrl
        ];
    }
    if (!empty($hdUrl)) {
        $items[] = [
            'type' => 'image',
            'quality' => !empty($videoUrl) ? 'Cover Thumbnail (736p HD)' : '736p (Standard HD)',
            'format' => $hdFormat,
            'url' => $hdUrl
        ];
    }

    echo json_encode([
        'ok' => true,
        'platform' => 'pinterest',
        'title' => $title,
        'thumbnail' => $originalUrl ?: $imgUrl,
        'isVideoPin' => (bool)$isVideoPin,
        'notice' => $notice,
        'items' => $items
    ]);
    exit;
}

// ==== 2. YOUTUBE RESOLVER ====
if ($platform === 'youtube') {

    $parsedYt = parse_url($inputUrl);
    $ytHost   = strtolower($parsedYt['host'] ?? '');
    $ytPath   = $parsedYt['path'] ?? '';
    parse_str($parsedYt['query'] ?? '', $ytQuery);

    $videoId   = null;
    $isShorts  = false;

    if ($ytHost === 'youtu.be') {
        $videoId = ltrim(strtok($ytPath, '?'), '/');
    } elseif (in_array($ytHost, ['youtube.com', 'www.youtube.com', 'm.youtube.com'], true)) {
        if (preg_match('#^/shorts/([A-Za-z0-9_-]{11})#', $ytPath, $sm)) {
            $videoId  = $sm[1];
            $isShorts = true;
        } elseif (isset($ytQuery['v']) && preg_match('/^[A-Za-z0-9_-]{11}$/', $ytQuery['v'])) {
            $videoId = $ytQuery['v'];
        } elseif (preg_match('#^/embed/([A-Za-z0-9_-]{11})#', $ytPath, $em)) {
            $videoId = $em[1];
        }
    }

    if (empty($videoId) || !preg_match('/^[A-Za-z0-9_-]{11}$/', $videoId)) {
        http_response_code(400);
        echo json_encode([
            'ok'       => false,
            'platform' => 'youtube',
            'error'    => [
                'code'    => 'INVALID_URL',
                'message' => 'Could not extract a valid YouTube video ID from this URL. Supported formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID.'
            ]
        ]);
        exit;
    }

    // Forward to custom provider if configured
    $providerUrl = getenv('DOWNLOADER_YOUTUBE_PROVIDER') ?: '';
    if (!empty($providerUrl)) {
        $pvHost = strtolower(parse_url($providerUrl, PHP_URL_HOST) ?? '');
        if (isHostPublic($pvHost)) {
            $ch = curl_init($providerUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['url' => $inputUrl, 'video_id' => $videoId, 'is_shorts' => $isShorts]));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            applySsl($ch);
            $resp     = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($resp !== false && $httpCode >= 200 && $httpCode < 300) {
                header('Content-Type: application/json; charset=utf-8');
                echo $resp;
                exit;
            }
        }
    }

    $ytData = null;
    $usedInstHost = '';

    // Primary: Direct Google Innertube API with ANDROID client (directly signs URLs for this server's IP)
    $ch = curl_init('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'videoId' => $videoId,
        'contentCheckOk' => true,
        'racyCheckOk' => true,
        'context' => [
            'client' => [
                'clientName' => 'ANDROID',
                'clientVersion' => '21.26.364',
                'androidSdkVersion' => 30,
                'osName' => 'Android',
                'osVersion' => '11',
                'hl' => 'en',
                'gl' => 'US'
            ]
        ]
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    applySsl($ch);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'User-Agent: com.google.android.youtube/21.26.364 (Linux; U; Android 11) gzip'
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code === 200 && $raw) {
        $parsed = json_decode($raw, true);
        if (($parsed['playabilityStatus']['status'] ?? '') === 'OK' && !empty($parsed['videoDetails'])) {
            $ytData = [
                'title' => $parsed['videoDetails']['title'] ?? 'YouTube Video',
                'lengthSeconds' => $parsed['videoDetails']['lengthSeconds'] ?? 0,
                'adaptiveFormats' => $parsed['streamingData']['adaptiveFormats'] ?? [],
                'formatStreams' => $parsed['streamingData']['formats'] ?? []
            ];
            $usedInstHost = '';
        }
    }

    // Secondary fallback: Native resolution via Invidious public instance rotation
    if (!$ytData) {
        $invidiousInstances = [
            "https://yt.chocolatemoo53.com",
            "https://invidious.nerdvpn.de",
            "https://inv.nadeko.net",
            "https://invidious.slipfox.xyz"
        ];
        foreach ($invidiousInstances as $inst) {
            $ch = curl_init("$inst/api/v1/videos/$videoId");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            applySsl($ch);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            $raw = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code == 200 && $raw) {
                $parsed = json_decode($raw, true);
                if (!empty($parsed['title']) && (!empty($parsed['adaptiveFormats']) || !empty($parsed['formatStreams']))) {
                    $ytData = $parsed;
                    $usedInstHost = parse_url($inst, PHP_URL_HOST) ?: 'yt.chocolatemoo53.com';
                    break;
                }
            }
        }
    }

    // Secondary fallback via m.youtube.com scrape
    if (!$ytData) {
        $mUrl = "https://m.youtube.com/watch?v=$videoId";
        $ch = curl_init($mUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        applySsl($ch);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15');
        $mHtml = curl_exec($ch);
        curl_close($ch);
        if ($mHtml && preg_match('/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s', $mHtml, $mm)) {
            $parsed = json_decode($mm[1], true);
            if (isset($parsed['videoDetails'])) {
                $ytData = [
                    'title' => $parsed['videoDetails']['title'] ?? 'YouTube Video',
                    'lengthSeconds' => $parsed['videoDetails']['lengthSeconds'] ?? 0,
                    'adaptiveFormats' => $parsed['streamingData']['adaptiveFormats'] ?? [],
                    'formatStreams' => $parsed['streamingData']['formats'] ?? []
                ];
                $usedInstHost = '';
            }
        }
    }

    if (!$ytData) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'platform' => 'youtube',
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Could not resolve this YouTube video. It may be private, age-restricted, or removed.'
            ]
        ]);
        exit;
    }

    $title = $ytData['title'] ?? 'YouTube Video';
    $durationSec = (int)($ytData['lengthSeconds'] ?? 0);
    $duration = $durationSec > 0 ? gmdate($durationSec > 3600 ? "H:i:s" : "i:s", $durationSec) : '';
    $thumbnail = "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg";

    $makeProxyUrl = function ($rawUrl) use ($usedInstHost) {
        if (empty($rawUrl)) return '';
        if (!empty($usedInstHost)) {
            $parsed = parse_url($rawUrl);
            $path = $parsed['path'] ?? '/videoplayback';
            $query = isset($parsed['query']) ? ('?' . $parsed['query']) : '';
            return "https://{$usedInstHost}{$path}{$query}";
        }
        return $rawUrl;
    };

    // Vertical resolution of a format. Uses quality label first, then size/width/height (short side).
    $heightOf = function (array $f): int {
        foreach ([$f['qualityLabel'] ?? '', $f['resolution'] ?? ''] as $str) {
            if ($str && preg_match('/(\d{3,4})p/i', $str, $m)) return (int)$m[1];
        }
        if (!empty($f['width']) && !empty($f['height'])) {
            return min((int)$f['width'], (int)$f['height']);
        }
        if (!empty($f['size']) && preg_match('/(\d+)x(\d+)/i', (string)$f['size'], $m)) {
            return min((int)$m[1], (int)$m[2]);
        }
        if (!empty($f['resolution']) && preg_match('/x(\d+)/i', $f['resolution'], $m)) return (int)$m[1];
        return 0;
    };

    $tierOf = function (int $h): ?string {
        if ($h >= 2160) return '2160p 4K';
        if ($h >= 1440) return '1440p 2K';
        if ($h >= 1000) return '1080p Full HD';
        if ($h >= 700)  return '720p HD';
        if ($h >= 480)  return '480p';
        if ($h >= 360)  return '360p';
        if ($h >= 240)  return '240p';
        return null;
    };

    $mbOf = function (array $f): ?string {
        $n = (int)($f['clen'] ?? $f['contentLength'] ?? 0);
        if ($n > 0) return round($n / (1024 * 1024), 1) . ' MB';
        return !empty($f['size']) && !preg_match('/x/', (string)$f['size']) ? (string)$f['size'] : null;
    };

    // ---- Best audio stream (largest MP4/AAC) ----
    $bestAudioUrl = null;
    $bestAudioSize = null;
    $maxAudioClen = -1;
    if (!empty($ytData['adaptiveFormats'])) {
        foreach ($ytData['adaptiveFormats'] as $af) {
            $type = $af['type'] ?? $af['mimeType'] ?? '';
            $clen = (int)($af['clen'] ?? $af['contentLength'] ?? 0);
            if ((str_starts_with($type, 'audio/mp4') || str_contains($type, 'mp4a')) && !empty($af['url'])) {
                if ($clen > $maxAudioClen || $bestAudioUrl === null) {
                    $maxAudioClen = $clen;
                    $bestAudioUrl = $makeProxyUrl($af['url']);
                    $bestAudioSize = $clen > 0 ? round($clen / (1024 * 1024), 1) . ' MB' : null;
                }
            }
        }
        if (!$bestAudioUrl) {
            foreach ($ytData['adaptiveFormats'] as $af) {
                $type = $af['type'] ?? $af['mimeType'] ?? '';
                $clen = (int)($af['clen'] ?? $af['contentLength'] ?? 0);
                if (str_starts_with($type, 'audio/') && !empty($af['url'])) {
                    if ($clen > $maxAudioClen || $bestAudioUrl === null) {
                        $maxAudioClen = $clen;
                        $bestAudioUrl = $makeProxyUrl($af['url']);
                        $bestAudioSize = $clen > 0 ? round($clen / (1024 * 1024), 1) . ' MB' : null;
                    }
                }
            }
        }
    }

    $checkHasAudio = function (array $f): bool {
        $type = $f['type'] ?? $f['mimeType'] ?? '';
        return (
            str_contains($type, 'mp4a') ||
            str_contains($type, 'opus') ||
            str_contains($type, 'vorbis') ||
            str_starts_with($type, 'audio/') ||
            !empty($f['audioChannels']) ||
            !empty($f['audioSampleRate']) ||
            !empty($f['audioBitrate'])
        );
    };

    $videoItems = [];      // each: ['h' => int, 'item' => array]
    $seenQualities = [];
    $hasRecommended = false;

    // ---- STEP 1: Progressive formats FIRST (video + audio already combined, always has sound) ----
    if (!empty($ytData['formatStreams'])) {
        foreach ($ytData['formatStreams'] as $fs) {
            $type = $fs['type'] ?? $fs['mimeType'] ?? '';
            if ($type !== '' && !str_starts_with($type, 'video/mp4')) continue;
            $url = $makeProxyUrl($fs['url'] ?? '');
            if (!$url) continue;

            $h = $heightOf($fs);
            $tier = $tierOf($h);
            if ($tier === null || isset($seenQualities[$tier])) continue;
            $seenQualities[$tier] = true;

            $hasAudio = $checkHasAudio($fs);
            $isRec = !$hasRecommended;
            if ($isRec) $hasRecommended = true;

            $videoItems[] = [
                'h' => $h,
                'item' => [
                    'type' => 'video',
                    'quality' => "$tier (Video + Voice)",
                    'format' => 'MP4',
                    'size' => $mbOf($fs),
                    'url' => $url,
                    'hasAudio' => $hasAudio,
                    'needsMerge' => false,
                    'recommended' => $isRec,
                    'isHighest' => false
                ]
            ];
        }
    }

    // ---- STEP 2: Adaptive (video-only) formats for tiers that progressive did not cover ----
    if (!empty($ytData['adaptiveFormats']) && !empty($bestAudioUrl)) {
        $videoAdaptive = [];
        foreach ($ytData['adaptiveFormats'] as $af) {
            $type = $af['type'] ?? $af['mimeType'] ?? '';
            $isVideo = str_starts_with($type, 'video/mp4') || str_starts_with($type, 'video/webm');
            if ($isVideo && !empty($af['url'])) {
                $videoAdaptive[] = $af;
            }
        }

        // Highest resolution first, MP4 preferred over WebM at the same resolution
        usort($videoAdaptive, function ($a, $b) use ($heightOf) {
            $numA = $heightOf($a);
            $numB = $heightOf($b);
            if ($numA !== $numB) return $numB <=> $numA;
            $isMp4A = str_starts_with($a['type'] ?? $a['mimeType'] ?? '', 'video/mp4') ? 1 : 0;
            $isMp4B = str_starts_with($b['type'] ?? $b['mimeType'] ?? '', 'video/mp4') ? 1 : 0;
            return $isMp4B <=> $isMp4A;
        });

        foreach ($videoAdaptive as $af) {
            $h = $heightOf($af);
            $tier = $tierOf($h);
            if ($tier === null || isset($seenQualities[$tier])) continue;
            $seenQualities[$tier] = true;

            $hasAudio = $checkHasAudio($af);

            $videoItems[] = [
                'h' => $h,
                'item' => [
                    'type' => 'video',
                    'quality' => "$tier (Merged Video + Voice)",
                    'format' => 'MP4',
                    'size' => $mbOf($af),
                    'url' => $makeProxyUrl($af['url']),
                    'audioUrl' => $bestAudioUrl,
                    'hasAudio' => $hasAudio,
                    'needsMerge' => true,
                    'recommended' => false,
                    'isHighest' => false
                ]
            ];
        }
    }

    // ---- Sort video cards high to low and mark the top one ----
    usort($videoItems, function ($a, $b) {
        return $b['h'] <=> $a['h'];
    });

    $items = [];
    foreach ($videoItems as $i => $vi) {
        $vi['item']['isHighest'] = ($i === 0);
        $items[] = $vi['item'];
    }

    // ---- Audio-only ----
    if (!empty($bestAudioUrl)) {
        $items[] = [
            'type' => 'audio',
            'quality' => 'Audio Only (MP3 / M4A)',
            'format' => 'm4a',
            'size' => $bestAudioSize,
            'url' => $bestAudioUrl,
            'hasAudio' => true,
            'needsMerge' => false,
            'isHighest' => false
        ];
    }

    // ---- Thumbnail ----
    $items[] = [
        'type' => 'image',
        'quality' => 'HD Thumbnail (JPG)',
        'format' => 'JPG',
        'url' => $thumbnail,
        'hasAudio' => false,
        'needsMerge' => false,
        'isHighest' => false
    ];

    echo json_encode([
        'ok' => true,
        'platform' => 'youtube',
        'title' => $title,
        'thumbnail' => $thumbnail,
        'duration' => $duration,
        'isShorts' => (bool)$isShorts,
        'source' => $usedInstHost !== '' ? ('invidious:' . $usedInstHost) : 'direct-youtube',
        'items' => $items
    ]);
    exit;
}

// ==== 3. INSTAGRAM RESOLVER ====
if ($platform === 'instagram') {

    $parsedIg  = parse_url($inputUrl);
    $igPath    = rtrim($parsedIg['path'] ?? '', '/');

    $shortcode = null;
    $mediaType = 'reel';

    if (preg_match('#^/reel(?:s)?/([A-Za-z0-9_-]+)#', $igPath, $igm)) {
        $shortcode = $igm[1];
        $mediaType = 'reel';
    } elseif (preg_match('#^/p/([A-Za-z0-9_-]+)#', $igPath, $igm)) {
        $shortcode = $igm[1];
        $mediaType = 'post';
    } elseif (preg_match('#^/tv/([A-Za-z0-9_-]+)#', $igPath, $igm)) {
        $shortcode = $igm[1];
        $mediaType = 'igtv';
    }

    if (empty($shortcode)) {
        http_response_code(400);
        echo json_encode([
            'ok'       => false,
            'platform' => 'instagram',
            'error'    => [
                'code'    => 'INVALID_URL',
                'message' => 'Could not extract a valid Instagram shortcode. Supported formats: /reel/, /reels/, /p/, /tv/ URLs.'
            ]
        ]);
        exit;
    }

    $providerUrl = getenv('DOWNLOADER_INSTAGRAM_PROVIDER') ?: '';
    if (!empty($providerUrl)) {
        $pvHost = strtolower(parse_url($providerUrl, PHP_URL_HOST) ?? '');
        if (isHostPublic($pvHost)) {
            $ch = curl_init($providerUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'url'        => $inputUrl,
                'shortcode'  => $shortcode,
                'media_type' => $mediaType
            ]));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            applySsl($ch);
            $resp     = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($resp !== false && $httpCode >= 200 && $httpCode < 300) {
                header('Content-Type: application/json; charset=utf-8');
                echo $resp;
                exit;
            }
        }
    }

    $fetchUrl = "https://www.instagram.com/reel/{$shortcode}/";
    $ch = curl_init($fetchUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    applySsl($ch);
    curl_setopt($ch, CURLOPT_USERAGENT, 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: en-US,en;q=0.9'
    ]);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 400 || empty($html)) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'platform' => 'instagram',
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Could not load this Instagram post. The account or reel may be private or deleted.'
            ]
        ]);
        exit;
    }

    if (str_contains($html, 'login') && !str_contains($html, 'og:image')) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'platform' => 'instagram',
            'error' => [
                'code' => 'PRIVATE_CONTENT',
                'message' => 'This reel is from a private account or requires an Instagram login to view.'
            ]
        ]);
        exit;
    }

    $title = '';
    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $tm)) {
        $title = $tm[1];
    } elseif (preg_match('/<title>([^<]+)<\/title>/i', $html, $tm)) {
        $title = $tm[1];
    }
    $title = html_entity_decode(trim(preg_replace('/\s*[\-\|]\s*Instagram.*$/i', '', $title)), ENT_QUOTES, 'UTF-8');
    if (!$title) {
        $title = "Instagram Reel ({$shortcode})";
    }

    $thumbnail = '';
    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $im)) {
        $thumbnail = html_entity_decode($im[1], ENT_QUOTES, 'UTF-8');
    }

    $videoUrl = '';
    $videoSize = null;
    $videoCandidates = [];
    if (preg_match_all('/https?:\\\\?\/\\\\?[^"\'<>\s]+\.mp4[^"\'<>\s]*/i', $html, $allMp4)) {
        foreach ($allMp4[0] as $raw) {
            $cleaned = stripslashes($raw);
            $cleaned = html_entity_decode($cleaned, ENT_QUOTES, 'UTF-8');
            $cleaned = str_replace('\u0026', '&', $cleaned);
            $cleaned = preg_replace('/(\\\\?u003c|<\/)[a-zA-Z0-9_\-]+.*$/i', '', $cleaned);
            if (str_contains($cleaned, 'progressive') || str_contains($cleaned, 'xpv_progressive')) {
                array_unshift($videoCandidates, $cleaned);
            } else {
                $videoCandidates[] = $cleaned;
            }
        }
        $videoCandidates = array_values(array_unique(array_filter($videoCandidates)));

        foreach ($videoCandidates as $cand) {
            $head = curl_init($cand);
            curl_setopt($head, CURLOPT_NOBODY, true);
            curl_setopt($head, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($head, CURLOPT_TIMEOUT, 4);
            curl_setopt($head, CURLOPT_USERAGENT, 'Mozilla/5.0');
            curl_exec($head);
            $hCode = curl_getinfo($head, CURLINFO_HTTP_CODE);
            $hSize = curl_getinfo($head, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
            curl_close($head);
            if ($hCode >= 200 && $hCode < 400 && $hSize > 100000) {
                $videoUrl = $cand;
                $videoSize = round($hSize / (1024 * 1024), 1) . ' MB';
                break;
            }
        }

        if (empty($videoUrl) && !empty($videoCandidates)) {
            $videoUrl = $videoCandidates[0];
        }
    }

    $items = [];
    if (!empty($videoUrl)) {
        $items[] = [
            'type' => 'video',
            'quality' => 'HD Video (MP4)',
            'format' => 'MP4',
            'size' => $videoSize,
            'url' => $videoUrl
        ];
    }
    if (!empty($thumbnail)) {
        $items[] = [
            'type' => 'image',
            'quality' => 'Cover Thumbnail (JPG)',
            'format' => 'JPG',
            'url' => $thumbnail
        ];
    }

    if (empty($items)) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'platform' => 'instagram',
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'No downloadable video or photo found for this Instagram link. The post may be private or deleted.'
            ]
        ]);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'platform' => 'instagram',
        'title' => $title,
        'thumbnail' => $thumbnail,
        'items' => $items
    ]);
    exit;
}

// Unknown platform fallthrough
http_response_code(400);
echo json_encode([
    'ok' => false,
    'error' => ['code' => 'UNSUPPORTED_PLATFORM', 'message' => 'Unsupported platform.']
]);
