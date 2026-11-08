<?php
/**
 * ProToolBox Dynamic XML Sitemap Engine
 * Supports Sitemap Index & Category-Wise Sub-Sitemaps:
 *  - /sitemap.xml          -> Sitemap Index
 *  - /post-sitemap.xml     -> Dynamic Blog Posts (auto-syncs with Firestore)
 *  - /page-sitemap.xml     -> Core Site Pages
 *  - /tool-sitemap.xml     -> All 78 Online Tools
 *  - /category-sitemap.xml -> Tool Categories
 */

header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex, follow');

$BASE_URL = 'https://protoolbox.in';
$FIREBASE_PROJECT = 'tool-sathi001';

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

/**
 * Format datetime for sitemap (ISO 8601: Y-m-d\TH:i:sP)
 */
function formatSitemapDate($dateStr = null) {
    if (empty($dateStr)) {
        return date('c');
    }
    $ts = strtotime($dateStr);
    if ($ts === false || $ts <= 0) {
        return date('c');
    }
    return date('c', $ts);
}

/**
 * Fetch dynamic blog posts from Firestore REST API (with 5-minute cache)
 */
function getDynamicBlogPosts($projectId) {
    $cacheFile = sys_get_temp_dir() . '/protoolbox_sitemap_blogs.json';
    $cacheTtl = 300; // 5 minutes

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && is_array($cached)) {
            return $cached;
        }
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

                // Priority: updateTime > publishedAt > now
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

    // Fallback if empty or offline
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

// ─── 1. SITEMAP INDEX (https://protoolbox.in/sitemap.xml) ────────────────────
if ($type === 'index') {
    $posts = getDynamicBlogPosts($FIREBASE_PROJECT);
    $latestPostDate = !empty($posts[0]['lastmod']) ? $posts[0]['lastmod'] : date('c');
    $pageDate = date('c');
    $toolDate = date('c', file_exists($dataFile) ? filemtime($dataFile) : time());

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
    echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    // Post Sitemap
    echo "  <sitemap>\n";
    echo "    <loc>{$BASE_URL}/post-sitemap.xml</loc>\n";
    echo "    <lastmod>{$latestPostDate}</lastmod>\n";
    echo "  </sitemap>\n";

    // Page Sitemap
    echo "  <sitemap>\n";
    echo "    <loc>{$BASE_URL}/page-sitemap.xml</loc>\n";
    echo "    <lastmod>{$pageDate}</lastmod>\n";
    echo "  </sitemap>\n";

    // Tool Sitemap
    echo "  <sitemap>\n";
    echo "    <loc>{$BASE_URL}/tool-sitemap.xml</loc>\n";
    echo "    <lastmod>{$toolDate}</lastmod>\n";
    echo "  </sitemap>\n";

    // Category Sitemap
    echo "  <sitemap>\n";
    echo "    <loc>{$BASE_URL}/category-sitemap.xml</loc>\n";
    echo "    <lastmod>{$toolDate}</lastmod>\n";
    echo "  </sitemap>\n";

    echo '</sitemapindex>';
    exit;
}

// ─── 2. POST SITEMAP (https://protoolbox.in/post-sitemap.xml) ────────────────
if ($type === 'post') {
    $posts = getDynamicBlogPosts($FIREBASE_PROJECT);

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($posts as $p) {
        $url = htmlspecialchars("{$BASE_URL}/blog/{$p['slug']}", ENT_QUOTES, 'UTF-8');
        echo "  <url>\n";
        echo "    <loc>{$url}</loc>\n";
        echo "    <lastmod>{$p['lastmod']}</lastmod>\n";
        echo "    <changefreq>{$p['changefreq']}</changefreq>\n";
        echo "    <priority>{$p['priority']}</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>';
    exit;
}

// ─── 3. PAGE SITEMAP (https://protoolbox.in/page-sitemap.xml) ────────────────
if ($type === 'page') {
    $now = date('c');

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($siteData['pages'] as $page) {
        $path = ltrim($page['path'], '/');
        $url = $path === '' ? "{$BASE_URL}/" : "{$BASE_URL}/{$path}";
        echo "  <url>\n";
        echo "    <loc>" . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . "</loc>\n";
        echo "    <lastmod>{$now}</lastmod>\n";
        echo "    <changefreq>{$page['changefreq']}</changefreq>\n";
        echo "    <priority>{$page['priority']}</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>';
    exit;
}

// ─── 4. TOOL SITEMAP (https://protoolbox.in/tool-sitemap.xml) ────────────────
if ($type === 'tool') {
    $date = date('c', file_exists($dataFile) ? filemtime($dataFile) : time());

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    $featured = ['video-player', 'terabox-video-player', 'diskwala-video-player', 'pdf-merger', 'image-compressor'];

    foreach ($siteData['tools'] as $slug) {
        $prio = in_array($slug, $featured) ? '0.9' : '0.8';
        $url = htmlspecialchars("{$BASE_URL}/tools/{$slug}", ENT_QUOTES, 'UTF-8');
        echo "  <url>\n";
        echo "    <loc>{$url}</loc>\n";
        echo "    <lastmod>{$date}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>{$prio}</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>';
    exit;
}

// ─── 5. CATEGORY SITEMAP (https://protoolbox.in/category-sitemap.xml) ────────
if ($type === 'category') {
    $date = date('c');

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($siteData['categories'] as $cat) {
        $url = htmlspecialchars("{$BASE_URL}/category/{$cat}", ENT_QUOTES, 'UTF-8');
        echo "  <url>\n";
        echo "    <loc>{$url}</loc>\n";
        echo "    <lastmod>{$date}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";
    }

    echo '</urlset>';
    exit;
}
