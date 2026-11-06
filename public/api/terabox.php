<?php
/**
 * ToolSathi TeraBox API & Streaming Gateway (PHP)
 * Runs natively on Hostinger under tool-sathi.propdigital360.in
 *
 * Features:
 *  - Resolve cache (600s TTL) — eliminates repeat TeraBox API calls
 *  - Redirect mode (302 to TeraBox CDN) — fastest possible playback start
 *  - Proxy fallback (?proxy=1) — for clients that can't follow cross-origin 302
 *  - Domain allowlist — prevents use as open proxy
 *  - Cookie loaded from config.php (never hardcoded in git)
 */

// Disable output buffering & timeouts for video streaming
@ini_set('max_execution_time', 0);
@ini_set('memory_limit', '512M');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', 1);
}
@ini_set('zlib.output_compression', 0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Range, Authorization');
header('Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Load secret config (never hardcoded) ───────────────────────────────────
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}
$DEFAULT_NDUS = defined('TERABOX_NDUS') ? TERABOX_NDUS : '';
$ndus = $_GET['ndus'] ?? $_POST['ndus'] ?? $DEFAULT_NDUS;

$USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── CACHE HELPERS (file-based, TTL 600s) ───────────────────────────────────

function cacheGet($key) {
    $file = sys_get_temp_dir() . '/ts_' . md5($key) . '.json';
    if (!file_exists($file)) return null;
    $fp = fopen($file, 'r');
    if (!$fp) return null;
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    if (!$raw) return null;
    $data = json_decode($raw, true);
    if (!$data || empty($data['expires']) || time() > $data['expires']) {
        @unlink($file);
        return null;
    }
    return $data['value'];
}

function cacheSet($key, $value, $ttl = 600) {
    $file = sys_get_temp_dir() . '/ts_' . md5($key) . '.json';
    $payload = json_encode(['expires' => time() + $ttl, 'value' => $value]);
    $fp = fopen($file, 'w');
    if (!$fp) return;
    flock($fp, LOCK_EX);
    fwrite($fp, $payload);
    flock($fp, LOCK_UN);
    fclose($fp);
}

// ─── DOMAIN ALLOWLIST ────────────────────────────────────────────────────────

function isAllowedTeraboxDomain($url) {
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
    return (bool) preg_match('/(^|\.)((terabox\.com)|(1024tera\.com)|(teraboxcdn\.com)|(terabox\.app)|(teraboxlink\.com)|(www\.terabox\.com))$/i', $host);
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

// ─── FETCH jsToken ───────────────────────────────────────────────────────────

function fetchJsToken($surlWith1, $cookieHeader, $userAgent) {
    $pageUrl = "https://dm.terabox.app/sharing/link?surl=" . urlencode($surlWith1);

    $ch = curl_init($pageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);           // reduced: 8 → 5
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    if ($cookieHeader) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Cookie: $cookieHeader"]);
    }

    $html = curl_exec($ch);
    curl_close($ch);

    if ($html && preg_match('/fn%28%22(.*?)%22%29/', $html, $m)) {
        return $m[1];
    }
    return '';
}

// ─── RESOLVE TeraBox (with cache) ───────────────────────────────────────────

function resolveTeraBox($keys, $ndus, $pwd = '') {
    global $USER_AGENT;

    // Build cache key from surl + password + cookie identity
    $cacheKey = $keys['with1'] . '|' . $pwd . '|' . $ndus;
    $cached = cacheGet($cacheKey);
    if ($cached) {
        return $cached;
    }

    $cookieHeader = $ndus ? "ndus=$ndus" : '';
    $jsToken = fetchJsToken($keys['with1'], $cookieHeader, $USER_AGENT);
    $pageUrl  = "https://dm.terabox.app/sharing/link?surl=" . urlencode($keys['with1']);

    // Try shorturl without-1 first, then with-1
    $variants  = [$keys['without1'], $keys['with1']];
    $lastError = 'Failed to resolve TeraBox link.';

    foreach ($variants as $shorturl) {
        $apiUrl = "https://dm.terabox.app/share/list?app_id=250528&shorturl=" . urlencode($shorturl) . "&root=1";
        if ($jsToken) $apiUrl .= "&jsToken=" . urlencode($jsToken);
        if ($pwd)     $apiUrl .= "&pwd=" . urlencode($pwd);

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, $USER_AGENT);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 9);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2TLS);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Host: dm.terabox.app",
            "Referer: $pageUrl",
            "Origin: https://dm.terabox.app",
            "Accept: application/json, text/plain, */*",
            "X-Requested-With: XMLHttpRequest",
            "Cookie: $cookieHeader"
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['errno']) && $data['errno'] === 0 && !empty($data['list'][0])) {
                $file   = $data['list'][0];
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
                // Only cache successful results, never errors
                cacheSet($cacheKey, $result, 600);
                return $result;
            }
            if ($data && !empty($data['errmsg'])) {
                $lastError = $data['errmsg'];
            }
        }
    }

    throw new Exception($lastError);
}

