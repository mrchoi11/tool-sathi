<?php
/**
 * ToolSathi TeraBox API & Streaming Gateway (PHP)
 * Runs natively on Hostinger under tool-sathi.propdigital360.in
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

// TeraBox ndus cookie
$DEFAULT_NDUS = 'YqsIMBVpeHuirL2Ygy3MXxvrJzN2zaZ2ZxVZR7Cg';
$ndus = $_GET['ndus'] ?? $_POST['ndus'] ?? $DEFAULT_NDUS;

$USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Parse TeraBox URL or key to get:
 * - with1 (e.g. 1lxG5qaDEEXuN76kPYO9LPg)
 * - without1 (e.g. lxG5qaDEEXuN76kPYO9LPg)
 */
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
        return [
            'with1' => $key,
            'without1' => substr($key, 1)
        ];
    } else {
        return [
            'with1' => '1' . $key,
            'without1' => $key
        ];
    }
}

/**
 * Fetch jsToken from dm.terabox.app share page
 */
function fetchJsToken($surlWith1, $cookieHeader, $userAgent) {
    $pageUrl = "https://dm.terabox.app/sharing/link?surl=" . urlencode($surlWith1);
    
    $ch = curl_init($pageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
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

/**
 * Resolve TeraBox metadata & direct streaming link
 */
function resolveTeraBox($keys, $ndus, $pwd = '') {
    global $USER_AGENT;
    $cookieHeader = $ndus ? "ndus=$ndus" : '';
    $jsToken = fetchJsToken($keys['with1'], $cookieHeader, $USER_AGENT);

    $pageUrl = "https://dm.terabox.app/sharing/link?surl=" . urlencode($keys['with1']);
    
    // We try shorturl without 1 first, then with 1 if needed
    $variants = [$keys['without1'], $keys['with1']];
    $lastError = 'Failed to resolve TeraBox link.';

    foreach ($variants as $shorturl) {
        $apiUrl = "https://dm.terabox.app/share/list?app_id=250528&shorturl=" . urlencode($shorturl) . "&root=1";
        if ($jsToken) $apiUrl .= "&jsToken=" . urlencode($jsToken);
        if ($pwd) $apiUrl .= "&pwd=" . urlencode($pwd);

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, $USER_AGENT);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 9);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Host: dm.terabox.app",
            "Referer: $pageUrl",
            "Origin: https://dm.terabox.app",
            "Accept: application/json, text/plain, */*",
            "X-Requested-With: XMLHttpRequest",
            "Cookie: $cookieHeader"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['errno']) && $data['errno'] === 0 && !empty($data['list'][0])) {
                $file = $data['list'][0];
                return [
                    'file_name' => $file['server_filename'] ?? 'video.mp4',
                    'title' => $file['server_filename'] ?? 'video.mp4',
                    'name' => $file['server_filename'] ?? 'video.mp4',
                    'size' => $file['size'] ?? 0,
                    'thumb' => $file['thumbs']['url3'] ?? $file['thumbs']['url2'] ?? $file['thumbs']['url1'] ?? '',
                    'dlink' => $file['dlink'] ?? '',
                    'surl' => $keys['with1'],
                    'hasDirectStream' => !empty($file['dlink'])
                ];
            }
            if ($data && !empty($data['errmsg'])) {
                $lastError = $data['errmsg'];
            }
        }
    }

    throw new Exception($lastError);
}

/**
 * Proxy video stream with HTTP Range support
 */
function streamVideo($targetUrl, $ndus) {
    global $USER_AGENT;
    
    // Clear any output buffers so headers and stream flush immediately
    if (session_id()) session_write_close();
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }

    // Parse Range header from client
    $rangeHeader = $_SERVER['HTTP_RANGE'] ?? null;
    $cookieHeader = $ndus ? "ndus=$ndus" : '';

    $headers = [
        "User-Agent: $USER_AGENT",
        "Referer: https://dm.terabox.app/",
        "Accept: */*",
    ];
    if ($cookieHeader) $headers[] = "Cookie: $cookieHeader";
    if ($rangeHeader) $headers[] = "Range: $rangeHeader";

    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 0);
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 128 * 1024);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // Forward headers from upstream to client
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
        $len = strlen($header);
        $trimmed = trim($header);

        // 1. Send status code immediately (e.g. 206 Partial Content)
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

    // Stream body directly to output
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
$path = parse_url($requestUri, PHP_URL_PATH);
$mode = $_GET['mode'] ?? '';

// 1. Stream via /api/stream?url=... OR mode=stream
$streamUrl = $_GET['url'] ?? '';
if ($mode === 'stream' || strpos($path, '/stream') !== false || !empty($streamUrl)) {
    if (!empty($streamUrl)) {
        streamVideo($streamUrl, $ndus);
    } elseif ($mode === 'stream') {
        $rawInput = $_GET['surl'] ?? '';
        $keys = parseSurlKeys($rawInput);
        if ($keys) {
            try {
                $file = resolveTeraBox($keys, $ndus);
                if (!empty($file['dlink'])) {
                    streamVideo($file['dlink'], $ndus);
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

// 2. Resolve via POST /api/resolve OR GET /api?mode=resolve&surl=...
if ($mode === 'resolve' || $_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['surl'])) {
    $rawInput = '';
    $pwd = '';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $rawInput = $body['url'] ?? $body['surl'] ?? $_POST['url'] ?? $_POST['surl'] ?? '';
        $pwd = $body['pwd'] ?? $_POST['pwd'] ?? '';
    } else {
        $rawInput = $_GET['surl'] ?? $_GET['url'] ?? '';
        $pwd = $_GET['pwd'] ?? '';
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
    'status' => 'online',
    'service' => 'ToolSathi TeraBox Native Gateway',
    'domain' => 'tool-sathi.propdigital360.in',
    'php_version' => PHP_VERSION,
    'cookieActive' => !empty($ndus)
], JSON_PRETTY_PRINT);

