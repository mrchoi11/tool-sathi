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
 *  - Fast parallel resolve & stream piping
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

// ─── Load secret config ───────────────────────────────────────────────────────
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}
$FALLBACK_NDUS = 'YqsIMBVpeHuirL2Ygy3MXxvrJzN2zaZ2ZxVZR7Cg';
$DEFAULT_NDUS = defined('TERABOX_NDUS') ? TERABOX_NDUS : $FALLBACK_NDUS;
$ndus = $_GET['ndus'] ?? $_POST['ndus'] ?? $DEFAULT_NDUS;

$USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

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

// ─── DOMAIN ALLOWLIST (All legitimate TeraBox CDN clusters) ───────────────────

function isAllowedTeraboxDomain($url) {
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
    if (!$host) return false;
    
    $allowedKeywords = [
        'terabox', '1024tera', 'terafileshare', 'terasharelink', 
        '4funbox', 'mirrobox', 'nephobox', 'momerybox', 
        'tibibox', 'freeterabox', 'baidupcs', 'baidu', 'dubox'
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

// ─── FETCH jsToken ───────────────────────────────────────────────────────────

function fetchJsToken($surlWith1, $cookieHeader, $userAgent) {
    $pageUrl = "https://dm.terabox.app/sharing/link?surl=" . urlencode($surlWith1);

    $ch = curl_init($pageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    if ($cookieHeader) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Cookie: $cookieHeader"]);
    }

    $html = curl_exec($ch);
    curl_close($ch);

    if ($html) {
        if (preg_match('/fn%28%22(.*?)%22%29/', $html, $m)) {
            return $m[1];
        }
        if (preg_match('/"jsToken":"([^"]+)"/', $html, $m)) {
            return $m[1];
        }
    }
    return '';
}

// ─── RESOLVE TeraBox (with cache & multiple endpoints) ─────────────────────────

function resolveTeraBox($keys, $ndus, $pwd = '') {
    global $USER_AGENT;

    // Cache lookup
    $cacheKey = $keys['with1'] . '|' . $pwd . '|' . $ndus;
    $cached = cacheGet($cacheKey);
    if ($cached && !empty($cached['dlink'])) {
        return $cached;
    }

    $cookieHeader = $ndus ? "ndus=$ndus" : '';
    $pageUrl = "https://dm.terabox.app/sharing/link?surl=" . urlencode($keys['with1']);

    // Multiple domain hosts for high availability
    $apiHosts = ['www.terabox.app', 'dm.terabox.app', 'www.1024tera.com', 'www.terabox.com'];
    $shorturls = [$keys['with1'], $keys['without1']];
    $lastError = 'Failed to resolve TeraBox link.';

    // 1st Pass: Fast check directly without jsToken (usually succeeds in <400ms for public files)
    foreach ($apiHosts as $host) {
        foreach ($shorturls as $shorturl) {
            $apiUrl = "https://{$host}/share/list?app_id=250528&shorturl=" . urlencode($shorturl) . "&root=1";
            if ($pwd) $apiUrl .= "&pwd=" . urlencode($pwd);

            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, $USER_AGENT);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Host: {$host}",
                "Referer: $pageUrl",
                "Origin: https://{$host}",
                "Accept: application/json, text/plain, */*",
                "X-Requested-With: XMLHttpRequest",
                "Cookie: $cookieHeader"
            ]);

            $response = curl_exec($ch);
            $curlErr = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (isset($_GET['debug'])) {
                $lastError .= " [Host: $host, Code: $httpCode, Err: $curlErr, Body: " . substr($response ?: '', 0, 200) . "]";
            }

            if ($response) {
                $data = json_decode($response, true);
                if ($data && isset($data['errno']) && $data['errno'] === 0 && !empty($data['list'][0])) {
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
            }
        }
    }

    // 2nd Pass: Fetch jsToken if fast pass didn't resolve
    $jsToken = fetchJsToken($keys['with1'], $cookieHeader, $USER_AGENT);

    foreach ($apiHosts as $host) {
        foreach ($shorturls as $shorturl) {
            $apiUrl = "https://{$host}/share/list?app_id=250528&shorturl=" . urlencode($shorturl) . "&root=1";
            if ($jsToken) $apiUrl .= "&jsToken=" . urlencode($jsToken);
            if ($pwd)     $apiUrl .= "&pwd=" . urlencode($pwd);

            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, $USER_AGENT);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Host: {$host}",
                "Referer: $pageUrl",
                "Origin: https://{$host}",
                "Accept: application/json, text/plain, */*",
                "X-Requested-With: XMLHttpRequest",
                "Cookie: $cookieHeader"
            ]);

            $response = curl_exec($ch);
            $curlErr = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (isset($_GET['debug'])) {
                $lastError .= " [Host: $host, Code: $httpCode, Err: $curlErr, Body: " . substr($response ?: '', 0, 200) . "]";
            }

            if ($response) {
                $data = json_decode($response, true);
                if ($data && isset($data['errno']) && $data['errno'] === 0 && !empty($data['list'][0])) {
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
                if ($data && !empty($data['errmsg'])) {
                    $lastError = $data['errmsg'];
                }
            }
        }
    }

    throw new Exception($lastError);
}

