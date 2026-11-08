<?php
/**
 * ProToolBox Dynamic XML Sitemap Engine (Option 2: Native Dual-Mode Rendering)
 * - Browsers (Humans): Beautiful, clean HTML table view with ZERO XSLT (No Chrome deprecation warning!)
 * - Search Bots (Google, Bing, Crawlers): 100% Valid W3C XML protocol
 *
 * Supported Routes:
 *  - /sitemap.xml          -> Sitemap Index
 *  - /post-sitemap.xml     -> Dynamic Blog Posts (auto-syncs with Firestore)
 *  - /page-sitemap.xml     -> Core Site Pages
 *  - /tool-sitemap.xml     -> All 78 Online Tools
 *  - /category-sitemap.xml -> Tool Categories
 */

$BASE_URL = 'https://protoolbox.in';
$FIREBASE_PROJECT = 'tool-sathi001';

// Detect whether requester is a search engine bot or wants raw XML
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = (bool) preg_match('/(googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|curl|wget|python|php|bot|crawler|spider)/i', $userAgent);
$wantsXml = isset($_GET['xml']) || isset($_GET['format']) && $_GET['format'] === 'xml' || $isBot || (strpos($accept, 'text/html') === false);

if ($wantsXml) {
    header('Content-Type: application/xml; charset=utf-8');
} else {
    header('Content-Type: text/html; charset=utf-8');
}
header('X-Robots-Tag: noindex, follow');

// Determine requested type from query or request URI
$type = $_GET['type'] ?? '';
if (empty($type)) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, 'post-sitemap') !== false) {
        $type = 'post';
    } elseif (strpos($uri, 'page-sitemap') !== false) {
        $type = 'page';
    } elseif (strpos($uri, 'tool-sitemap') !== false) {
        $type = 'tool';
    } elseif (strpos($uri, 'category-sitemap') !== false) {
        $type = 'category';
    } else {
        $type = 'index';
    }
}

// Load static tools & pages data
$dataFile = __DIR__ . '/sitemap-data.json';
$siteData = [
    'categories' => ['video', 'pdf', 'image', 'video-processing', 'audio', 'converter', 'subtitle', 'creator', 'seo', 'productivity'],
    'tools' => [],
    'pages' => [
        ['path' => '', 'priority' => '1.0', 'changefreq' => 'daily'],
        ['path' => 'tools', 'priority' => '0.9', 'changefreq' => 'daily'],
        ['path' => 'blog', 'priority' => '0.8', 'changefreq' => 'daily'],
        ['path' => 'about', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['path' => 'contact', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['path' => 'privacy', 'priority' => '0.4', 'changefreq' => 'monthly'],
        ['path' => 'terms', 'priority' => '0.4', 'changefreq' => 'monthly'],
        ['path' => 'sitemap', 'priority' => '0.5', 'changefreq' => 'weekly']
    ]
];

if (file_exists($dataFile)) {
    $loaded = json_decode(file_get_contents($dataFile), true);
    if ($loaded) {
        $siteData = array_merge($siteData, $loaded);
    }
}

function formatSitemapDate($dateStr = null) {
    if (empty($dateStr)) return date('c');
    $ts = strtotime($dateStr);
    return ($ts === false || $ts <= 0) ? date('c') : date('c', $ts);
}

function getDynamicBlogPosts($projectId) {
    $cacheFile = sys_get_temp_dir() . '/protoolbox_sitemap_blogs.json';
    $cacheTtl = 300; // 5 minutes

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && is_array($cached)) return $cached;
    }

    $apiUrl = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/blog_posts";
    $posts = [];

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'ProToolBox-Sitemap-Bot/1.0');
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $res) {
        $json = json_decode($res, true);
        if (!empty($json['documents'])) {
            foreach ($json['documents'] as $doc) {
                $fields = $doc['fields'] ?? [];
                $status = $fields['status']['stringValue'] ?? 'published';
                if ($status !== 'published') continue;

                $slug = $fields['slug']['stringValue'] ?? '';
                if (empty($slug)) continue;

                $updateTime = $doc['updateTime'] ?? $fields['publishedAt']['stringValue'] ?? date('c');
                $posts[] = [
                    'slug' => $slug,
                    'lastmod' => formatSitemapDate($updateTime),
                    'priority' => '0.8',
                    'changefreq' => 'weekly'
                ];
            }
        }
    }

    if (empty($posts)) {
        $posts[] = [
            'slug' => 'how-to-play-terabox-videos-online-without-app',
            'lastmod' => formatSitemapDate('2026-10-20T13:29:15Z'),
            'priority' => '0.8',
            'changefreq' => 'weekly'
        ];
    }

    @file_put_contents($cacheFile, json_encode($posts));
    return $posts;
}

/**
 * Render Human-Friendly HTML Table (Option 2 — No XSLT, Zero Chrome Warnings)
 */
