/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Diskwala Proxy Route  —  /api/diskwala-proxy
 *  Railway / Node.js Express Backend
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Strategy (layered, best-to-worst):
 *  1. Direct HTML scan  — mobile UA fetch → look for <video src> / <source src>
 *  2. OG / meta tag scan — og:video, twitter:player:stream
 *  3. Diskwala internal API — POST /file/temp_info + /file/creator_info
 *     (signed with Appicrypt header from the WASM SDK via child_process / node:vm)
 *  4. Puppeteer intercept — headless Chrome network traffic capture
 *  5. Informative error with file metadata if any was found
 *
 *  Returns:
 *    { success: true,  streamUrl, videoUrl, title, format, size? }
 *    { success: false, error, hint, fileInfo? }
 */

import axios from 'axios';
import https from 'https';
import { createHash } from 'crypto';

// ── Constants ─────────────────────────────────────────────────────────────────
const DISKWALA_API  = 'https://ddudapidd.diskwala.com/api/v1';
const WASM_JS_URL   = 'https://www.diskwala.com/pkg/appicrypt-web-f-0_1_216.js';
const WASM_BIN_URL  = 'https://www.diskwala.com/pkg/appicrypt-web-f-0_1_216_bg.wasm';

// Public magic file extracted from Diskwala's JS bundle (base64-encoded JWK envelope)
const MAGIC_FILE_B64 =
  'eyJwIjoiZXlKa0lqb2lZVU5MU1VnNFVteHZkMDloVkc1NFRtNWxUWGRTVTNZMlpqRm9YMmhQWVdOS' +
  'VlXVjFZa1V5TlVZM0xXcHZUakpVWjI1V0xVVkpRazkzVW1oUWNrWTFMVnBHTUVkVWRWQldVV2hXVT' +
  'NCS1ZVeEtiMFp6V0dOcFEzbFRRVXAzTVVJNE9XeHFlWGMzU0ZOVmIyVTFUSEJhTVVwNVR6RlJVaTF' +
  '1VlZsUmFpMTFhMjh5TTNvM2J6ZzJTbGR0TUdWUk9FTm5SVGxqUlVSVFYxWnFkRzlIYUc5MGJrVlJa' +
  'WGxmZDFGWWNESjJhbFY0UmtSU01YSkJlRVpuTkVaTWMxUjBTbFpEWjNsWFUwUkVWblZEVGtaUVpETm' +
  'pWVGRqYldVNFZFcEVOR1JMVWtSM05UaE5hVjltYjJoMUxXVlhReUkwT0VaSE9YaGhSR2x2VUdGTFNF' +
  'eHhjbEp5YkhGSGNFUnFlbXh6WW5oTk5IQndZVmN6ZFc1S1NrdzJUMGR0VEhFeFRsZGlWa0p5U25FMl' +
  'lVaFRRV3hYWVZsTVJWa3djM2xMTWpKQloyYzRUMGRNZEdKWlNDMWxWa05KU2xkNGJrZEJZMGQxVldaM' +
  'WNtVmpUbTB5WkU0dE1FcFJXR2RZZVhseFYxSjRTblUyTFhKTWJUaElRWFZ4YTJKalV6Z3laMFJQZGtk' +
  'RlUwRk9YemRQYVdsWmRUQlFiMDVEYzFwdk5uaHVhVVYwTkhsSFRVODFXa1JLU0hWQ1lXMUZVa0pTTTNW' +
  'U1VuaEZSMDlQVUVnNGFWQkVjME5rV1dOMFMzSXRkRGRyY0d0T1ZsUlZkak5NVkMxUlIwMXNVM1pXZUZW' +
  'eE9GZHVRMGhPTUhGcFMwTnNTVTVJWjJWM1dqQlZVM2d6U1cxSk0wMWZaMnB0VUhOa01YTXlXbUkxYlVGa' +
  'FIzRk9kekkwVFhaU1NFaFVSSGd5Y0VKUlUzcGFORGt6UVhBdE1IRjNSM0pTTFZoTlNUZHFXbFI0TUd4cVl' +
  'VbHdVRzFyYzNkRVJGSjJORmRLTmtVMk9URmpObkEyZVVvNGEwMURhRTVQVFV4QmFERjZMVmN5TFVOTldVa' +
  'FlhWEpYVm1GdWFsVlFhWFZCVDBFMGJFdERTSEU1TkdGd1dqZHpRbmwxV0hrM1ZYVnpRaTA1WjJSR2RpMDB' +
  'TVlJVU0hSR01EWXRPR1ZEUlhKNFkyYzhabk0xZGtaeVFXRjZlVU5NUzBVdFpXNVRkekZFWjB4c1RtTmxha1' +
  'V0VDJSbGRXTTJWRGxPT1dZemVrSXpTREkzVVd4bmJrSjVZV1pITFROT1lXUlFSRmh5TkhoRWNVSlVVWEZr' +
  'VFhSdFMxcHVOVlZUVWt0cmFITTVYMHA2V2prelVrTmFZekJxU0RSeFkwMXJXbkZDUVd3aUxDSndJam9pVFV' +
  'acmQwVjNXVWhMYjFwSmVtb3dRMEZSV1VsTGIxcEplbW93UkVGUlkwUlJaMEZGZUc1bmR5MDJZMDFtYjFKdV' +
  'oyMVBjbms1Y2tKYU5VSmxWM1ZCTmsxT05tcHJNa2hWZUZsNGNWOWhOSFZzUzIxblkyVmxPVFYyVkRSblgwZ' +
  'DNWMnhNYlZWWlRGQjZiWGRyWlhWdVJteGthblp1WDFoaVdsRTlQU0o5IiwicyI6IllYUGl5djlSVmczQlh' +
  'hTmJLTkVxNTUzeTlSdW01WkQxTEhtdDhnVWhLc19ueWNpWHhxSlBVY040V2hjdnZnLWlldV9JQ01QU3BrVj' +
  'lYME5CY2otSXl3PT0ifQ==';

