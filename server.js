import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import https from 'https';

// High-Performance HTTPS Keep-Alive Agent for 0ms TLS connection reuse
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  maxFreeSockets: 20,
  keepAliveMsecs: 60000
});

// Fast In-Memory Buffer Cache for seamless, zero-buffer video playback
const videoMemoryCache = new Map();
const MAX_CACHE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB maximum RAM

function getCachedTotalBytes() {
  let sum = 0;
  for (const item of videoMemoryCache.values()) {
    if (item.buffer) sum += item.buffer.length;
  }
  return sum;
}

// Background prefetch function to load the entire video into RAM
async function prefetchVideoIntoCache(url, headers, totalSize) {
  if (videoMemoryCache.has(url) || (getCachedTotalBytes() + totalSize > MAX_CACHE_SIZE_BYTES)) {
    return;
  }
  try {
    const fetchHeaders = { ...headers };
    delete fetchHeaders['Range'];

    console.log(`[Cache] Pre-buffering video (${(totalSize / (1024 * 1024)).toFixed(2)} MB) into RAM for smooth playback...`);
    const resp = await axios.get(url, {
      headers: fetchHeaders,
      responseType: 'arraybuffer',
      httpsAgent: httpsAgent,
      timeout: 45000
    });

    if (resp.status === 200 && resp.data) {
      videoMemoryCache.set(url, {
        buffer: Buffer.from(resp.data),
        totalLength: resp.data.length,
        contentType: resp.headers['content-type'] || 'video/mp4',
        timestamp: Date.now()
      });
      console.log(`[Cache] Video fully buffered in RAM! Playback is now 100% instant and buffer-free.`);
    }
  } catch (e) {
    console.warn('[Cache] Background prefetch notice:', e.message);
  }
}

// Read .env configuration if present
if (fs.existsSync('.env')) {
  try {
    const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const eqIdx = trimmed.indexOf('=');
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (val && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('[Env] Notice loading .env:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges']
}));