// ─── STREAM PROXY (fallback when redirect fails) ────────────────────────────

function streamVideo($targetUrl, $ndus) {
    global $USER_AGENT;

    // ✅ Security: only allow TeraBox CDN domains — block open proxy abuse
    if (!isAllowedTeraboxDomain($targetUrl)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Forbidden: target domain not allowed.']);
        exit;
    }

    // Clear any output buffers so headers and stream flush immediately
    if (session_id()) session_write_close();
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }

    $rangeHeader  = $_SERVER['HTTP_RANGE'] ?? null;
    $cookieHeader = $ndus ? "ndus=$ndus" : '';

    $headers = [
        "User-Agent: $USER_AGENT",
        "Referer: https://dm.terabox.app/",
        "Accept: */*",
    ];
    if ($cookieHeader) $headers[] = "Cookie: $cookieHeader";
    if ($rangeHeader)  $headers[] = "Range: $rangeHeader";

    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 0);
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 128 * 1024);
    curl_setopt($ch, CURLOPT_TCP_NODELAY, true);          // reduce TCP latency
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);          // fail fast on bad dlinks
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2TLS); // HTTP/2
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // Forward upstream response headers to client
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
        $len     = strlen($header);
        $trimmed = trim($header);

        // Forward HTTP status code (e.g. 206 Partial Content for seeking)
        if (preg_match('#^HTTP/[\d\.]+\s+(\d+)#i', $trimmed, $matches)) {
            http_response_code((int)$matches[1]);
            return $len;
        }

        $headerParts = explode(':', $trimmed, 2);
        if (count($headerParts) === 2) {
            $name = strtolower(trim($headerParts[0]));
            if (in_array($name, ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag', 'cache-control'])) {
                header($trimmed, true);
            }
        }
        return $len;
    });

    // Stream body directly to output, flush per chunk
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
        echo $data;
        flush();
        return strlen($data);
    });

    curl_exec($ch);
    curl_close($ch);
    exit;
}

// ─── ROUTING ────────────────────────────────────────────────────────────────

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path       = parse_url($requestUri, PHP_URL_PATH);
$mode       = $_GET['mode'] ?? '';

// 1. Stream / Redirect mode
$streamUrl = $_GET['url'] ?? '';
if ($mode === 'stream' || strpos($path, '/stream') !== false || !empty($streamUrl)) {

    // ?url=<dlink> → proxy mode (domain-checked)
    if (!empty($streamUrl)) {
        streamVideo($streamUrl, $ndus);
        exit;
    }

    // mode=stream&surl=<key> → resolve first, then redirect or proxy
    if ($mode === 'stream') {
        $rawInput = $_GET['surl'] ?? '';
        $keys     = parseSurlKeys($rawInput);
        if ($keys) {
            try {
                $file      = resolveTeraBox($keys, $ndus);
                $dlink     = $file['dlink'] ?? '';
                $useProxy  = ($_GET['proxy'] ?? '0') === '1';

                if (!empty($dlink)) {
                    if ($useProxy) {
                        // Proxy fallback: bytes pass through Hostinger
                        streamVideo($dlink, $ndus);
                    } else {
                        // ✅ Redirect mode: browser fetches directly from TeraBox CDN (fastest)
                        header('Cache-Control: no-store');
                        header('Location: ' . $dlink);
                        http_response_code(302);
                        exit;
                    }
                } else {
                    http_response_code(502);
                    header('Content-Type: application/json');
                    echo json_encode(['error' => 'No direct stream link available.']);
                    exit;
                }
            } catch (Exception $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode(['error' => $e->getMessage()]);
                exit;
            }
        }
    }
}

// 2. Resolve metadata
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
        $file = resolveTeraBox($keys, $ndus, $pwd);
        header('Content-Type: application/json');
        echo json_encode($file);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Gateway processing error: ' . $e->getMessage()]);
        exit;
    }
}

// 3. Health check
header('Content-Type: application/json');
echo json_encode([
    'status'      => 'online',
    'service'     => 'ToolSathi TeraBox Native Gateway',
    'domain'      => 'tool-sathi.propdigital360.in',
    'php_version' => PHP_VERSION,
    'cookieActive'=> !empty($ndus),
    'cacheDir'    => sys_get_temp_dir(),
], JSON_PRETTY_PRINT);
