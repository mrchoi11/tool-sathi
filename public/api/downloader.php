<?php
/**
 * ProToolBox Unified Media Downloader Gateway (PHP)
 * Provides standardized resolution & download streaming for:
 *   - Pinterest Images & Videos (Phase 1)
 *   - YouTube Videos & Shorts (Phase 2 - Provider Adapter)
 *   - Instagram Reels & Photos (Phase 3 - Provider Adapter)
 *
 * Security & Hardening Features:
 *   - Strict Origin CORS: Restricted to protoolbox.in & localhost dev
 *   - SSRF Protection with Per-Hop Redirect Validation (Blocks RFC1918, 127.0.0.1, AWS metadata 169.254)
 *   - Strict Platform & CDN Domain Allowlist
 *   - Per-IP Rate Limiting (Fixed 15 req/min, stored outside web directory)
 *   - File Stream Protection: Max 30MB for images, 150MB for video with Content-Disposition
 */

// Global Limits & Execution Time
@ini_set('max_execution_time', 45);
@ini_set('memory_limit', '256M');

// ─── 1. STRICT CORS RESTRICTION ──────────────────────────────────────────────
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
    // Default fallback to primary production domain
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

// ─── SAFE SYSTEM PROCESS AVAILABILITY CHECKS ────────────────────────────────
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

// Global Fatal Shutdown Handler to guarantee clean JSON response instead of empty 500
register_shutdown_function(function() {
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

// ─── OPTIONAL SECRET CONFIG ──────────────────────────────────────────────────
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// ─── 2. CLIENT IP & RATE LIMITING ───────────────────────────────────────────
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

    // Only trust CF-Connecting-IP if request was physically proxied through Cloudflare IP ranges
    if (isCloudflareProxyIp($remote) && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $cf = trim(explode(',', $_SERVER['HTTP_CF_CONNECTING_IP'])[0]);
        if (filter_var($cf, FILTER_VALIDATE_IP)) {
            return $cf;
        }
    }
    return $remote;
}

// Rate Limiting (Strict 15 requests / min per IP, stored outside webroot)
function checkRateLimit() {
    $RATE_LIMIT = 15;
    $WINDOW_SECONDS = 60;

    $ip = getTrustedClientIp();

    // Stored strictly outside web-accessible directory
    $storageDir = sys_get_temp_dir() . '/ptb_security';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0700, true);
    }
    $file = $storageDir . '/rate_' . md5($ip) . '.json';

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

    if ($data['count'] >= $RATE_LIMIT) {
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'RATE_LIMIT',
                'message' => 'Rate limit exceeded (15 requests/min). Please wait a moment and try again.'
            ]
        ]);
        exit;
    }

    $data['count']++;
    @file_put_contents($file, json_encode($data), LOCK_EX);
}

