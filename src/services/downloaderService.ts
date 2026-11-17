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
  const timeoutId = setTimeout(() => controller.abort(), 18000);

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

/**
 * Trigger genuine file download via browser blob / attachment stream
 */
export async function downloadMediaFile(
  mediaUrl: string,
  suggestedFilename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Preparing download...');
  const endpoint = getGatewayEndpoint();
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
  } catch (err) {
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
