<?php
/**
 * ProToolBox TeraBox API & Streaming Gateway (PHP)
 * High-performance, low-latency in-browser streaming gateway
 *
 * Features:
 *  - Direct Proxy Streaming with byte-range (206 Partial Content) support
 *  - Full coverage for all TeraBox, Baidu, and mirror CDN storage clusters
 *  - 1800s File Cache for instant playback and zero repeat latency
 *  - Seamless iOS Safari & Mobile Chrome playback with custom headers & CORS
 *  - Accurate status reporting for expired / deleted / captcha links
 *  - Multi-host fallback with retry across dm.terabox.app, www.terabox.app, 1024tera
 */

// Disable output buffering & execution limits for smooth video streaming
@ini_set('max_execution_time', 0);
@ini_set('memory_limit', '512M');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', 1);
}
@ini_set('zlib.output_compression', 0);

// Global CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Range, Authorization, X-Requested-With');
header('Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Load secret config ─────────────────────────────────────────────────────
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}
$FALLBACK_NDUS = defined('TERABOX_NDUS') ? TERABOX_NDUS : 'YqsIMBVpeHuirL2Ygy3MXxvrJzN2zaZ2ZxVZR7Cg';
$ndus = $_GET['ndus'] ?? $_POST['ndus'] ?? $FALLBACK_NDUS;

// Multiple known-working cookie aliases (terabox uses both)
$COOKIE_STR = $ndus ? "ndus=$ndus; lang=en" : 'lang=en';

$USER_AGENT = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
$DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── CACHE HELPERS (file-based, TTL 1800s) ───────────────────────────────────

function cacheGet($key) {
    $file = sys_get_temp_dir() . '/ptb_' . md5($key) . '.json';
    if (!file_exists($file)) return null;
    $raw = @file_get_contents($file);
    if (!$raw) return null;
    $data = json_decode($raw, true);
    if (!$data || empty($data['expires']) || time() > $data['expires']) {
        @unlink($file);
        return null;
    }
    return $data['value'];
}

function cacheSet($key, $value, $ttl = 1800) {
    $file = sys_get_temp_dir() . '/ptb_' . md5($key) . '.json';
    $payload = json_encode(['expires' => time() + $ttl, 'value' => $value]);
    @file_put_contents($file, $payload, LOCK_EX);
}

// ─── DOMAIN ALLOWLIST (All legitimate TeraBox CDN clusters) ──────────────────

function isAllowedTeraboxDomain($url) {
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
    if (!$host) return false;
    
    $allowedKeywords = [
        'terabox', '1024tera', 'terafileshare', 'terasharelink', 
        '4funbox', 'mirrobox', 'nephobox', 'momerybox', 
        'tibibox', 'freeterabox', 'baidupcs', 'baidu', 'dubox',
        'tera', 'bdsealink', 'bdlink', 'bj.bcebos', 'gz.bcebos',
        'su.bcebos', 'd.terabox', 'd2.terabox', 'd3.terabox'
    ];
    foreach ($allowedKeywords as $kw) {
        if (strpos($host, $kw) !== false) {
            return true;
        }
    }
    return false;
}

// ─── URL PARSER ──────────────────────────────────────────────────────────────

function parseSurlKeys($input) {
    if (!$input) return null;
    $clean = trim($input);
    $key = $clean;

    if (preg_match('/(?:surl=|\/s\/)([a-zA-Z0-9_-]+)/', $clean, $m)) {
        $key = $m[1];
    } elseif (strpos($clean, '?') !== false) {
        $parts = parse_url($clean);
        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
            if (!empty($query['surl'])) $key = $query['surl'];
        }
    }

    $key = preg_replace('/[^a-zA-Z0-9_-]/', '', $key);
    if (!$key) return null;

    if (strpos($key, '1') === 0) {
        return ['with1' => $key, 'without1' => substr($key, 1)];
    } else {
        return ['with1' => '1' . $key, 'without1' => $key];
    }
}

// ─── FETCH jsToken ──────────────────────────────────────────────────────────

function fetchJsToken($surlWith1, $cookieStr, $userAgent) {
    $hosts = ['dm.terabox.app', 'www.terabox.app', 'www.1024tera.com'];
    
    foreach ($hosts as $host) {
        $pageUrl = "https://{$host}/sharing/link?surl=" . urlencode($surlWith1);

        $ch = curl_init($pageUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Cookie: $cookieStr",
            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language: en-US,en;q=0.5",
        ]);

        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($html && $httpCode < 400) {
            if (preg_match('/fn%28%22(.*?)%22%29/', $html, $m)) {
                return $m[1];
            }
            if (preg_match('/"jsToken":"([^"]+)"/', $html, $m)) {
                return $m[1];
            }
        }
    }
    return '';
}

