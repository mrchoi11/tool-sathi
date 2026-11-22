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
  isHighest?: boolean;
}

export interface DownloadResult {
  ok: boolean;
  platform: 'pinterest' | 'youtube' | 'instagram' | 'unknown';
  title?: string;
  thumbnail?: string;
  duration?: string;
  isVideoPin?: boolean;
  notice?: string | null;
  items?: DownloadItem[];
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

  // Basic client-side platform format validation
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

  const endpoint = getGatewayEndpoint();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${endpoint}?action=resolve&url=${encodeURIComponent(trimmed)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data: DownloadResult = await res.json().catch(() => {
      throw new Error('Received an invalid response from downloader gateway.');
    });

    if (!res.ok) {
      if (data.error) {
        return data;
      }
      return {
        ok: false,
        platform: isPinterest ? 'pinterest' : isYouTube ? 'youtube' : 'instagram',
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
        platform: isPinterest ? 'pinterest' : isYouTube ? 'youtube' : 'instagram',
        error: {
          code: 'TIMEOUT',
          message: 'The request took too long to respond. The platform may be slow or the link requires verification.'
        }
      };
    }
    return {
      ok: false,
      platform: isPinterest ? 'pinterest' : isYouTube ? 'youtube' : 'instagram',
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Could not connect to downloader service. Please check your connection.'
      }
    };
  }
}

// In-browser WebAssembly single-thread FFmpeg loader for lossless client-side remux
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
  ffmpegInstance = createFFmpeg({
    log: false,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
  });
  await ffmpegInstance.load();
  return ffmpegInstance;
}

/**
 * Client-side lossless transmux to combine video stream and audio stream into MP4
 */
async function mergeAndDownloadClientSide(
  videoUrl: string,
  audioUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  const endpoint = getGatewayEndpoint();
  onProgress?.('Fetching video stream (1/3)...');
  const vStream = `${endpoint}?action=stream&url=${encodeURIComponent(videoUrl)}&filename=video.mp4`;
  const vRes = await fetch(vStream);
  if (!vRes.ok) throw new Error('Could not fetch video stream');
  const vBlob = await vRes.blob();
  const vBuffer = await vBlob.arrayBuffer();

  onProgress?.('Fetching voice track (2/3)...');
  const aStream = `${endpoint}?action=stream&url=${encodeURIComponent(audioUrl)}&filename=audio.m4a`;
  const aRes = await fetch(aStream);
  if (!aRes.ok) throw new Error('Could not fetch audio track');
  const aBlob = await aRes.blob();
  const aBuffer = await aBlob.arrayBuffer();

  onProgress?.('Merging video and voice tracks...');
  const ffmpeg = await getFFmpegWasm();
  const tag = Date.now();
  const inV = `v_${tag}.mp4`;
  const inA = `a_${tag}.m4a`;
  const outF = `out_${tag}.mp4`;

  ffmpeg.FS('writeFile', inV, new Uint8Array(vBuffer));
  ffmpeg.FS('writeFile', inA, new Uint8Array(aBuffer));

  await ffmpeg.run('-i', inV, '-i', inA, '-c', 'copy', '-movflags', '+faststart', outF);

  const outData = ffmpeg.FS('readFile', outF);
  const mergedBlob = new Blob([outData.buffer], { type: 'video/mp4' });

  try {
    ffmpeg.FS('unlink', inV);
    ffmpeg.FS('unlink', inA);
    ffmpeg.FS('unlink', outF);
  } catch { /* ignore */ }

  onProgress?.('Saving merged video...');
  const objectUrl = URL.createObjectURL(mergedBlob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = suggestedFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  onProgress?.('Download complete!');
}

/**
 * Trigger genuine file download via browser blob / attachment stream,
 * with automatic server-side or in-browser audio+video merging support.
 */
export async function downloadMediaFile(
  mediaUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void,
  audioUrl?: string
): Promise<void> {
  const endpoint = getGatewayEndpoint();

  // If this item requires audio+video merging
  if (audioUrl && audioUrl.trim().length > 0) {
    onProgress?.('Merging video and voice...');
    const mergeStreamUrl = `${endpoint}?action=merge_stream&video_url=${encodeURIComponent(mediaUrl)}&audio_url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(suggestedFilename)}`;

    try {
      const res = await fetch(mergeStreamUrl);
      const contentType = res.headers.get('content-type') || '';

      // If server successfully merged via system ffmpeg
      if (res.ok && (contentType.includes('video/') || contentType.includes('application/octet-stream'))) {
        onProgress?.('Saving merged video...');
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = suggestedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        onProgress?.('Download complete!');
        return;
      }
    } catch {
      // Continue to client-side merge fallback
    }

    // Client-side WebAssembly merge fallback
    try {
      await mergeAndDownloadClientSide(mediaUrl, audioUrl, suggestedFilename, onProgress);
      return;
    } catch (mergeErr: any) {
      console.warn('Client-side merge failed, attempting direct download:', mergeErr);
    }
  }

  // Direct download (images, progressive videos, or single audio)
  onProgress?.('Preparing download...');
  const streamUrl = `${endpoint}?action=stream&url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(suggestedFilename)}`;

  try {
    // Attempt blob download to ensure seamless file save
    const res = await fetch(streamUrl);
    if (!res.ok) throw new Error('Stream fetch failed');
    onProgress?.('Saving file...');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    onProgress?.('Download complete!');
  } catch {
    // Fallback: direct navigation / anchor download
    const a = document.createElement('a');
    a.href = streamUrl;
    a.download = suggestedFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onProgress?.('Download initiated!');
  }
}
