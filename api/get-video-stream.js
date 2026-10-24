import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Extract Diskwala File ID from various link formats:
 * - https://www.diskwala.com/app/6acf185b2a52418b2433aeb6
 * - https://diskwala.com/c/6acf185b2a52418b2433aeb6
 * - https://diskwala.com/file/6acf185b2a52418b2433aeb6
 * - Raw ID: 6acf185b2a52418b2433aeb6
 */
export function extractDiskwalaId(rawUrl) {
  if (!rawUrl) return null;
  const clean = String(rawUrl).trim();

  const match = clean.match(/(?:app|c|file|play|view|v|d)\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) return match[1];

  // If already a valid hex/alphanumeric ID
  if (/^[a-zA-Z0-9_-]{12,}$/.test(clean)) return clean;

  return null;
}

/**
 * Core Resolver function to extract direct stream link (.mp4 or .m3u8)
 */
export async function resolveDiskwalaStream(targetUrl) {
  if (!targetUrl) throw new Error('Target URL or file ID is required');

  const cleanUrl = targetUrl.trim();

  // 1. Direct video URL passthrough: If URL is already a direct media file
  if (/\.(mp4|m3u8|webm)(\?.*)?$/i.test(cleanUrl)) {
    const isHls = cleanUrl.includes('.m3u8');
    return {
      streamUrl: cleanUrl,
      proxyStreamUrl: `/api/stream?url=${encodeURIComponent(cleanUrl)}`,
      title: cleanUrl.split('/').pop()?.split('?')[0] || 'Direct Stream',
      format: isHls ? 'hls' : 'mp4'
    };
  }

  const fileId = extractDiskwalaId(cleanUrl);
  const normalizedUrl = fileId ? `https://www.diskwala.com/app/${fileId}` : cleanUrl;

  // 2. Try lightweight page scraping
  try {
    const pageRes = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    const html = typeof pageRes.data === 'string' ? pageRes.data : '';

    // A. Check for direct .m3u8 or .mp4 links in the HTML or embedded scripts
    const mediaRegex = /https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)(?:\?[^\s"'<>]*)?/gi;
    const mediaMatches = html.match(mediaRegex);
    if (mediaMatches && mediaMatches.length > 0) {
      const streamUrl = mediaMatches[0];
      const isHls = streamUrl.includes('.m3u8');
      return {
        streamUrl,
        proxyStreamUrl: `/api/stream?url=${encodeURIComponent(streamUrl)}`,
        title: 'Diskwala Stream',
        format: isHls ? 'hls' : 'mp4'
      };
    }

    // B. Check for <source src="..."> or <video src="...">
    const sourceMatch = html.match(/<(?:source|video)[^>]+src=["']([^"']+)["']/i);
    if (sourceMatch && sourceMatch[1] && sourceMatch[1].startsWith('http')) {
      const streamUrl = sourceMatch[1];
      return {
        streamUrl,
        proxyStreamUrl: `/api/stream?url=${encodeURIComponent(streamUrl)}`,
        title: 'Diskwala Video',
        format: streamUrl.includes('.m3u8') ? 'hls' : 'mp4'
      };
    }

    // C. Check for JSON data with file or stream properties
    const jsonUrlMatch = html.match(/["'](?:stream_?url|video_?url|direct_?url|file_?url|dlink|download_?url)["']\s*:\s*["'](https?:\/\/[^"']+)["']/i);
    if (jsonUrlMatch && jsonUrlMatch[1]) {
      const streamUrl = jsonUrlMatch[1];
      return {
        streamUrl,
        proxyStreamUrl: `/api/stream?url=${encodeURIComponent(streamUrl)}`,
        title: 'Diskwala Video',
        format: streamUrl.includes('.m3u8') ? 'hls' : 'mp4'
      };
    }
  } catch (err) {
    console.warn('[Diskwala Scrape Notice]:', err.message);
  }

  // 3. Fallback: Query Diskwala API endpoints if available
  if (fileId) {
    const apiEndpoints = [
      { url: `https://ddudapidd.diskwala.com/api/v1/public/c/${fileId}`, method: 'get' },
      { url: 'https://ddudapidd.diskwala.com/api/v1/file/temp_info', method: 'post', data: { id: fileId } },
      { url: `https://www.diskwala.com/api/file/${fileId}`, method: 'get' }
    ];

    for (const ep of apiEndpoints) {
      try {
        const apiRes = await axios({
          method: ep.method,
          url: ep.url,
          data: ep.data,
          headers: {
            'User-Agent': USER_AGENT,
            'Origin': 'https://www.diskwala.com',
            'Referer': `https://www.diskwala.com/app/${fileId}`
          },
          timeout: 6000
        });

        const data = apiRes.data;
        const candidateUrl = data?.streamUrl || data?.videoUrl || data?.dlink || data?.fileInfo?.url || data?.data?.url;
        if (candidateUrl && typeof candidateUrl === 'string' && candidateUrl.startsWith('http')) {
          return {
            streamUrl: candidateUrl,
            proxyStreamUrl: `/api/stream?url=${encodeURIComponent(candidateUrl)}`,
            title: data?.fileInfo?.name || data?.title || 'Diskwala Video',
            format: candidateUrl.includes('.m3u8') ? 'hls' : 'mp4'
          };
        }
      } catch (e) {
        // Continue to next fallback
      }
    }
  }

  // 4. Fallback: Check if yt-dlp is available in the environment
  try {
    const { stdout } = await execAsync(`yt-dlp --get-url --no-check-certificates "${cleanUrl}"`, { timeout: 8000 });
    const directUrl = stdout.trim().split('\n')[0];
    if (directUrl && directUrl.startsWith('http')) {
      return {
        streamUrl: directUrl,
        proxyStreamUrl: `/api/stream?url=${encodeURIComponent(directUrl)}`,
        title: 'Diskwala Video',
        format: directUrl.includes('.m3u8') ? 'hls' : 'mp4'
      };
    }
  } catch (ytErr) {
    // yt-dlp not available or failed; continue
  }

  // If no direct link could be extracted
  throw new Error(
    `Unable to extract video stream from Diskwala URL (${cleanUrl}). The link may be private, expired, or requires the Diskwala mobile app.`
  );
}

/**
 * Serverless / Express Route Handler:
 * GET or POST /api/get-video-stream?url=...
 */
export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.query?.url || req.body?.url;
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter `url` is required (e.g., /api/get-video-stream?url=https://www.diskwala.com/app/6acf185b2a52418b2433aeb6)'
    });
  }

  try {
    const streamData = await resolveDiskwalaStream(url);
    return res.status(200).json({
      success: true,
      ...streamData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract video stream'
    });
  }
}
