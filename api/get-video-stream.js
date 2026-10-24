import puppeteer from 'puppeteer';
import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Extract Diskwala File ID from various link formats
 */
export function extractDiskwalaId(rawUrl) {
  if (!rawUrl) return null;
  const clean = String(rawUrl).trim();
  const match = clean.match(/(?:app|c|file|play|view|v|d)\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{12,}$/.test(clean)) return clean;
  return null;
}

/**
 * Puppeteer-based Diskwala Stream Extractor
 * Launches headless browser, navigates to the page, and intercepts network traffic
 */
export async function extractWithPuppeteer(shareUrl) {
  let browser = null;
  let directVideoUrl = null;
  let interceptedFileInfo = null;

  try {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
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
    await page.setUserAgent(USER_AGENT);

    // Intercept network requests for media streams
    page.on('request', (request) => {
      const reqUrl = request.url();
      // Ensure we don't accidentally match Google / DoubleClick ad scripts containing 'instream'
      const isAdOrScript = reqUrl.includes('doubleclick') || reqUrl.includes('2mdn.net') || reqUrl.endsWith('.js') || reqUrl.includes('analytics');
      if (!isAdOrScript) {
        if (reqUrl.includes('.mp4') || reqUrl.includes('.m3u8') || reqUrl.includes('.webm') || reqUrl.includes('/stream/')) {
          console.log('[Puppeteer Intercepted Stream]:', reqUrl);
          directVideoUrl = reqUrl;
        }
      }
    });

    // Intercept responses for Diskwala API metadata or direct video responses
    page.on('response', async (response) => {
      const respUrl = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (contentType.includes('video/') || contentType.includes('application/vnd.apple.mpegurl')) {
        if (!respUrl.includes('doubleclick') && !respUrl.includes('2mdn.net')) {
          console.log('[Puppeteer Video Response]:', respUrl);
          directVideoUrl = respUrl;
        }
      }

      // Capture Diskwala file info JSON if present
      if (respUrl.includes('temp_info') || respUrl.includes('diskwala.com/api')) {
        try {
          const body = await response.json();
          if (body?.fileInfo) {
            interceptedFileInfo = body.fileInfo;
          }
        } catch (e) {}
      }
    });

    // Navigate to Diskwala page
    console.log(`[Puppeteer] Navigating to: ${shareUrl}`);
    await page.goto(shareUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for player scripts to initialize and send requests
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Also check DOM for <video> or <source> tags
    if (!directVideoUrl) {
      const domVideoSrc = await page.evaluate(() => {
        const v = document.querySelector('video source, video');
        return v ? (v.src || v.getAttribute('src')) : null;
      });
      if (domVideoSrc && domVideoSrc.startsWith('http') && !domVideoSrc.endsWith('.js')) {
        directVideoUrl = domVideoSrc;
      }
    }

    await browser.close();
    browser = null;

    return {
      streamUrl: directVideoUrl,
      fileInfo: interceptedFileInfo
    };
  } catch (err) {
    if (browser) await browser.close();
    console.warn('[Puppeteer Extraction Notice]:', err.message);
    throw err;
  }
}

/**
 * Route Handler:
 * GET or POST /api/get-video-stream?url=...
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const shareUrl = req.query?.url || req.body?.url;
  if (!shareUrl) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  const cleanUrl = shareUrl.trim();

  // 1. Direct video URL passthrough: If already a direct mp4/m3u8
  if (/\.(mp4|m3u8|webm)(\?.*)?$/i.test(cleanUrl)) {
    const isHls = cleanUrl.includes('.m3u8');
    return res.json({
      success: true,
      videoUrl: cleanUrl,
      streamUrl: cleanUrl,
      proxyStreamUrl: `/api/stream?url=${encodeURIComponent(cleanUrl)}`,
      title: cleanUrl.split('/').pop()?.split('?')[0] || 'Direct Stream',
      format: isHls ? 'hls' : 'mp4'
    });
  }

  // 2. Try Puppeteer headless browser extraction
  try {
    const puppeteerResult = await extractWithPuppeteer(cleanUrl);

    if (puppeteerResult.streamUrl) {
      const isHls = puppeteerResult.streamUrl.includes('.m3u8');
      return res.json({
        success: true,
        videoUrl: puppeteerResult.streamUrl,
        streamUrl: puppeteerResult.streamUrl,
        proxyStreamUrl: `/api/stream?url=${encodeURIComponent(puppeteerResult.streamUrl)}`,
        title: puppeteerResult.fileInfo?.name || 'Diskwala Video',
        format: isHls ? 'hls' : 'mp4',
        fileInfo: puppeteerResult.fileInfo
      });
    }

    // If Puppeteer ran but Diskwala did not load a web player
    if (puppeteerResult.fileInfo) {
      return res.json({
        success: false,
        error: `Diskwala file found ("${puppeteerResult.fileInfo.name}", ${(puppeteerResult.fileInfo.size / (1024 * 1024)).toFixed(2)} MB), but Diskwala blocks web streaming for this link and requires the mobile app.`,
        fileInfo: puppeteerResult.fileInfo
      });
    }

    return res.json({
      success: false,
      error: 'Direct stream link capture nahi ho paya.'
    });
  } catch (err) {
    // 3. Fallback: Check if external resolver or API key is configured
    const resolverUrl = process.env.DISKWALA_RESOLVER_URL;
    const apiKey = process.env.DISKWALA_API_KEY;

    if (resolverUrl || apiKey) {
      try {
        const endpoint = resolverUrl || 'https://api.teraboxapi.com/v1/diskwala';
        const gatewayRes = await axios.post(
          endpoint,
          { url: cleanUrl },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'X-API-Key': apiKey, 'Authorization': `Bearer ${apiKey}` } : {})
            },
            timeout: 10000
          }
        );

        const gData = gatewayRes.data;
        const extractedUrl = gData?.hls_stream_url || gData?.download_url || gData?.stream_url || gData?.url;
        if (extractedUrl && typeof extractedUrl === 'string' && extractedUrl.startsWith('http')) {
          return res.json({
            success: true,
            videoUrl: extractedUrl,
            streamUrl: extractedUrl,
            proxyStreamUrl: `/api/stream?url=${encodeURIComponent(extractedUrl)}`,
            title: gData?.file?.name || gData?.title || 'Diskwala Video',
            format: extractedUrl.includes('.m3u8') ? 'hls' : 'mp4'
          });
        }
      } catch (gErr) {
        console.warn('[Resolver Gateway Notice]:', gErr.message);
      }
    }

    return res.json({ success: false, error: err.message });
  }
}