app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'terabox-proxy' }));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function extractSurl(rawUrl) {
  if (!rawUrl) return null;
  const clean = rawUrl.trim();

  try {
    const urlObj = new URL(clean);
    const surl = urlObj.searchParams.get('surl');
    if (surl) return surl.startsWith('1') ? surl.slice(1) : surl;
  } catch {}

  const match = clean.match(/(?:surl=|\/s\/(?:1)?)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  return clean.replace(/[^a-zA-Z0-9_-]/g, '');
}

// High-Speed Token and Metadata Caches
let cachedJsToken = { token: '', timestamp: 0 };
const surlMetadataCache = new Map(); // surl -> { data, timestamp }

async function getOrFetchJsToken(surlKey, cookieHeader) {
  const now = Date.now();
  // Cached token valid for 2 hours
  if (cachedJsToken.token && (now - cachedJsToken.timestamp < 2 * 60 * 60 * 1000)) {
    return cachedJsToken.token;
  }

  const pageUrl = `https://dm.terabox.app/sharing/link?surl=${surlKey}`;
  const pageHeaders = {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
  };

  try {
    const pageRes = await axios.get(pageUrl, { headers: pageHeaders, httpsAgent, timeout: 6000 });
    const match = pageRes.data.match(/fn%28%22(.*?)%22%29/);
    if (match && match[1]) {
      cachedJsToken = { token: match[1], timestamp: now };
      return match[1];
    }
  } catch (e) {
    console.warn(`[Token] Warning fetching jsToken: ${e.message}`);
  }
  return cachedJsToken.token || '';
}

async function resolveTeraBoxShortUrl(surlKey, activeNdus, pwd = '') {
  const cacheKey = `${surlKey}:${pwd}`;
  const cached = surlMetadataCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
    return cached.data;
  }

  const cookieHeader = activeNdus ? `ndus=${activeNdus}` : '';
  const jsToken = await getOrFetchJsToken(surlKey, cookieHeader);

  const pageUrl = `https://dm.terabox.app/sharing/link?surl=${surlKey}`;
  const shareApiUrl = new URL('https://dm.terabox.app/share/list');
  shareApiUrl.searchParams.append('app_id', '250528');
  if (jsToken) shareApiUrl.searchParams.append('jsToken', jsToken);
  shareApiUrl.searchParams.append('shorturl', surlKey);
  shareApiUrl.searchParams.append('root', '1');
  if (pwd) shareApiUrl.searchParams.append('pwd', pwd);

  const apiHeaders = {
    'Host': 'dm.terabox.app',
    'User-Agent': USER_AGENT,
    'Referer': pageUrl,
    'Origin': 'https://dm.terabox.app',
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest',
    ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
  };

  const response = await axios.get(shareApiUrl.toString(), {
    headers: apiHeaders,
    httpsAgent,
    timeout: 8000
  });

  const data = response.data;
  if (!data || data.errno !== 0 || !Array.isArray(data.list) || data.list.length === 0) {
    throw new Error(data?.errno === -9 ? 'Password required or incorrect password.' : (data?.errmsg || 'File not found on TeraBox.'));
  }

  const file = data.list[0];
  const result = {
    file_name: file.server_filename,
    title: file.server_filename,
    size: file.size,
    thumb: file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1,
    dlink: file.dlink,
    surl: surlKey,
    hasDirectStream: Boolean(file.dlink),
    streamProxyUrl: file.dlink ? `/api/stream?url=${encodeURIComponent(file.dlink)}` : null
  };

  surlMetadataCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * 1. Resolve TeraBox Link
 * POST /api/resolve
 */
app.post('/api/resolve', async (req, res) => {
  const { url, ndus: reqNdus = '', pwd = '' } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'TeraBox URL is required' });

  const rawSurl = extractSurl(url);
  const surlKey = rawSurl && rawSurl.startsWith('1') && rawSurl.length > 15 ? rawSurl.slice(1) : rawSurl;
  if (!surlKey) return res.status(400).json({ success: false, error: 'Invalid TeraBox share link format' });

  const activeNdus = reqNdus || process.env.TERABOX_COOKIE || process.env.NDUS || '';

  try {
    const result = await resolveTeraBoxShortUrl(surlKey, activeNdus, pwd);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. High-Speed Range Streaming Proxy with In-Memory Cache
 * GET /api/stream?url=<encoded_dlink>
 */
app.get('/api/stream', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || targetUrl === 'undefined' || !targetUrl.startsWith('http')) {
    return res.status(400).send('Valid stream URL parameter is required');
  }

  const rangeHeader = req.headers.range;
  const activeNdus = process.env.TERABOX_COOKIE || process.env.NDUS || '';
  const cookieHeader = activeNdus ? `ndus=${activeNdus}` : '';

  // 1. FAST-PATH: If file is in RAM, serve instantly with 0ms buffering!
  const cached = videoMemoryCache.get(targetUrl);
  if (cached && cached.buffer) {
    cached.timestamp = Date.now();
    const total = cached.totalLength || cached.buffer.length;
    const contentType = cached.contentType || 'video/mp4';

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunksize = (end - start) + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      
      const chunk = cached.buffer.subarray(start, end + 1);
      return res.end(chunk);
    } else {
      res.status(200);
      res.setHeader('Content-Length', total);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.end(cached.buffer);
    }
  }

  try {
    const proxyHeaders = {
      'User-Agent': USER_AGENT,
      'Referer': 'https://dm.terabox.app/',
      'Accept': '*/*',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
    };

    if (rangeHeader) {
      proxyHeaders['Range'] = rangeHeader;
    }

    console.log(`[Proxy] Streaming video. Range: ${rangeHeader || 'All'}`);

    const upstream = await axios({
      method: 'GET',
      url: targetUrl,
      headers: proxyHeaders,
      responseType: 'stream',
      httpsAgent: httpsAgent,
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 400
    });

    const forwardHeaders = [
      'content-range',
      'content-length',
      'content-type',
      'accept-ranges',
      'last-modified',
      'etag'
    ];

    forwardHeaders.forEach(h => {
      const val = upstream.headers[h];
      if (val) res.setHeader(h, val);
    });

    if (!res.getHeader('content-type')) {
      res.setHeader('content-type', 'video/mp4');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    res.status(upstream.status);
    upstream.data.pipe(res);

    upstream.data.on('error', err => {
      console.error('[Proxy Stream Error]:', err.message);
      if (!res.headersSent) res.status(502).end();
    });

    // Proactively pre-buffer the video into RAM cache in the background for smooth playback
    const contentLength = parseInt(upstream.headers['content-length'] || '0', 10);
    const contentRange = upstream.headers['content-range'];
    let fullTotal = contentLength;
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)/);
      if (match && match[1]) fullTotal = parseInt(match[1], 10);
    }

    if (fullTotal > 0 && fullTotal <= 70 * 1024 * 1024 && !videoMemoryCache.has(targetUrl)) {
      prefetchVideoIntoCache(targetUrl, proxyHeaders, fullTotal);
    }

  } catch (error) {
    console.error('[Proxy Error]:', error.message);
    if (!res.headersSent) {
      res.status(502).send('Proxy streaming failed: ' + error.message);
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'TeraBox Streaming Proxy v2', port: PORT });
});

/**
 * 3. terabox-gateway specification compatibility endpoint
 * GET /api?mode=stream&surl=SHARE_ID
 * GET /api?mode=resolve&surl=SHARE_ID
 */
app.get('/api', async (req, res) => {
  const mode = req.query.mode || 'resolve';
  const rawSurl = req.query.surl || extractSurl(req.query.url);
  const surl = rawSurl ? (rawSurl.startsWith('1') && rawSurl.length > 15 ? rawSurl.slice(1) : rawSurl) : null;

  if (!surl) {
    return res.status(400).json({ error: 'Parameter `surl` or `url` is required' });
  }

  const activeNdus = req.query.ndus || process.env.TERABOX_COOKIE || process.env.NDUS || '';

  try {
    const file = await resolveTeraBoxShortUrl(surl, activeNdus);

    // Mode: Resolve -> Instant cached metadata
    if (mode === 'resolve') {
      return res.json({
        file_name: file.file_name,
        title: file.title,
        size: file.size,
        thumb: file.thumb,
        dlink: file.dlink,
        surl: surl
      });
    }

    // Mode: Stream -> Instant redirect without re-resolving
    if (mode === 'stream') {
      if (file.dlink) {
        return res.redirect(`/api/stream?url=${encodeURIComponent(file.dlink)}`);
      } else {
        return res.status(403).json({
          error: 'Direct link requires active TeraBox cookie. Please set TERABOX_COOKIE in your .env'
        });
      }
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` });
  } catch (err) {
    return res.status(500).json({ error: 'Gateway processing error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` TeraBox Streaming Proxy v2 Running on :${PORT}`);
  console.log(`===============================================`);
});