function renderHtmlView($title, $countText, $headers, $rows) {
    global $BASE_URL;
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><?= htmlspecialchars($title) ?> — ProToolBox</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #334155;
      background: #f8fafc;
      margin: 0;
      padding: 30px 20px;
    }
    .container {
      max-width: 1080px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      padding: 32px;
      border: 1px solid #e2e8f0;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 8px;
    }
    h1 {
      color: #0f172a;
      font-size: 26px;
      margin: 0;
      font-weight: 700;
    }
    .xml-link {
      background: #f1f5f9;
      color: #475569;
      font-size: 13px;
      padding: 6px 12px;
      border-radius: 6px;
      text-decoration: none;
      border: 1px solid #cbd5e1;
      font-weight: 500;
      transition: all 0.2s;
    }
    .xml-link:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .desc {
      color: #64748b;
      font-size: 14.5px;
      margin: 0 0 20px 0;
      line-height: 1.6;
    }
    .desc a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    .desc a:hover {
      text-decoration: underline;
    }
    .count-badge {
      background: #eff6ff;
      color: #2563eb;
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #bfdbfe;
      display: inline-block;
      margin-bottom: 20px;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background-color: #2563eb;
      color: #ffffff;
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    th:first-child { border-top-left-radius: 8px; }
    th:last-child { border-top-right-radius: 8px; }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td { background-color: #f8fafc; }
    tr:hover td { background-color: #f1f5f9; }
    td a {
      color: #0284c7;
      text-decoration: none;
      word-break: break-all;
    }
    td a:hover {
      color: #0369a1;
      text-decoration: underline;
    }
    .date-col {
      color: #64748b;
      font-size: 13px;
      white-space: nowrap;
    }
    .footer-note {
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
      font-size: 12.5px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-row">
      <h1><?= htmlspecialchars($title) ?></h1>
      <a href="?xml=1" class="xml-link" title="View Raw XML (for bots)">View Raw XML</a>
    </div>
    <p class="desc">
      Generated dynamically by <strong><a href="<?= htmlspecialchars($BASE_URL) ?>">ProToolBox</a></strong> for Google, Bing and other search engine bots.
    </p>

    <div class="count-badge"><?= $countText ?></div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <?php foreach ($headers as $h): ?>
              <th><?= htmlspecialchars($h) ?></th>
            <?php endforeach; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($rows as $r): ?>
            <tr>
              <?php foreach ($r as $i => $cell): ?>
                <td class="<?= $i === count($r) - 1 ? 'date-col' : '' ?>"><?= $cell ?></td>
              <?php endforeach; ?>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <div class="footer-note">
      ProToolBox Dynamic SEO Sitemap • Fully Compliant with Sitemaps.org Protocol
    </div>
  </div>
</body>
</html>
    <?php
    exit;
}

// ─── 1. SITEMAP INDEX ────────────────────────────────────────────────────────
if ($type === 'index') {
    $posts = getDynamicBlogPosts($FIREBASE_PROJECT);
    $latestPostDate = !empty($posts[0]['lastmod']) ? $posts[0]['lastmod'] : date('c');
    $pageDate = date('c');
    $toolDate = date('c', file_exists($dataFile) ? filemtime($dataFile) : time());

    if (!$wantsXml) {
        $rows = [
            ['<a href="/post-sitemap.xml">' . htmlspecialchars("{$BASE_URL}/post-sitemap.xml") . '</a>', $latestPostDate],
            ['<a href="/page-sitemap.xml">' . htmlspecialchars("{$BASE_URL}/page-sitemap.xml") . '</a>', $pageDate],
            ['<a href="/tool-sitemap.xml">' . htmlspecialchars("{$BASE_URL}/tool-sitemap.xml") . '</a>', $toolDate],
            ['<a href="/category-sitemap.xml">' . htmlspecialchars("{$BASE_URL}/category-sitemap.xml") . '</a>', $toolDate],
        ];
        renderHtmlView(
            'XML Sitemap Index',
            'This XML Sitemap Index file contains <strong>4</strong> sitemaps.',
            ['Sitemap', 'Last Modified'],
            $rows
        );
    }

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    echo "  <sitemap><loc>{$BASE_URL}/post-sitemap.xml</loc><lastmod>{$latestPostDate}</lastmod></sitemap>\n";
    echo "  <sitemap><loc>{$BASE_URL}/page-sitemap.xml</loc><lastmod>{$pageDate}</lastmod></sitemap>\n";
    echo "  <sitemap><loc>{$BASE_URL}/tool-sitemap.xml</loc><lastmod>{$toolDate}</lastmod></sitemap>\n";
    echo "  <sitemap><loc>{$BASE_URL}/category-sitemap.xml</loc><lastmod>{$toolDate}</lastmod></sitemap>\n";
    echo '</sitemapindex>';
    exit;
}

// ─── 2. POST SITEMAP ────────────────────────────────────────────────────────
if ($type === 'post') {
    $posts = getDynamicBlogPosts($FIREBASE_PROJECT);

    if (!$wantsXml) {
        $rows = [];
        foreach ($posts as $p) {
            $url = "{$BASE_URL}/blog/{$p['slug']}";
            $rows[] = [
                '<a href="' . htmlspecialchars($url) . '">' . htmlspecialchars($url) . '</a>',
                $p['priority'],
                $p['changefreq'],
                $p['lastmod']
            ];
        }
        renderHtmlView(
            'Posts Sitemap',
            'This XML Sitemap contains <strong>' . count($posts) . '</strong> URLs.',
            ['URL', 'Priority', 'Change Freq', 'Last Modified'],
            $rows
        );
    }

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($posts as $p) {
        $url = htmlspecialchars("{$BASE_URL}/blog/{$p['slug']}", ENT_QUOTES, 'UTF-8');
        echo "  <url><loc>{$url}</loc><lastmod>{$p['lastmod']}</lastmod><changefreq>{$p['changefreq']}</changefreq><priority>{$p['priority']}</priority></url>\n";
    }
    echo '</urlset>';
    exit;
}

// ─── 3. PAGE SITEMAP ────────────────────────────────────────────────────────
if ($type === 'page') {
    $now = date('c');

    if (!$wantsXml) {
        $rows = [];
        foreach ($siteData['pages'] as $page) {
            $path = ltrim($page['path'], '/');
            $url = $path === '' ? "{$BASE_URL}/" : "{$BASE_URL}/{$path}";
            $rows[] = [
                '<a href="' . htmlspecialchars($url) . '">' . htmlspecialchars($url) . '</a>',
                $page['priority'],
                $page['changefreq'],
                $now
            ];
        }
        renderHtmlView(
            'Pages Sitemap',
            'This XML Sitemap contains <strong>' . count($siteData['pages']) . '</strong> URLs.',
            ['URL', 'Priority', 'Change Freq', 'Last Modified'],
            $rows
        );
    }

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($siteData['pages'] as $page) {
        $path = ltrim($page['path'], '/');
        $url = $path === '' ? "{$BASE_URL}/" : "{$BASE_URL}/{$path}";
        echo "  <url><loc>" . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . "</loc><lastmod>{$now}</lastmod><changefreq>{$page['changefreq']}</changefreq><priority>{$page['priority']}</priority></url>\n";
    }
    echo '</urlset>';
    exit;
}

// ─── 4. TOOL SITEMAP ────────────────────────────────────────────────────────
if ($type === 'tool') {
    $date = date('c', file_exists($dataFile) ? filemtime($dataFile) : time());
    $featured = ['video-player', 'terabox-video-player', 'diskwala-video-player', 'pdf-merger', 'image-compressor'];

    if (!$wantsXml) {
        $rows = [];
        foreach ($siteData['tools'] as $slug) {
            $prio = in_array($slug, $featured) ? '0.9' : '0.8';
            $url = "{$BASE_URL}/tools/{$slug}";
            $rows[] = [
                '<a href="' . htmlspecialchars($url) . '">' . htmlspecialchars($url) . '</a>',
                $prio,
                'weekly',
                $date
            ];
        }
        renderHtmlView(
            'Tools Sitemap',
            'This XML Sitemap contains <strong>' . count($siteData['tools']) . '</strong> URLs.',
            ['URL', 'Priority', 'Change Freq', 'Last Modified'],
            $rows
        );
    }

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($siteData['tools'] as $slug) {
        $prio = in_array($slug, $featured) ? '0.9' : '0.8';
        $url = htmlspecialchars("{$BASE_URL}/tools/{$slug}", ENT_QUOTES, 'UTF-8');
        echo "  <url><loc>{$url}</loc><lastmod>{$date}</lastmod><changefreq>weekly</changefreq><priority>{$prio}</priority></url>\n";
    }
    echo '</urlset>';
    exit;
}

// ─── 5. CATEGORY SITEMAP ────────────────────────────────────────────────────
if ($type === 'category') {
    $date = date('c');

    if (!$wantsXml) {
        $rows = [];
        foreach ($siteData['categories'] as $cat) {
            $url = "{$BASE_URL}/category/{$cat}";
            $rows[] = [
                '<a href="' . htmlspecialchars($url) . '">' . htmlspecialchars($url) . '</a>',
                '0.8',
                'weekly',
                $date
            ];
        }
        renderHtmlView(
            'Categories Sitemap',
            'This XML Sitemap contains <strong>' . count($siteData['categories']) . '</strong> URLs.',
            ['URL', 'Priority', 'Change Freq', 'Last Modified'],
            $rows
        );
    }

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($siteData['categories'] as $cat) {
        $url = htmlspecialchars("{$BASE_URL}/category/{$cat}", ENT_QUOTES, 'UTF-8');
        echo "  <url><loc>{$url}</loc><lastmod>{$date}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n";
    }
    echo '</urlset>';
    exit;
}