// ─── 3. STRICT SSRF & HOST ALLOWLIST VALIDATION ──────────────────────────────
function isHostAllowlisted(string $host, array $allowedList): bool {
    $host = strtolower(trim($host));
    if (!$host) return false;
    foreach ($allowedList as $allowed) {
        $allowed = strtolower(trim($allowed));
        // Strict exact match or subdomain with a dot
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
    // PHP FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE checks both IPv4 & IPv6
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return true;
    }
    $ipLower = strtolower($ip);
    // Explicit loopback & null checks
    if ($ipLower === '::1' || $ipLower === '0.0.0.0' || $ipLower === '::' || $ipLower === 'localhost') {
        return true;
    }
    // IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:192.168.1.1, etc.)
    if (str_starts_with($ipLower, '::ffff:')) {
        $v4 = substr($ipLower, 7);
        if (!filter_var($v4, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return true;
        }
    }
    // IPv6 link-local (fe80::/10) and unique local (fc00::/7)
    $bin = @inet_pton($ip);
    if ($bin !== false && strlen($bin) === 16) {
        $b0 = ord($bin[0]);
        if (($b0 & 0xFE) === 0xFC) return true; // fc00::/7
        if ($b0 === 0xFE && (ord($bin[1]) & 0xC0) === 0x80) return true; // fe80::/10
    }
    return false;
}

function isAllowedDomain($url, $context = 'resolve') {
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
    if (!$host) return false;

    // Block obvious private hostnames
    if ($host === 'localhost' || str_ends_with($host, '.local') || str_ends_with($host, '.internal') || str_ends_with($host, '.lan')) {
        return false;
    }

    // Platform input domains allowed for resolution
    $platformDomains = [
        'pinterest.com', 'pin.it', 'www.pinterest.com', 'in.pinterest.com', 'api.pinterest.com',
        'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
        'instagram.com', 'www.instagram.com'
    ];

    // CDN domains strictly allowed for file streaming/downloading
    $cdnDomains = [
        'pinimg.com', 'i.pinimg.com', 'v.pinimg.com', 'v1.pinimg.com', 'v2.pinimg.com', 's.pinimg.com',
        'googlevideo.com', 'ytimg.com', 'i.ytimg.com',
        'chocolatemoo53.com', 'jing.rocks', 'nerdvpn.de', 'projectsegfau.lt', 'slipfox.xyz', 'nadeko.net',
        'cdninstagram.com', 'fbcdn.net'
    ];

    $targetList = ($context === 'stream') ? $cdnDomains : $platformDomains;

    // Step 1: Strict Exact or Subdomain-with-Dot check (blocks evilpinimg.com, i.pinimg.com.evil.com)
    if (!isHostAllowlisted($host, $targetList)) {
        return false;
    }

    // Step 2: SSRF & IP Validation (Check IPv4 and IPv6)
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

// ─── 4. SAFE MULTI-HOP REDIRECT FETCHER (Validates every hop) ─────────────────
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
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Strict manual inspection per hop
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.9',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        curl_close($ch);

        if ($response === false) {
            return ['success' => false, 'error' => 'Network error connecting to platform.', 'code' => 502];
        }

        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);

        // Check if redirect
        if (in_array($httpCode, [301, 302, 303, 307, 308], true)) {
            if (preg_match('/^Location:\s*(.*)$/mi', $headers, $locMatches)) {
                $location = trim($locMatches[1]);
                if (str_starts_with($location, '//')) {
                    $location = 'https:' . $location;
                } elseif (!preg_match('/^https?:\/\//i', $location)) {
                    $parts = parse_url($currentUrl);
                    $base = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? 'pinterest.com');
                    $location = $base . (str_starts_with($location, '/') ? '' : '/') . $location;
                }
                $currentUrl = $location;
                continue; // Next hop evaluated through isAllowedDomain!
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

// Read Request Input
$action = $_GET['action'] ?? $_POST['action'] ?? 'resolve';
$inputUrl = trim($_GET['url'] ?? $_POST['url'] ?? '');

if (empty($inputUrl)) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $inputUrl = trim($body['url'] ?? '');
    if (empty($action) || $action === 'resolve') {
        $action = $body['action'] ?? 'resolve';
    }
}

// Enforce per-IP rate limit across all actions (15 requests/minute)
checkRateLimit();

// ─────────────────────────────────────────────────────────────────────────────
// ─── ACTION: MERGE_STREAM (Server-side FFmpeg audio+video muxing) ────────────
// ─────────────────────────────────────────────────────────────────────────────
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

    // Function to discover ffmpeg binary on the host system
    $findFfmpeg = function(): ?string {
        if (!isShellExecAvailable() || !isProcOpenAvailable()) {
            return null;
        }

        $candidates = ['ffmpeg', '/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/bin/ffmpeg'];

        $userProfile = getenv('USERPROFILE') ?: '';
        if ($userProfile) {
            $ffmpegExe = glob($userProfile . '/AppData/Roaming/Python/Python*/site-packages/imageio_ffmpeg/binaries/ffmpeg-*.exe');
            if (!empty($ffmpegExe)) {
                foreach ($ffmpegExe as $exe) {
                    $candidates[] = '"' . $exe . '"';
                }
            }
        }

        foreach ($candidates as $bin) {
            $ver = @shell_exec("$bin -version 2>&1");
            if ($ver && stripos($ver, 'ffmpeg version') !== false) {
                return $bin;
            }
        }
        return null;
    };

    $ffmpegBin = $findFfmpeg();
    if (!$ffmpegBin) {
        // Return 501 so the client automatically executes lossless client-side WebAssembly merge
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

    // Stream merged video and audio via FFmpeg pipe (lossless stream copy)
    header('Content-Type: video/mp4');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: public, max-age=86400');
    if (ob_get_level() > 0) {
        @ob_end_clean();
    }

    $ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
    $cmd = escapeshellcmd($ffmpegBin)
         . " -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5"
         . " -headers " . escapeshellarg("User-Agent: $ua\r\n")
         . " -i " . escapeshellarg($videoUrl);

    if (!empty($audioUrl) && isAllowedDomain($audioUrl, 'stream')) {
        $cmd .= " -headers " . escapeshellarg("User-Agent: $ua\r\n")
             . " -i " . escapeshellarg($audioUrl)
             . " -c:v copy -c:a aac -movflags +faststart+frag_keyframe+empty_moov -f mp4 pipe:1 2>/dev/null";
    } else {
        $cmd .= " -c:v copy -movflags +faststart+frag_keyframe+empty_moov -f mp4 pipe:1 2>/dev/null";
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
        }
        fclose($pipes[1]);
        proc_close($proc);
        exit;
    }

    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => ['code' => 'PROC_FAILED', 'message' => 'Could not spawn merge process.']]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── ACTION: STREAM (Safe CDN download streaming proxy with size limits) ─────
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'stream') {
    if (empty($inputUrl) || !isAllowedDomain($inputUrl, 'stream')) {
        http_response_code(400);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Invalid or disallowed download URL.';
        exit;
    }

    $streamTargetUrl = $inputUrl;

    $filename = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $_GET['filename'] ?? 'protoolbox_download');
    if (!str_contains($filename, '.')) {
        $filename .= '.jpg';
    }

    // Determine max file size (30MB for images, 150MB for videos/audio)
    $isMediaVideo = str_contains($streamTargetUrl, '.mp4') || preg_match('/v[0-9]*\.pinimg\.com/i', $streamTargetUrl) || str_contains($streamTargetUrl, 'videoplayback') || str_ends_with(strtolower($filename), '.mp4') || str_ends_with(strtolower($filename), '.m4a') || str_ends_with(strtolower($filename), '.mp3');
    $MAX_ALLOWED_BYTES = $isMediaVideo ? 150 * 1024 * 1024 : 30 * 1024 * 1024;

    $headersSent = false;
    $upstreamStatus = 0;
    $upstreamClen = 0;
    $upstreamType = '';
    $bytesTransferred = 0;

    // Stream download with safe in-flight header detection & byte-count enforcement
    $ch = curl_init($streamTargetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
    curl_setopt($ch, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36');
    if (preg_match('/pinimg\.com/i', $streamTargetUrl)) {
        curl_setopt($ch, CURLOPT_REFERER, 'https://www.pinterest.com/');
    }

    // Capture response headers from upstream
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($ch, $headerLine) use (&$upstreamStatus, &$upstreamClen, &$upstreamType) {
        $len = strlen($headerLine);
        if (preg_match('#^HTTP/[\d\.]+\s+(\d+)#i', $headerLine, $m)) {
            $upstreamStatus = (int)$m[1];
        } elseif (preg_match('/^Content-Length:\s*(\d+)/i', $headerLine, $m)) {
            $upstreamClen = (int)$m[1];
        } elseif (preg_match('/^Content-Type:\s*([^\r\n;]+)/i', $headerLine, $m)) {
            $upstreamType = trim($m[1]);
        }
        return $len;
    });

    // Stream body only after validating upstream success
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) use (&$headersSent, &$upstreamStatus, &$upstreamClen, &$upstreamType, &$bytesTransferred, $MAX_ALLOWED_BYTES, $filename, $isMediaVideo) {
        $len = strlen($data);
        if ($upstreamStatus >= 300 && $upstreamStatus < 400) {
            // Upstream redirect in progress (e.g. 302 Found) - skip intermediate redirect body
            return $len;
        }

        if (!$headersSent) {
            // Check if upstream returned success (200 OK or 206 Partial Content)
            if ($upstreamStatus === 200 || $upstreamStatus === 206) {
                if ($upstreamClen > 0 && $upstreamClen > $MAX_ALLOWED_BYTES) {
                    http_response_code(413);
                    header('Content-Type: text/plain; charset=utf-8');
                    echo 'File exceeds maximum allowed download limit.';
                    return 0;
                }

                header('Content-Disposition: attachment; filename="' . $filename . '"');
                if (str_ends_with(strtolower($filename), '.mp4')) {
                    header('Content-Type: video/mp4');
                } elseif (str_ends_with(strtolower($filename), '.m4a')) {
                    header('Content-Type: audio/mp4');
                } elseif (str_ends_with(strtolower($filename), '.mp3')) {
                    header('Content-Type: audio/mpeg');
                } elseif ($upstreamType && !str_contains($upstreamType, 'text/html')) {
                    header('Content-Type: ' . $upstreamType);
                } else {
                    header('Content-Type: ' . ($isMediaVideo ? 'video/mp4' : 'image/jpeg'));
                }
                if ($upstreamClen > 0 && $upstreamClen <= $MAX_ALLOWED_BYTES) {
                    header('Content-Length: ' . (int)$upstreamClen);
                }
                header('Cache-Control: public, max-age=86400');
                $headersSent = true;
            } else {
                // Abort write if upstream returned error (4xx/5xx)
                return 0;
            }
        }

        $bytesTransferred += $len;
        if ($bytesTransferred > $MAX_ALLOWED_BYTES) {
            // Abort transfer immediately if size limit is exceeded during streaming
            return 0;
        }

        echo $data;
        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
        return $len;
    });

    $success = curl_exec($ch);
    $curlErr = curl_error($ch);
    curl_close($ch);

    // If headers were never sent, return structured error instead of empty file
    if (!$headersSent) {
        http_response_code($upstreamStatus >= 400 ? $upstreamStatus : 502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => [
                'code' => 'STREAM_FAILED',
                'message' => 'Could not stream media file. Upstream server response code: ' . ($upstreamStatus ?: 'Connection Failed')
            ]
        ]);
        exit;
    }
    exit;
}

