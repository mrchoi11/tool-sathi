/**
 * ProToolBox Unified Media Downloader Service
 * Connects frontend tools to the swappable backend gateway (PHP / Cloudflare Worker / VPS)
 */

export interface DownloadItem {
  type: 'video' | 'audio' | 'image';
  quality: string;
  format: string;
  size?: string;
  url: string;
  audioUrl?: string;
  hasAudio?: boolean;
  needsMerge?: boolean;
  recommended?: boolean;
  isHighest?: boolean;
}

export interface DownloadResult {
  ok: boolean;
  platform: 'pinterest' | 'youtube' | 'instagram' | 'unknown';
  title?: string;
  thumbnail?: string;
  duration?: string;
  isShorts?: boolean;
  isVideoPin?: boolean;
  notice?: string | null;
  items?: DownloadItem[];
  error?: {
    code: string;
    message: string;
  };
}

export interface DownloadOutcome {
  ok: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Get configured Gateway API endpoint
 */
export function getGatewayEndpoint(): string {
  const envUrl = import.meta.env.VITE_DOWNLOADER_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  return '/api/downloader.php';
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function makeError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

/** Read a readable error out of a failed gateway response (JSON or HTML or plain text). */
async function readGatewayError(res: Response): Promise<{ code: string; message: string }> {
  let text = '';
  try { text = await res.text(); } catch { /* ignore */ }
  try {
    const j = JSON.parse(text);
    if (j?.error?.message) {
      return { code: j.error.code || `HTTP_${res.status}`, message: j.error.message };
    }
  } catch { /* not JSON */ }
  const looksLikeHtml = text.trim().startsWith('<');
  return {
    code: `HTTP_${res.status}`,
    message: text && !looksLikeHtml && text.length < 200
      ? text
      : `The server returned status ${res.status}. Please try again or choose another quality.`
  };
}

/** Read a response body with live progress (percentage if Content-Length is known, otherwise MB). */
async function readBlobWithProgress(
  res: Response,
  label: string,
  onProgress?: (status: string) => void,
  fallbackType = ''
): Promise<Blob> {
  const total = parseInt(res.headers.get('content-length') || '0', 10);
  if (!res.body || !(res.body as any).getReader) {
    return await res.blob();
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let lastTick = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      const now = Date.now();
      if (onProgress && now - lastTick > 250) {
        lastTick = now;
        onProgress(
          total > 0
            ? `${label} ${Math.min(99, Math.round((received / total) * 100))}%`
            : `${label} ${(received / (1024 * 1024)).toFixed(1)} MB`
        );
      }
    }
  }
  return new Blob(chunks as unknown as BlobPart[], {
    type: res.headers.get('content-type') || fallbackType
  });
}

function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep the URL alive long enough for the browser to start saving
  setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
}

/** Fetch a media file through the gateway stream proxy and return it as a Blob. */
async function fetchStreamBlob(
  mediaUrl: string,
  filename: string,
  label: string,
  onProgress?: (status: string) => void
): Promise<Blob> {
  const endpoint = getGatewayEndpoint();
  const streamUrl = `${endpoint}?action=stream&url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}`;
  const res = await fetch(streamUrl);
  if (!res.ok) {
    const e = await readGatewayError(res);
    throw makeError(e.code, e.message);
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json') || ct.includes('text/html')) {
    const e = await readGatewayError(res);
    throw makeError(e.code, e.message);
  }
  const blob = await readBlobWithProgress(res, label, onProgress);
  if (blob.size === 0) {
    throw makeError('EMPTY_FILE', 'The server returned an empty file. Please try again.');
  }
  return blob;
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

/**
 * Resolve media metadata & download links from a public platform URL
 */
export async function resolveMediaUrl(urlInput: string): Promise<DownloadResult> {
  const trimmed = urlInput.trim();
  if (!trimmed) {
    return {
      ok: false,
      platform: 'unknown',
      error: { code: 'EMPTY_URL', message: 'Please paste a valid media URL.' }
    };
  }

  const lower = trimmed.toLowerCase();
  const isPinterest = lower.includes('pinterest.com') || lower.includes('pin.it');
  const isYouTube = lower.includes('youtube.com') || lower.includes('youtu.be');
  const isInstagram = lower.includes('instagram.com');

  if (!isPinterest && !isYouTube && !isInstagram) {
    return {
      ok: false,
      platform: 'unknown',
      error: {
        code: 'UNSUPPORTED_PLATFORM',
        message: 'Unsupported link. Please enter a valid URL from Pinterest, YouTube, or Instagram.'
      }
    };
  }

  const platform: DownloadResult['platform'] = isPinterest ? 'pinterest' : isYouTube ? 'youtube' : 'instagram';
  const endpoint = getGatewayEndpoint();
  const controller = new AbortController();
  // Gateway can take up to ~35s when it has to try several resolvers
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${endpoint}?action=resolve&url=${encodeURIComponent(trimmed)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const raw = await res.text();
    let data: DownloadResult;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('[downloader] Non-JSON response', res.status, raw.slice(0, 300));
      throw new Error('Received an invalid response from downloader gateway.');
    }

    if (!res.ok) {
      if (data.error) return data;
      return {
        ok: false,
        platform,
        error: {
          code: `HTTP_${res.status}`,
          message: `Gateway returned status ${res.status}. Please try again.`
        }
      };
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        ok: false,
        platform,
        error: {
          code: 'TIMEOUT',
          message: 'The request took too long to respond. The platform may be slow or the link requires verification.'
        }
      };
    }
    return {
      ok: false,
      platform,
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Could not connect to downloader service. Please check your connection.'
      }
    };
  }
}