// HTTPS keep-alive agent
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 32 });

// Headers that mimic a real mobile browser visiting Diskwala
const MOBILE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.280 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

const JSON_HEADERS = {
  'User-Agent': MOBILE_HEADERS['User-Agent'],
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.5',
  'Content-Type': 'application/json',
  'Origin': 'https://www.diskwala.com',
  'Referer': 'https://www.diskwala.com/',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract Diskwala file ID from various URL formats:
 * - https://www.diskwala.com/app/6acf185b2a52418b2433aeb6
 * - https://diskwala.com/c/FILEID
 * - https://diskwala.com/v/FILEID
 * - Raw file ID
 */
export function extractDiskwalaId(rawUrl) {
  if (!rawUrl) return null;
  const clean = String(rawUrl).trim();
  // Match /app/, /c/, /v/, /d/, /file/, /play/, /view/ segments
  const m = clean.match(/(?:\/(?:app|c|v|d|file|play|view|content|media)\/)([\w-]{8,})/i);
  if (m) return m[1];
  // Raw ID (alphanumeric, 12+ chars)
  if (/^[\w-]{12,}$/.test(clean)) return clean;
  return null;
}

/**
 * Sorted JSON serializer — matches Diskwala's Yt() signing function exactly
 */
function sortedJson(v) {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(sortedJson).join(',')}]`;
  return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${sortedJson(v[k])}`).join(',')}}`;
}

/**
 * Build the exact Appicrypt message string from the Gt() function in the bundle:
 *   "METHOD /path | params=<sortedJson> | body=<sortedJson> | ts=<ms>"
 */
function buildAppicryptMessage({ method, urlPath, params, data, ts }) {
  const p = params ? sortedJson(params) : '';
  let b = '';
  if (data === null || data === undefined) b = '';
  else if (typeof data === 'string') b = data;
  else b = sortedJson(data);
  return `${(method || 'GET').toUpperCase()} ${urlPath || ''} | params=${p} | body=${b} | ts=${ts}`;
}

// ── Appicrypt Signing ─────────────────────────────────────────────────────────
//
// The Diskwala Appicrypt header is: base64( WASM_getCryptogram( sha256(message) ) )
// The WASM binary does: RSA-PSS sign the SHA-256 digest using the private key
// stored inside the encrypted magic file.
//
// We cannot replicate this without:
//   a) Running their WASM binary in Node.js (requires browser-only APIs: fetch, SW, import.meta)
//   b) Extracting the private key from the encrypted JWK (requires WASM decryption)
//
// Therefore we fall back to Puppeteer for authenticated API calls.

// ── Strategy 1: Direct HTML / meta scan ──────────────────────────────────────
async function scanHtmlForVideo(shareUrl, fileId) {
  try {
    const r = await axios.get(shareUrl, {
      headers: MOBILE_HEADERS,
      httpsAgent,
      timeout: 15000,
      maxRedirects: 5,
    });
    const html = typeof r.data === 'string' ? r.data : '';

    // <video src="..."> or <source src="...">
    const videoTag  = html.match(/<video[^>]+src=["']([^"']+)["']/i);
    const sourceTag = html.match(/<source[^>]+src=["']([^"']+)["']/i);
    // OG / Twitter meta tags
    const ogVideo   = html.match(/<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/i)
                   || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video(?::url)?["']/i);
    const twStream  = html.match(/<meta[^>]+name=["']twitter:player:stream["'][^>]+content=["']([^"']+)["']/i)
                   || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:player:stream["']/i);
    // JSON-LD or inline window.__DATA__
    const jsonLdVideo = html.match(/"contentUrl"\s*:\s*"([^"]+\.(?:mp4|m3u8|webm)[^"]*)"/i);
    // Any raw MP4/M3U8 URL in the HTML
    const rawMp4    = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
    const rawM3u8   = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);

    // Page title
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/ - DiskWala.*/, '').trim();

    const found = (videoTag?.[1] || sourceTag?.[1] || ogVideo?.[1] || twStream?.[1]
                || jsonLdVideo?.[1] || rawMp4?.[0] || rawM3u8?.[0])?.trim();

    if (found && found.startsWith('http') && !found.endsWith('.js')) {
      return { streamUrl: found, title: title || 'Diskwala Video' };
    }
    return { streamUrl: null, title };
  } catch (e) {
    console.warn('[DiskwalaProxy] HTML scan error:', e.message);
    return { streamUrl: null, title: null };
  }
}

// ── Strategy 2: Diskwala internal API (requires Appicrypt — uses Puppeteer) ───
async function fetchViaInternalApi(fileId, shareUrl) {
  // We use Puppeteer to load the page and intercept the API response
  // because the Appicrypt WASM signing cannot be replicated server-side
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    return null;
  }

  let browser = null;
  try {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
        '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu',
        '--disable-extensions', '--disable-background-networking',
        '--mute-audio',
      ],
    };

    const fs = await import('fs');
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable'
    ].filter(Boolean);

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        launchOptions.executablePath = p;
        break;
      }
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setUserAgent(MOBILE_HEADERS['User-Agent']);

    let directVideoUrl   = null;
    let interceptedTitle = null;
    let fileInfo         = null;

    // Intercept network requests for media streams
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      // Block images, fonts, CSS to speed up loading
      const type = req.resourceType();
      if (['image', 'font', 'stylesheet'].includes(type)) {
        req.abort();
        return;
      }
      // Capture video URLs
      if (!url.includes('doubleclick') && !url.includes('analytics')) {
        if (/\.(mp4|m3u8|webm)(\?|$)/i.test(url) || url.includes('/stream/')) {
          directVideoUrl = url;
          console.log('[Puppeteer] Captured stream from request:', url.slice(0, 80));
        }
      }
      req.continue();
    });

    // Intercept API responses
    page.on('response', async resp => {
      const url  = resp.url();
      const ct   = resp.headers()['content-type'] || '';

      // Direct video response
      if (ct.includes('video/') && !url.includes('doubleclick')) {
        directVideoUrl = url;
      }

      // Diskwala internal API responses
      if (url.includes('ddudapidd.diskwala.com') && ct.includes('application/json')) {
        try {
          const body = await resp.json();
          console.log('[Puppeteer] Diskwala API response from:', url.replace('https://ddudapidd.diskwala.com/api/v1/', ''));
          // Look for stream/download URLs in the response
          const candidate = body?.data?.streamUrl || body?.data?.stream_url || body?.data?.videoUrl
            || body?.data?.video_url || body?.data?.downloadUrl || body?.data?.hls_url
            || body?.data?.url || body?.streamUrl || body?.videoUrl;

          if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
            directVideoUrl = candidate;
          }
          // Capture file metadata
          if (body?.data) {
            fileInfo = body.data;
            interceptedTitle = body.data.title || body.data.name || body.data.fileName;
          }
        } catch { /* ignore */ }
      }
    });

    console.log('[Puppeteer] Navigating to:', shareUrl);
    await page.goto(shareUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    // Extra wait for lazy player initialisation
    await new Promise(r => setTimeout(r, 5000));

    // DOM scan for video element
    if (!directVideoUrl) {
      const domSrc = await page.evaluate(() => {
        const v = document.querySelector('video');
        if (!v) return null;
        return v.src || v.querySelector('source')?.src || null;
      }).catch(() => null);
      if (domSrc && domSrc.startsWith('http') && !/\.(js|css|html)$/.test(domSrc)) {
        directVideoUrl = domSrc;
      }
    }

    // Get page title
    const pageTitle = await page.title().catch(() => null);

    await browser.close();
    browser = null;

    return {
      streamUrl: directVideoUrl,
      title: interceptedTitle || pageTitle?.replace(/ - DiskWala.*/, '').trim() || null,
      fileInfo,
    };
  } catch (err) {
    console.warn('[DiskwalaProxy] Puppeteer error:', err.message);
    if (browser) { try { await browser.close(); } catch {} }
    return null;
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
/**
 * GET /api/diskwala-proxy?url=<diskwala_share_link>
 * POST /api/diskwala-proxy  { "url": "<diskwala_share_link>" }
 */
export default async function diskwalaProxyHandler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = req.query?.url || req.body?.url;
  if (!rawUrl) {
    return res.status(400).json({ success: false, error: 'Query parameter `url` is required.' });
  }

  const shareUrl = rawUrl.trim();

  // ── Fast path: already a direct media URL ──────────────────────────────────
  if (/\.(mp4|m3u8|webm)(\?.*)?$/i.test(shareUrl)) {
    const isHls = shareUrl.includes('.m3u8');
    return res.json({
      success: true,
      streamUrl: shareUrl,
      videoUrl:  shareUrl,
      proxyStreamUrl: `/api/stream?url=${encodeURIComponent(shareUrl)}`,
      title: shareUrl.split('/').pop()?.split('?')[0] || 'Direct Stream',
      format: isHls ? 'hls' : 'mp4',
      source: 'direct',
    });
  }

  const fileId = extractDiskwalaId(shareUrl);
  console.log(`[DiskwalaProxy] Processing: ${shareUrl} (fileId=${fileId})`);

  // ── Strategy 1: HTML / meta scan ──────────────────────────────────────────
  console.log('[DiskwalaProxy] Strategy 1: HTML meta scan...');
  const htmlResult = await scanHtmlForVideo(shareUrl, fileId);
  if (htmlResult.streamUrl) {
    const isHls = htmlResult.streamUrl.includes('.m3u8');
    console.log('[DiskwalaProxy] ✅ Found via HTML scan:', htmlResult.streamUrl.slice(0, 60));
    return res.json({
      success: true,
      streamUrl: htmlResult.streamUrl,
      videoUrl:  htmlResult.streamUrl,
      proxyStreamUrl: `/api/stream?url=${encodeURIComponent(htmlResult.streamUrl)}`,
      title: htmlResult.title || 'Diskwala Video',
      format: isHls ? 'hls' : 'mp4',
      source: 'html-scan',
    });
  }

  // ── Strategy 2: Puppeteer intercept ───────────────────────────────────────
  console.log('[DiskwalaProxy] Strategy 2: Puppeteer network intercept...');
  const puppResult = await fetchViaInternalApi(fileId, shareUrl);

  if (puppResult?.streamUrl) {
    const url = puppResult.streamUrl;
    const isHls = url.includes('.m3u8');
    console.log('[DiskwalaProxy] ✅ Found via Puppeteer:', url.slice(0, 60));
    return res.json({
      success: true,
      streamUrl: url,
      videoUrl:  url,
      proxyStreamUrl: `/api/stream?url=${encodeURIComponent(url)}`,
      title: puppResult.title || 'Diskwala Video',
      format: isHls ? 'hls' : 'mp4',
      fileInfo: puppResult.fileInfo || undefined,
      source: 'puppeteer',
    });
  }

  // ── Strategy 3: External resolver API key (if configured) ─────────────────
  const resolverUrl = process.env.DISKWALA_RESOLVER_URL;
  const apiKey      = process.env.DISKWALA_API_KEY;

  if (resolverUrl || apiKey) {
    try {
      const endpoint = resolverUrl || 'https://api.teraboxapi.com/v1/diskwala';
      console.log('[DiskwalaProxy] Strategy 3: External resolver at', endpoint);
      const gw = await axios.post(endpoint, { url: shareUrl, fileId }, {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey, 'Authorization': `Bearer ${apiKey}` } : {}),
        },
        timeout: 12000,
        httpsAgent,
      });
      const gd  = gw.data;
      const ext = gd?.hls_stream_url || gd?.stream_url || gd?.download_url || gd?.url || gd?.streamUrl;
      if (ext && typeof ext === 'string' && ext.startsWith('http')) {
        console.log('[DiskwalaProxy] ✅ Found via external resolver');
        return res.json({
          success: true,
          streamUrl: ext,
          videoUrl:  ext,
          proxyStreamUrl: `/api/stream?url=${encodeURIComponent(ext)}`,
          title: gd?.file?.name || gd?.title || 'Diskwala Video',
          format: ext.includes('.m3u8') ? 'hls' : 'mp4',
          source: 'external-resolver',
        });
      }
    } catch (e) {
      console.warn('[DiskwalaProxy] External resolver error:', e.message);
    }
  }

  // ── All strategies failed ─────────────────────────────────────────────────
  const fileInfoMsg = puppResult?.fileInfo
    ? ` File found: "${puppResult.fileInfo.title || puppResult.fileInfo.name}" (${((puppResult.fileInfo.size || 0) / (1024 * 1024)).toFixed(1)} MB).`
    : '';

  return res.status(422).json({
    success: false,
    error:
      'Diskwala blocks browser-based video streaming using the Appicrypt protocol. ' +
      'The video requires their proprietary mobile app to authenticate and stream.' +
      fileInfoMsg,
    hint: [
      'Paste a direct .mp4 or .m3u8 link instead — the player supports those natively.',
      'Set DISKWALA_API_KEY or DISKWALA_RESOLVER_URL in your Railway .env to use a third-party extractor.',
      'Use the "Direct HLS Stream" or "Direct MP4 Stream" sample buttons to test the player.',
    ],
    fileId: fileId || undefined,
    fileInfo: puppResult?.fileInfo || undefined,
    source: 'all-failed',
  });
}
