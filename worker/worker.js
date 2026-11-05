/**
 * ToolSathi TeraBox Gateway — Cloudflare Worker
 * Ports Railway Express server.js to fetch-only ES module Worker.
 * Deploy: cd worker && npx wrangler deploy
 * Secret: npx wrangler secret put TERABOX_COOKIE
 */

// ─── TERABOX COOKIE (PASTE YOUR NDUS COOKIE HERE OR IN CLOUDFLARE SECRETS) ───
const DEFAULT_TERABOX_COOKIE = 'YqsIMBVpeHuirL2Ygy3MXxvrJzN2zaZ2ZxVZR7Cg';
// ─────────────────────────────────────────────────────────────────────────────

// ─── EASY-EDIT: TeraBox host allowlist ───────────────────────────────────────
const ALLOWED_HOSTS = [
  'terabox.com',
  '1024tera.com',
  'teraboxcdn.com',
  'terabox.app',
  'freeterabox.com',
  'dm.terabox.app',
  'teraboxlink.com',
  'momerybox.com',
  'tibibox.com',
  'terabox.fun',
];
// ─────────────────────────────────────────────────────────────────────────────

// ─── CORS ────────────────────────────────────────────────────────────────────
const CORS_ORIGINS = [
  'https://tool-sathi.propdigital360.in',
  'http://tool-sathi.propdigital360.in',
  'https://tool-sathi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (CORS_ORIGINS.includes(origin)) return origin;
  return CORS_ORIGINS[0]; // default to production domain
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
// ─────────────────────────────────────────────────────────────────────────────

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Per-isolate in-memory caches (short-lived, best-effort) ─────────────────
// Workers have no persistent state between requests; globalThis survives within
// the same isolate instance for a short time — treat as a soft cache only.
const jsTokenCache = { token: '', ts: 0 };           // 2-hour soft TTL
const metaCache = new Map();                          // 30-min soft TTL
// ─────────────────────────────────────────────────────────────────────────────

/** Validate that a URL's hostname belongs to an allowed TeraBox host */
function isAllowedHost(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    return ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith('.' + h)
    );
  } catch {
    return false;
  }
}

