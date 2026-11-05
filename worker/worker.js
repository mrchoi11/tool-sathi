/**
 * ToolSathi TeraBox Gateway — Cloudflare Worker
 * Multi-host probing to find the domain that accepts Cloudflare edge IPs
 */

const DEFAULT_TERABOX_COOKIE = 'YqsIMBVpeHuirL2Ygy3MXxvrJzN2zaZ2ZxVZR7Cg';

const HOSTS_TO_TEST = [
  'dm.terabox.app',
  'www.1024tera.com',
  'www.terabox.app',
  'teraboxlink.com',
  'freeterabox.com',
  'tibibox.com',
  'momerybox.com',
  'terabox.fun',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const ndus = url.searchParams.get('ndus') || env?.TERABOX_COOKIE || env?.NDUS || DEFAULT_TERABOX_COOKIE;
    const cookieHeader = ndus ? `ndus=${ndus}` : '';

    // Test endpoint to probe all hosts from Cloudflare
    if (url.pathname === '/test-hosts') {
      const surlWith1 = url.searchParams.get('surl') || '1lxG5qaDEEXuN76kPYO9LPg';
      const surlWithout1 = surlWith1.startsWith('1') ? surlWith1.slice(1) : surlWith1;
      const results = {};

      for (const host of HOSTS_TO_TEST) {
        try {
          const pageUrl = `https://${host}/sharing/link?surl=${surlWith1}`;
          const tokenRes = await fetch(pageUrl, {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Cookie': cookieHeader,
            },
            signal: AbortSignal.timeout(6000),
          });
          const text = await tokenRes.text();
          const match = text.match(/fn%28%22(.*?)%22%29/);
          const jsToken = match ? match[1] : '';

          const shareApi = new URL(`https://${host}/share/list`);
          shareApi.searchParams.set('app_id', '250528');
          if (jsToken) shareApi.searchParams.set('jsToken', jsToken);
          shareApi.searchParams.set('shorturl', surlWithout1);
          shareApi.searchParams.set('root', '1');

          const res = await fetch(shareApi.toString(), {
            headers: {
              'Host': host,
              'User-Agent': USER_AGENT,
              'Referer': pageUrl,
              'Origin': `https://${host}`,
              'Accept': 'application/json, text/plain, */*',
              'X-Requested-With': 'XMLHttpRequest',
              'Cookie': cookieHeader,
            },
            signal: AbortSignal.timeout(6000),
          });
          const json = await res.json();
          results[host] = {
            errno: json.errno,
            errmsg: json.errmsg || 'ok',
            hasList: Boolean(json.list && json.list.length > 0),
            hasDlink: Boolean(json.list?.[0]?.dlink),
            tokenFound: Boolean(jsToken),
          };
        } catch (e) {
          results[host] = { error: e.message };
        }
      }

      return new Response(JSON.stringify(results, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Default health
    return new Response(JSON.stringify({ status: 'online', endpoints: ['/test-hosts'] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  },
};