// ---------------------------------------------------------------------------
// Client-side (WebAssembly) merge fallback
// ---------------------------------------------------------------------------

// Single-thread FFmpeg (core-st) does not need SharedArrayBuffer or COOP/COEP headers.
let ffmpegInstance: any = null;
async function getFFmpegWasm(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;

  if (!(window as any).FFmpeg) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load in-browser audio-video merger.'));
      document.head.appendChild(script);
    });
  }

  const { createFFmpeg } = (window as any).FFmpeg;
  const corePaths = [
    'https://unpkg.com/@ffmpeg/core-st@0.11.0/dist/ffmpeg-core.js',
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.0/dist/ffmpeg-core.js',
    'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js'
  ];
  let lastErr: any = null;
  for (const corePath of corePaths) {
    try {
      const instance = createFFmpeg({ log: false, corePath, mainName: 'main' });
      await instance.load();
      ffmpegInstance = instance;
      return ffmpegInstance;
    } catch (e) {
      console.warn('[downloader] ffmpeg core failed to load from', corePath, e);
      lastErr = e;
    }
  }
  ffmpegInstance = null;
  throw lastErr || new Error('Could not load the in-browser merger.');
}

async function mergeAndDownloadClientSide(
  videoUrl: string,
  audioUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  const vBlob = await fetchStreamBlob(videoUrl, 'video.mp4', 'Video 1/3', onProgress);
  const vBuffer = await vBlob.arrayBuffer();

  const aBlob = await fetchStreamBlob(audioUrl, 'audio.m4a', 'Audio 2/3', onProgress);
  const aBuffer = await aBlob.arrayBuffer();

  onProgress?.('Merging 3/3...');
  const ffmpeg = await getFFmpegWasm();
  const tag = Date.now();
  const inV = `v_${tag}.mp4`;
  const inA = `a_${tag}.m4a`;
  const outF = `out_${tag}.mp4`;

  ffmpeg.FS('writeFile', inV, new Uint8Array(vBuffer));
  ffmpeg.FS('writeFile', inA, new Uint8Array(aBuffer));

  try {
    try {
      await ffmpeg.run('-i', inV, '-i', inA, '-c', 'copy', '-movflags', '+faststart', outF);
    } catch (copyErr) {
      console.warn('Direct stream copy failed, falling back to AAC transcode:', copyErr);
      await ffmpeg.run('-i', inV, '-i', inA, '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart', outF);
    }

    const outData = ffmpeg.FS('readFile', outF);
    const mergedBlob = new Blob([outData.buffer], { type: 'video/mp4' });
    onProgress?.('Saving...');
    saveBlob(mergedBlob, suggestedFilename);
  } finally {
    try { ffmpeg.FS('unlink', inV); } catch { /* ignore */ }
    try { ffmpeg.FS('unlink', inA); } catch { /* ignore */ }
    try { ffmpeg.FS('unlink', outF); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

async function downloadMerged(
  mediaUrl: string,
  audioUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  const endpoint = getGatewayEndpoint();

  // 1) Try server-side ffmpeg merge first
  onProgress?.('Preparing and merging video...');
  const mergeStreamUrl =
    `${endpoint}?action=merge_stream&video_url=${encodeURIComponent(mediaUrl)}` +
    `&audio_url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(suggestedFilename)}`;

  try {
    const res = await fetch(mergeStreamUrl);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (res.ok && (contentType.includes('video/') || contentType.includes('application/octet-stream'))) {
      const blob = await readBlobWithProgress(res, 'Merging', onProgress, 'video/mp4');
      if (blob.size > 0) {
        saveBlob(blob, suggestedFilename);
        onProgress?.('Download complete!');
        return;
      }
    }
    // 501 means "no ffmpeg on server", which is expected on shared hosting
    if (res.status !== 501) {
      console.warn('[downloader] merge_stream failed with status', res.status);
    }
  } catch (e) {
    console.warn('[downloader] merge_stream request failed', e);
  }

  // 2) Fallback: in-browser WebAssembly merge
  try {
    await mergeAndDownloadClientSide(mediaUrl, audioUrl, suggestedFilename, onProgress);
    onProgress?.('Download complete!');
  } catch (mergeErr: any) {
    console.error('[downloader] client-side merge failed:', mergeErr?.message || mergeErr, mergeErr);
    // IMPORTANT: never fall back to the video-only URL, that would save a file with NO sound.
    throw makeError(
      'MERGE_FAILED',
      'Could not merge video and sound for this quality. Please try a lower quality. (Reason: ' +
        (mergeErr?.message || 'unknown') + ')'
    );
  }
}

async function downloadDirect(
  mediaUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Preparing download...');
  const blob = await fetchStreamBlob(mediaUrl, suggestedFilename, 'Downloading', onProgress);
  onProgress?.('Saving...');
  saveBlob(blob, suggestedFilename);
  onProgress?.('Download complete!');
}

/**
 * Download a media file. Returns { ok } and never throws, so the UI can show a real error message.
 * Pass audioUrl only for video-only items that need merging with a separate audio track.
 */
export async function downloadMediaFile(
  mediaUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void,
  audioUrl?: string
): Promise<DownloadOutcome> {
  try {
    if (audioUrl && audioUrl.trim().length > 0) {
      await downloadMerged(mediaUrl, audioUrl, suggestedFilename, onProgress);
    } else {
      await downloadDirect(mediaUrl, suggestedFilename, onProgress);
    }
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: err?.code || 'DOWNLOAD_FAILED',
        message: err?.message || 'Download failed. Please try again or choose another quality.'
      }
    };
  }
}