/** Extract the surl key from various TeraBox share URL formats */
function extractSurl(rawUrl) {
  if (!rawUrl) return null;
  const clean = rawUrl.trim();
  try {
    const u = new URL(clean);
    const s = u.searchParams.get('surl');
    if (s) return s.startsWith('1') ? s.slice(1) : s;
  } catch {}
  const m = clean.match(/(?:surl=|\/s\/(?:1)?)([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  return clean.replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Scrape jsToken from the TeraBox share page */
async function getJsToken(surlKey, cookieHeader) {
  const now = Date.now();
  if (jsTokenCache.token && now - jsTokenCache.ts < 2 * 60 * 60 * 1000) {
    return jsTokenCache.token;
  }
  const pageUrl = `https://www.1024tera.com/sharing/link?surl=${surlKey}`;
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    const match = text.match(/fn%28%22(.*?)%22%29/);
    if (match && match[1]) {
      jsTokenCache.token = match[1];
      jsTokenCache.ts = now;
      return match[1];
    }
  } catch (e) {
    console.warn('[jsToken] fetch warning:', e.message);
  }
  return jsTokenCache.token || '';
}

/** Resolve a TeraBox surl to file metadata including dlink */
async function resolveTeraBox(surlKey, ndus, pwd = '') {
  const cacheKey = `${surlKey}:${pwd}`;
  const cached = metaCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) return cached.data;

  const cookieHeader = ndus ? `ndus=${ndus}` : '';
  const jsToken = await getJsToken(surlKey, cookieHeader);

  const cleanShorturl = surlKey.startsWith('1') && surlKey.length > 15 ? surlKey.slice(1) : surlKey;
  const hosts = ['www.1024tera.com', 'dm.terabox.app'];
  let lastError = null;

  for (const host of hosts) {
    try {
      const shareUrl = new URL(`https://${host}/share/list`);
      shareUrl.searchParams.set('app_id', '250528');
      shareUrl.searchParams.set('web', '1');
      shareUrl.searchParams.set('channel', 'dubox');
      shareUrl.searchParams.set('clienttype', '0');
      if (jsToken) shareUrl.searchParams.set('jsToken', jsToken);
      shareUrl.searchParams.set('shorturl', cleanShorturl);
      shareUrl.searchParams.set('root', '1');
      if (pwd) shareUrl.searchParams.set('pwd', pwd);

      const pageReferer = `https://${host}/sharing/link?surl=${surlKey}`;

      const res = await fetch(shareUrl.toString(), {
        headers: {
          'Host': host,
          'User-Agent': USER_AGENT,
          'Referer': pageReferer,
          'Origin': `https://${host}`,
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest',
          ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        },
        signal: AbortSignal.timeout(9000),
      });

      const data = await res.json();

      if (data && data.errno === 0 && Array.isArray(data.list) && data.list.length > 0) {
        const file = data.list[0];
        const result = {
          file_name: file.server_filename,
          title: file.server_filename,
          size: file.size,
          thumb: file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1 || '',
          dlink: file.dlink || '',
          surl: surlKey,
          hasDirectStream: Boolean(file.dlink),
          name: file.server_filename,
        };

        metaCache.set(cacheKey, { data: result, ts: Date.now() });
        return result;
      }

      let msg = data?.errmsg || `File not found on TeraBox (errno: ${data?.errno})`;
      if (data?.errno === 105) {
        msg = 'This TeraBox link has expired or has been deleted by the owner (errno: 105).';
      } else if (data?.errno === -9) {
        msg = 'Password required or incorrect password.';
      } else if (data?.errmsg === 'need verify' || data?.errmsg === 'dragdrop' || data?.errno === 460030) {
        msg = 'TeraBox verification required. Your ndus cookie has expired or requires captcha login on terabox.com.';
      }
      lastError = new Error(msg);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to resolve TeraBox link.');

  const file = data.list[0];
  const result = {
    file_name: file.server_filename,
    title: file.server_filename,
    size: file.size,
    thumb: file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1 || '',
    dlink: file.dlink || '',
    surl: surlKey,
    hasDirectStream: Boolean(file.dlink),
    name: file.server_filename,
  };

  metaCache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

/** Range-aware streaming proxy for a direct TeraBox video link */
async function handleStream(request, targetUrl, ndus) {
  if (!isAllowedHost(targetUrl)) {
    return new Response(
      JSON.stringify({ error: 'Proxy target host is not in the allowed list.' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } }
    );
  }

  const cookieHeader = ndus ? `ndus=${ndus}` : '';
  const rangeHeader = request.headers.get('Range');

  const proxyHeaders = {
    'User-Agent': USER_AGENT,
    'Referer': 'https://dm.terabox.app/',
    'Accept': '*/*',
    ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    ...(rangeHeader ? { 'Range': rangeHeader } : {}),
  };

  const upstream = await fetch(targetUrl, {
    headers: proxyHeaders,
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });

  // Forward relevant headers
  const responseHeaders = new Headers(corsHeaders(request));
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
    const val = upstream.headers.get(h);
    if (val) responseHeaders.set(h, val);
  }
  if (!responseHeaders.has('content-type')) responseHeaders.set('content-type', 'video/mp4');
  responseHeaders.set('accept-ranges', 'bytes');

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

// ─── Main fetch handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const ndus = url.searchParams.get('ndus') || env?.TERABOX_COOKIE || env?.NDUS || DEFAULT_TERABOX_COOKIE;

    // ── Route: Root / Health ────────────────────────────────────────────────
    if (url.pathname === '/' || url.pathname === '/api/health' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'ToolSathi TeraBox Gateway',
          message: 'Worker is running successfully! Endpoints are active.',
          endpoints: [
            '/api?mode=resolve&surl=XXXX',
            '/api?mode=stream&surl=XXXX',
            '/api/stream?url=ENCODED_URL',
            '/health'
          ]
        }, null, 2),
        { status: 200, headers: { 'Content-Type': 'application/json', ...cors } }
      );
    }

    // ── Route: GET /api/stream?url=ENCODED_DLINK ─────────────────────────────
    if (url.pathname === '/api/stream') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('http')) {
        return new Response(
          JSON.stringify({ error: 'Valid stream URL parameter is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
      try {
        return await handleStream(request, decodeURIComponent(targetUrl), ndus);
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Stream proxy failed: ' + err.message }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
    }

    // ── Route: POST /api/resolve  { url, pwd? } ──────────────────────────────
    if (url.pathname === '/api/resolve' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}
      const { url: rawUrl, pwd = '' } = body;
      if (!rawUrl) {
        return new Response(
          JSON.stringify({ success: false, error: 'TeraBox URL is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
      const rawSurl = extractSurl(rawUrl);
      const surl = rawSurl && rawSurl.startsWith('1') && rawSurl.length > 15 ? rawSurl.slice(1) : rawSurl;
      if (!surl) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid TeraBox share link format' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
      try {
        const result = await resolveTeraBox(surl, ndus, pwd);
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
    }

    // ── Route: GET /api?mode=resolve&surl=XXX  or  GET /api?mode=stream&surl=XXX ──
    if (url.pathname === '/api') {
      const mode = url.searchParams.get('mode') || 'resolve';
      const rawSurl = url.searchParams.get('surl') || extractSurl(url.searchParams.get('url') || '');
      const surl = rawSurl
        ? rawSurl.startsWith('1') && rawSurl.length > 15
          ? rawSurl.slice(1)
          : rawSurl
        : null;

      if (!surl) {
        return new Response(
          JSON.stringify({ error: 'Parameter `surl` or `url` is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }

      try {
        const file = await resolveTeraBox(surl, ndus);

        if (mode === 'resolve') {
          return new Response(
            JSON.stringify({
              file_name: file.file_name,
              title: file.title,
              name: file.name,
              size: file.size,
              thumb: file.thumb,
              dlink: file.dlink,
              surl,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...cors } }
          );
        }

        if (mode === 'stream') {
          if (file.dlink) {
            // Stream through proxy instead of redirecting (avoids CORS on redirect)
            return await handleStream(request, file.dlink, ndus);
          } else {
            return new Response(
              JSON.stringify({ error: 'Direct link not available. Set TERABOX_COOKIE as a Wrangler secret.' }),
              { status: 403, headers: { 'Content-Type': 'application/json', ...cors } }
            );
          }
        }

        return new Response(
          JSON.stringify({ error: `Unknown mode: ${mode}` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Gateway error: ' + err.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
        );
      }
    }

    // ── 404 for all other routes ─────────────────────────────────────────────
    return new Response(
      JSON.stringify({ error: 'Not found', routes: ['/api?mode=resolve&surl=...', '/api?mode=stream&surl=...', '/api/stream?url=...', '/api/resolve (POST)', '/health'] }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...cors } }
    );
  },
};