// ─── RESOLVE TeraBox (with cache & multiple endpoints) ───────────────────────

function resolveTeraBox($keys, $ndus, $cookieStr, $pwd = '') {
    global $USER_AGENT, $DESKTOP_UA;

    // Cache lookup
    $cacheKey = $keys['with1'] . '|' . $pwd . '|v2';
    $cached = cacheGet($cacheKey);
    if ($cached && !empty($cached['dlink'])) {
        return $cached;
    }

    // Fetch jsToken from TeraBox share page
    $jsToken = fetchJsToken($keys['with1'], $cookieStr, $DESKTOP_UA);

    $apiHosts = ['dm.terabox.app', 'www.terabox.app', 'www.1024tera.com'];
    $shorturls = [$keys['without1'], $keys['with1']];
    $lastError = 'Failed to resolve TeraBox link. The link may be expired or deleted.';
    $lastErrno = null;

    foreach ($apiHosts as $host) {
        foreach ($shorturls as $shorturl) {
            $pageUrl = "https://{$host}/sharing/link?surl=" . urlencode($shorturl);
            $apiUrl = "https://{$host}/share/list?app_id=250528&shorturl=" . urlencode($shorturl) . "&root=1";
            if ($jsToken) $apiUrl .= "&jsToken=" . urlencode($jsToken);
            if ($pwd)     $apiUrl .= "&pwd=" . urlencode($pwd);

            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, $DESKTOP_UA);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Host: {$host}",
                "Referer: $pageUrl",
                "Origin: https://{$host}",
                "Accept: application/json, text/plain, */*",
                "Accept-Language: en-US,en;q=0.9",
                "X-Requested-With: XMLHttpRequest",
                "Cookie: $cookieStr"
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (!$response) continue;

            $data = json_decode($response, true);
            if (!$data || !isset($data['errno'])) continue;

            if ($data['errno'] === 0 && !empty($data['list'][0])) {
                $file = $data['list'][0];
                $result = [
                    'file_name'       => $file['server_filename'] ?? 'video.mp4',
                    'title'           => $file['server_filename'] ?? 'video.mp4',
                    'name'            => $file['server_filename'] ?? 'video.mp4',
                    'size'            => $file['size'] ?? 0,
                    'thumb'           => $file['thumbs']['url3'] ?? $file['thumbs']['url2'] ?? $file['thumbs']['url1'] ?? '',
                    'dlink'           => $file['dlink'] ?? '',
                    'surl'            => $keys['with1'],
                    'hasDirectStream' => !empty($file['dlink'])
                ];
                cacheSet($cacheKey, $result, 1800);
                return $result;
            }

            $lastErrno = $data['errno'];
            if ($data['errno'] === 140) {
                $lastError = 'This TeraBox link has expired or was deleted by the owner. Please get a new share link.';
                break 2; // No point trying other hosts for dead links
            } elseif ($data['errno'] === 105) {
                $lastError = 'TeraBox share link not found. It may have been removed.';
                break 2;
            } elseif ($data['errno'] === 400141 || $data['errno'] === 4000020) {
                $lastError = 'TeraBox requires captcha verification for this link. The server IP may be temporarily rate-limited. Please try again in a few minutes.';
                // Don't break — try other hosts, they might not be rate-limited
            } elseif (!empty($data['errmsg'])) {
                $lastError = $data['errmsg'];
            }
        }
    }

    throw new Exception($lastError);
}

// ─── STREAM PROXY (Fast, Range-Supported, Anti-Hotlink Bypassing) ─────────────