// ─── STREAM PROXY (Fast, Range-Supported, Anti-Hotlink Bypassing) ─────────────

function streamVideo($targetUrl, $ndus) {
    global $USER_AGENT;

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

    $rangeHeader  = $_SERVER['HTTP_RANGE'] ?? null;
    $cookieHeader = $ndus ? "ndus=$ndus" : '';

    $headers = [
        "User-Agent: $USER_AGENT",
        "Referer: https://dm.terabox.app/",
        "Accept: */*",
        "Connection: keep-alive"
    ];
    if ($cookieHeader) $headers[] = "Cookie: $cookieHeader";
    if ($rangeHeader)  $headers[] = "Range: $rangeHeader";

    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 0);
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 64 * 1024);
    curl_setopt($ch, CURLOPT_TCP_NODELAY, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 8);
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
                        return $len;
                    }
                }
                header($trimmed, true);
            }
        }
        return $len;
    });

    // Stream body directly to client with real-time flushing
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) use (&$contentTypeSent) {
        if (!$contentTypeSent) {
            header('Content-Type: video/mp4', true);
            header('Accept-Ranges: bytes', true);
            $contentTypeSent = true;
        }
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

// 1. Stream Mode (Direct Proxy or Surl Streaming)
$streamUrl = $_GET['url'] ?? '';
if ($mode === 'stream' || strpos($path, '/stream') !== false || !empty($streamUrl)) {

    // Direct url proxying
    if (!empty($streamUrl)) {
        streamVideo($streamUrl, $ndus);
        exit;
    }

    // mode=stream&surl=<key>
    if ($mode === 'stream') {
        $rawInput = $_GET['surl'] ?? '';
        $keys = parseSurlKeys($rawInput);
        if ($keys) {
            try {
                $file = resolveTeraBox($keys, $ndus);
                $dlink = $file['dlink'] ?? '';

                if (!empty($dlink)) {
                    // Always stream through proxy to bypass TeraBox anti-hotlinking & CORS blocks
                    streamVideo($dlink, $ndus);
                    exit;
                } else {
                    http_response_code(502);
                    header('Content-Type: application/json');
                    echo json_encode(['error' => 'No direct video stream link returned from TeraBox.']);
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

// 2. Resolve metadata (Fast JSON)
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
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

// 3. Health check
header('Content-Type: application/json');
echo json_encode([
    'status'      => 'online',
    'service'     => 'ProToolBox TeraBox Native Gateway',
    'domain'      => 'protoolbox.in',
    'php_version' => PHP_VERSION,
    'cookieActive'=> !empty($ndus),
    'cacheDir'    => sys_get_temp_dir(),
], JSON_PRETTY_PRINT);