// Fast HEAD check helper for verifying media assets (with Referer & Range fallback)
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

    // If HEAD failed with 403, 405 or non-200, fallback to Range 0-100 GET
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

// ─────────────────────────────────────────────────────────────────────────────
// ─── ACTION: RESOLVE MEDIA METADATA & DOWNLOAD LINKS ─────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
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

// Detect Platform
$host = strtolower(parse_url($inputUrl, PHP_URL_HOST) ?? '');
$platform = 'unknown';
if (str_contains($host, 'pinterest') || str_contains($host, 'pin.it')) {
    $platform = 'pinterest';
} elseif (str_contains($host, 'youtube') || str_contains($host, 'youtu.be')) {
    $platform = 'youtube';
} elseif (str_contains($host, 'instagram')) {
    $platform = 'instagram';
}

// ─── 1. PINTEREST RESOLVER (PHASE 1) ─────────────────────────────────────────
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

    // Check if the pin redirected to the Pinterest homepage (deleted / expired short link)
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

    // Extract Title (attribute order independent & cleaned up)
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

    // Extract Image URL
    $imgUrl = '';
    // Priority 1: Direct original image from internal __PWS_DATA__
    if (preg_match('/"images_orig":\s*\{[^}]*"url":\s*"([^"]+)"/i', $html, $m)) {
        $imgUrl = stripslashes($m[1]);
    }
    // Priority 2: JSON-LD image field
    if (empty($imgUrl) && preg_match('/"image":\s*"(https?:\\\\?\/\\\\?\/i\.pinimg\.com\\\\?\/originals\\\\?\/[^"]+)"/i', $html, $m)) {
        $imgUrl = stripslashes($m[1]);
    }
    // Priority 3: Preloaded high-priority image link
    if (empty($imgUrl) && preg_match('/<link[^>]+id=["\']pin-image-preload["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    } elseif (empty($imgUrl) && preg_match('/<link[^>]+href=["\']([^"\']+)["\'][^>]+id=["\']pin-image-preload["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    }
    // Priority 4: OpenGraph / Twitter meta tag
    if (empty($imgUrl) && preg_match('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    } elseif (empty($imgUrl) && preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:image["\']/i', $html, $m)) {
        $imgUrl = $m[1];
    }

    // Exclude Pinterest's internal UI sprite / placeholders
    if ($imgUrl && str_contains($imgUrl, 'd53b014d86a6b6761bf649a0ed813c2b')) {
        $imgUrl = '';
    }

    // Check if this pin is a video pin (various flags)
    $isVideoPin = (
        preg_match('/"isVideo":\s*true/i', $html) ||
        preg_match('/"video_list"/i', $html) ||
        preg_match('/<meta[^>]+property=["\']og:type["\'][^>]+content=["\']video/i', $html) ||
        preg_match('/<meta[^>]+content=["\']video[^"\']*["\'][^>]+property=["\']og:type["\']/i', $html) ||
        preg_match('/"digitalMediaSourceType":\s*"VIDEO"/i', $html) ||
        preg_match('/v[0-9]*\.pinimg\.com\\\\?\/videos/i', $html)
    );

    // Extract Video MP4 streams (from OpenGraph, direct MP4, embedded JSON, or converted HLS)
    $videoUrl = '';
    $videoCandidates = [];

    // Priority 1: OpenGraph video tags
    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:video(?::secure_url|:url)?["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $videoCandidates[] = stripslashes($m[1]);
    } elseif (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:video(?::secure_url|:url)?["\']/i', $html, $m)) {
        $videoCandidates[] = stripslashes($m[1]);
    }

    // Priority 2: Direct 720p / 1080p MP4 from HTML or embedded JSON
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

    // Priority 3: HLS stream (.m3u8) converted to 720p / exp MP4
    if (preg_match_all('/https?:\\\\?\/\\\\?\/v[0-9]*\.pinimg\.com\\\\?\/videos\\\\?\/[^\s"\'<>]+\.m3u8/i', $html, $mAllHls)) {
        foreach ($mAllHls[0] as $rawHls) {
            $hls = stripslashes($rawHls);
            // Convert /hls/ to /720p/ and .m3u8 to .mp4
            $mp4_720 = preg_replace('/\/hls\//i', '/720p/', $hls);
            $mp4_720 = preg_replace('/\.m3u8(\?.*)?$/i', '.mp4$1', $mp4_720);
            $videoCandidates[] = $mp4_720;

            // Fallback: /exp/
            $mp4_exp = preg_replace('/\/hls\//i', '/exp/', $hls);
            $mp4_exp = preg_replace('/\.m3u8(\?.*)?$/i', '.mp4$1', $mp4_exp);
            $videoCandidates[] = $mp4_exp;
        }
    }

    // De-duplicate candidates while preserving priority order
    $videoCandidates = array_values(array_unique(array_filter($videoCandidates)));

    // Verify candidates to pick the working video URL
    foreach ($videoCandidates as $candidate) {
        $vHead = verifyMediaHead($candidate, 4);
        if ($vHead['ok']) {
            $videoUrl = $candidate;
            $isVideoPin = true;
            break;
        }
    }

    // Fallback: If verification timed out or edge blocked HEAD, but we found a valid 720p MP4 candidate, use it
    if (empty($videoUrl) && !empty($videoCandidates)) {
        foreach ($videoCandidates as $candidate) {
            if (str_contains(strtolower($candidate), '.mp4')) {
                $videoUrl = $candidate;
                $isVideoPin = true;
                break;
            }
        }
    }

    // Notice only if it was definitively identified as a video pin AND no video stream exists
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

    // ── Build & Verify Original Image URL ──
    $originalUrl = preg_replace('/\/[0-9]+x[0-9]*\//', '/originals/', $imgUrl);
    $origFormat = str_ends_with(strtolower($originalUrl), '.png') ? 'PNG' : (str_ends_with(strtolower($originalUrl), '.webp') ? 'WEBP' : 'JPG');

    // ── Build & Verify 736x (Standard HD) Image URL ──
    $hdUrl = '';
    $hdFormat = 'JPG';

    // Check if Pinterest explicitly provided images_736x in HTML
    if (preg_match('/"images_736x":\s*\{[^}]*"url":\s*"([^"]+)"/i', $html, $m736)) {
        $hdCandidate = stripslashes($m736[1]);
    } else {
        $hdCandidate = preg_replace('/\/originals\//', '/736x/', $originalUrl);
    }

    if ($hdCandidate !== $originalUrl) {
        // Verify HEAD 200 for 736x candidate
        $headRes = verifyMediaHead($hdCandidate);
        if ($headRes['ok']) {
            $hdUrl = $hdCandidate;
            $hdFormat = str_ends_with(strtolower($hdUrl), '.png') ? 'PNG' : (str_ends_with(strtolower($hdUrl), '.webp') ? 'WEBP' : 'JPG');
        } else {
            // If original was .png, 736x is often generated on Pinterest as .jpg
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

    // Build items list with Video FIRST so users see and download the video immediately
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

// ─── 2. YOUTUBE RESOLVER (NATIVE DIRECT & OPEN API RESOLVER) ─────────────────
if ($platform === 'youtube') {

    // ── Validate YouTube URL & extract video ID ──
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
        if (!isPrivateOrReservedIp($pvHost)) {
            $ch = curl_init($providerUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['url' => $inputUrl, 'video_id' => $videoId, 'is_shorts' => $isShorts]));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
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

    // Native resolution via Invidious public instance rotation
    $invidiousInstances = [
        "https://yt.chocolatemoo53.com",
        "https://invidious.nerdvpn.de",
        "https://inv.nadeko.net",
        "https://invidious.slipfox.xyz"
    ];

    $ytData = null;
    $usedInstHost = '';
    foreach ($invidiousInstances as $inst) {
        $ch = curl_init("$inst/api/v1/videos/$videoId");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
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

    // Direct Google Innertube API fallback with official ANDROID client
    if (!$ytData) {
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
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
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
                $usedInstHost = ''; // Direct google URLs
            }
        }
    }

    // Secondary metadata fallback via direct m.youtube.com scrape
    if (!$ytData) {
        $mUrl = "https://m.youtube.com/watch?v=$videoId";
        $ch = curl_init($mUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
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

    $makeProxyUrl = function($rawUrl) use ($usedInstHost) {
        if (empty($rawUrl)) return '';
        // If it is already a direct absolute URL (e.g. googlevideo.com), keep it directly
        if (str_starts_with($rawUrl, 'http://') || str_starts_with($rawUrl, 'https://')) {
            return $rawUrl;
        }
        // If it is a relative path from an Invidious instance (e.g. /videoplayback?...)
        if (!empty($usedInstHost)) {
            return "https://{$usedInstHost}" . (str_starts_with($rawUrl, '/') ? '' : '/') . $rawUrl;
        }
        return $rawUrl;
    };

    $items = [];
    $seenQualities = [];
    $hasMarkedHighest = false;

    // ── 1. Discover Best Audio Stream (Highest Bitrate MP4/AAC) ──
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

    // Helper to extract numeric vertical resolution height reliably
    $parseHeight = function($resStr, $qualityLabel = '') {
        $targets = [$resStr, $qualityLabel];
        foreach ($targets as $str) {
            if (!$str) continue;
            if (preg_match('/x(\d+)/i', $str, $m)) return (int)$m[1];
            if (preg_match('/(\d+)p/i', $str, $m)) return (int)$m[1];
            if (preg_match('/^(\d+)/', $str, $m)) return (int)$m[1];
        }
        return 0;
    };

    // ── 2. Adaptive Video Formats with Audio Merging (1080p Full HD, 720p HD, etc.) ──
    if (!empty($ytData['adaptiveFormats'])) {
        $videoAdaptive = [];
        foreach ($ytData['adaptiveFormats'] as $af) {
            $type = $af['type'] ?? $af['mimeType'] ?? '';
            $hasVideo = str_starts_with($type, 'video/mp4') || str_starts_with($type, 'video/webm');
            if ($hasVideo && !empty($af['url'])) {
                $videoAdaptive[] = $af;
            }
        }

        // Sort descending by numeric resolution, prioritizing MP4 over WebM when resolution is identical
        usort($videoAdaptive, function($a, $b) use ($parseHeight) {
            $numA = $parseHeight($a['resolution'] ?? '', $a['qualityLabel'] ?? '');
            $numB = $parseHeight($b['resolution'] ?? '', $b['qualityLabel'] ?? '');
            if ($numA !== $numB) {
                return $numB <=> $numA;
            }
            $isMp4A = str_starts_with($a['type'] ?? $a['mimeType'] ?? '', 'video/mp4') ? 1 : 0;
            $isMp4B = str_starts_with($b['type'] ?? $b['mimeType'] ?? '', 'video/mp4') ? 1 : 0;
            return $isMp4B <=> $isMp4A;
        });

        foreach ($videoAdaptive as $af) {
            $num = $parseHeight($af['resolution'] ?? '', $af['qualityLabel'] ?? '');
            $tier = null;
            if ($num >= 2160) $tier = '2160p 4K';
            elseif ($num >= 1440) $tier = '1440p 2K';
            elseif ($num >= 1000) $tier = '1080p Full HD';
            elseif ($num >= 700)  $tier = '720p HD';
            elseif ($num >= 480)  $tier = '480p';
            elseif ($num >= 360)  $tier = '360p';
            elseif ($num >= 240)  $tier = '240p';
            else continue;

            if (isset($seenQualities[$tier])) continue;
            $seenQualities[$tier] = true;

            $sizeMb = !empty($af['clen']) ? round((int)$af['clen'] / (1024 * 1024), 1) . ' MB' : (!empty($af['contentLength']) ? round((int)$af['contentLength'] / (1024 * 1024), 1) . ' MB' : null);
            $isHighest = !$hasMarkedHighest;
            $hasMarkedHighest = true;

            $label = ($tier === '1080p Full HD' || $tier === '2160p 4K' || $tier === '1440p 2K')
                ? "$tier (Merged Video + Voice)"
                : "$tier (Merged Video + Voice)";

            $items[] = [
                'type' => 'video',
                'quality' => $label,
                'format' => 'MP4',
                'size' => $sizeMb,
                'url' => $makeProxyUrl($af['url']),
                'audioUrl' => $bestAudioUrl,
                'hasAudio' => true,
                'needsMerge' => !empty($bestAudioUrl),
                'isHighest' => $isHighest
            ];
        }
    }

    // ── 3. Combined Progressive Formats (Video + Voice Pre-mixed by YouTube) ──
    if (!empty($ytData['formatStreams'])) {
        foreach ($ytData['formatStreams'] as $fs) {
            $qLabel = $fs['qualityLabel'] ?? $fs['resolution'] ?? '360p';
            $url = $makeProxyUrl($fs['url'] ?? '');
            if ($url && !isset($seenQualities[$qLabel])) {
                $seenQualities[$qLabel] = true;
                $isHighest = !$hasMarkedHighest;
                $hasMarkedHighest = true;
                $sizeMb = !empty($fs['size']) ? $fs['size'] : (!empty($fs['contentLength']) ? round((int)$fs['contentLength'] / (1024 * 1024), 1) . ' MB' : null);

                $items[] = [
                    'type' => 'video',
                    'quality' => "$qLabel (Video + Voice)",
                    'format' => 'MP4',
                    'size' => $sizeMb,
                    'url' => $url,
                    'hasAudio' => true,
                    'needsMerge' => false,
                    'isHighest' => $isHighest
                ];
            }
        }
    }

    // ── 4. Audio-Only Track (M4A / MP3) ──
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

    // ── 5. High Quality Thumbnail ──
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
        'items' => $items
    ]);
    exit;
}

// ─── 3. INSTAGRAM RESOLVER (NATIVE DIRECT SOCIAL CRAWLER) ────────────────────
if ($platform === 'instagram') {

    // ── Validate Instagram URL & extract shortcode ──
    $parsedIg  = parse_url($inputUrl);
    $igPath    = rtrim($parsedIg['path'] ?? '', '/');

    // Supported patterns: /reel/CODE, /reels/CODE, /p/CODE, /tv/CODE
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

    // Forward to custom provider if configured
    $providerUrl = getenv('DOWNLOADER_INSTAGRAM_PROVIDER') ?: '';
    if (!empty($providerUrl)) {
        $pvHost = strtolower(parse_url($providerUrl, PHP_URL_HOST) ?? '');
        if (!isPrivateOrReservedIp($pvHost)) {
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

    // Native resolution using FacebookExternalHit crawler emulation
    $fetchUrl = "https://www.instagram.com/reel/{$shortcode}/";
    $ch = curl_init($fetchUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
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

    // Check if redirected to login page without media
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

    // Extract Title / Caption
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

    // Extract Cover Thumbnail
    $thumbnail = '';
    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $im)) {
        $thumbnail = html_entity_decode($im[1], ENT_QUOTES, 'UTF-8');
    }

    // Extract Video MP4
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

    // Build items list (Video first, then Cover)
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