function streamVideo($targetUrl, $cookieStr) {
    global $USER_AGENT, $DESKTOP_UA;

    if (!isAllowedTeraboxDomain($targetUrl)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Forbidden: target domain not in allowed list.']);
        exit;
    }

    // Flush any pending output buffers immediately
    if (session_id()) session_write_close();
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }

    $rangeHeader = $_SERVER['HTTP_RANGE'] ?? null;

    $headers = [
        "User-Agent: $DESKTOP_UA",
        "Referer: https://www.terabox.com/",
        "Origin: https://www.terabox.com",
        "Accept: */*",
        "Accept-Language: en-US,en;q=0.9",
        "Connection: keep-alive",
        "Cookie: $cookieStr"
    ];
    if ($rangeHeader) $headers[] = "Range: $rangeHeader";

    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 8);
    curl_setopt($ch, CURLOPT_AUTOREFERER, true);
    curl_setopt($ch, CURLOPT_UNRESTRICTED_AUTH, true);
    curl_setopt($ch, CURLOPT_COOKIE, $cookieStr);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 0);
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 128 * 1024);
    curl_setopt($ch, CURLOPT_TCP_NODELAY, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // Forward upstream response headers to client
    $contentTypeSent = false;
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$contentTypeSent) {
        $len = strlen($header);
        $trimmed = trim($header);

        // Forward HTTP status code (200 OK or 206 Partial Content), skipping intermediate 3xx redirects
        if (preg_match('#^HTTP/[\d\.]+\s+(\d+)#i', $trimmed, $matches)) {
            $code = (int)$matches[1];
            if ($code !== 301 && $code !== 302 && $code !== 303 && $code !== 307 && $code !== 308) {
                http_response_code($code);
            }
            return $len;
        }

        $headerParts = explode(':', $trimmed, 2);
        if (count($headerParts) === 2) {
            $name = strtolower(trim($headerParts[0]));
            if (in_array($name, ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag', 'cache-control'])) {
                if ($name === 'content-type') {
                    $contentTypeSent = true;
                    $val = trim($headerParts[1]);
                    // Force proper video MIME type so browsers play directly
                    if (strpos($val, 'octet-stream') !== false || empty($val)) {
                        header('Content-Type: video/mp4', true);
                    } else {
                        header("Content-Type: $val", true);
                    }
                } else {
                    header("$name: " . trim($headerParts[1]), false);
                }
            }
        }

        return $len;
    });

    if (!$contentTypeSent) {
        header('Content-Type: video/mp4');
    }
    header('Accept-Ranges: bytes');
    header('Cache-Control: no-store');
    header('X-Accel-Buffering: no');

    // Stream body in real-time chunks
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
        echo $data;
        flush();
        return strlen($data);
    });

    curl_exec($ch);
    curl_close($ch);
    exit;
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path       = parse_url($requestUri, PHP_URL_PATH);
$mode       = $_GET['mode'] ?? '';

// 1. Direct URL stream proxy
$streamUrl = $_GET['url'] ?? '';
if (!empty($streamUrl)) {
    streamVideo($streamUrl, $COOKIE_STR);
    exit;
}

// 2. mode=stream&surl=<key> — Resolve FIRST, then stream
if ($mode === 'stream' || strpos($path, '/stream') !== false) {
    $rawInput = $_GET['surl'] ?? '';
    $keys = parseSurlKeys($rawInput);
    if ($keys) {
        try {
            $file = resolveTeraBox($keys, $ndus, $COOKIE_STR);
            $dlink = $file['dlink'] ?? '';

            if (!empty($dlink)) {
                streamVideo($dlink, $COOKIE_STR);
                exit;
            } else {
                http_response_code(502);
                header('Content-Type: application/json');
                echo json_encode(['error' => 'No direct video stream link returned from TeraBox.', 'errno' => 'no_dlink']);
                exit;
            }
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => $e->getMessage(), 'errno' => 'resolve_failed']);
            exit;
        }
    }
}

// 3. Resolve metadata (Fast JSON)
if ($mode === 'resolve' || $_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['surl'])) {
    $rawInput = '';
    $pwd      = '';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $rawInput = $body['url'] ?? $body['surl'] ?? $_POST['url'] ?? $_POST['surl'] ?? '';
        $pwd      = $body['pwd'] ?? $_POST['pwd'] ?? '';
    } else {
        $rawInput = $_GET['surl'] ?? $_GET['url'] ?? '';
        $pwd      = $_GET['pwd'] ?? '';
    }

    $keys = parseSurlKeys($rawInput);
    if (!$keys) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Parameter `surl` or `url` is required.']);
        exit;
    }

    try {
        $file = resolveTeraBox($keys, $ndus, $COOKIE_STR, $pwd);
        header('Content-Type: application/json');
        echo json_encode($file);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

// 4. Health check
header('Content-Type: application/json');
echo json_encode([
    'status'      => 'online',
    'service'     => 'ProToolBox TeraBox Native Gateway',
    'domain'      => 'protoolbox.in',
    'php_version' => PHP_VERSION,
    'cookieActive'=> !empty($ndus),
    'cacheDir'    => sys_get_temp_dir(),
], JSON_PRETTY_PRINT);
