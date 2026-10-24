import React, { useState, useRef, useEffect } from 'react';
import { Play, AlertCircle, RefreshCw, Film, ExternalLink, Download, Check, ShieldCheck, Zap, Settings } from 'lucide-react';
import Hls from 'hls.js';
import './VideoPlayer.css';

interface StreamResponse {
  success: boolean;
  videoUrl?: string;
  streamUrl?: string;
  proxyStreamUrl?: string;
  title?: string;
  format?: 'mp4' | 'hls' | 'webm' | string;
  size?: number;
  error?: string;
}

export default function DiskwalaVideoPlayer() {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [backendUrl, setBackendUrl] = useState<string>(
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_GATEWAY_URL ||
    'https://tool-sathi-tool-sathi.up.railway.app'
  );
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('Diskwala Stream');
  const [streamFormat, setStreamFormat] = useState<string>('mp4');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState<boolean>(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Sample Diskwala links to test immediately
  const sampleLinks = [
    { label: 'Sample 1', url: 'https://www.diskwala.com/app/6acf185b2a52418b2433aeb6' },
    { label: 'Direct HLS Stream', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { label: 'Direct MP4 Stream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
  ];

  // Clean up HLS instance on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Play a given direct video or HLS stream in the HTML5 video player
  const attachStreamToPlayer = (streamLink: string) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = streamLink.includes('.m3u8') || streamFormat === 'hls';

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamLink);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn('Autoplay prevented:', e));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setErrorMessage('Stream playback error. Trying standard fallback...');
          video.src = streamLink;
        }
      });
    } else {
      // Direct MP4 / WebM / native HLS (Safari)
      video.src = streamLink;
      video.load();
      video.play().catch(e => console.warn('Autoplay prevented by browser:', e));
    }
  };

  // Stream source attribution label
  const [streamSource, setStreamSource] = useState<string | null>(null);
  const [hintMessages, setHintMessages] = useState<string[]>([]);

  // Main fetch function — tries /api/diskwala-proxy first (smarter), falls back to /api/get-video-stream
  const handlePlayVideo = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || inputUrl).trim();
    if (!targetUrl) {
      setErrorMessage('Please enter a valid Diskwala video URL!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStreamSource(null);
    setHintMessages([]);

    // If already a direct MP4 or M3U8, play directly without hitting backend
    if (targetUrl.match(/\.(mp4|m3u8|webm)(\?.*)?$/i)) {
      setCurrentStreamUrl(targetUrl);
      setVideoTitle('Direct Video Stream');
      setStreamFormat(targetUrl.includes('.m3u8') ? 'hls' : 'mp4');
      setStreamSource('direct');
      setIsLoading(false);
      setTimeout(() => attachStreamToPlayer(targetUrl), 100);
      return;
    }

    const base = backendUrl.trim().replace(/\/$/, '');

    // Try the new smarter proxy endpoint first
    const endpoints = [
      `${base}/api/diskwala-proxy?url=${encodeURIComponent(targetUrl)}`,
      `${base}/api/get-video-stream?url=${encodeURIComponent(targetUrl)}`,
    ];

    let lastError = '';
    let lastHints: string[] = [];

    for (const apiUrl of endpoints) {
      try {
        const res = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
        const data: any = await res.json().catch(() => ({}));

        if (data?.success && (data.streamUrl || data.videoUrl)) {
          const streamLink = data.streamUrl || data.videoUrl;
          const proxyFull = data.proxyStreamUrl
            ? (data.proxyStreamUrl.startsWith('http') ? data.proxyStreamUrl : `${base}${data.proxyStreamUrl}`)
            : null;

          const activeUrl = useProxy && proxyFull ? proxyFull : streamLink;
          setCurrentStreamUrl(streamLink);
          setProxyUrl(proxyFull);
          setVideoTitle(data.title || data.fileInfo?.name || 'Diskwala Video');
          setStreamFormat(data.format || (streamLink.includes('.m3u8') ? 'hls' : 'mp4'));
          setStreamSource(data.source || 'backend');
          setIsLoading(false);
          setTimeout(() => attachStreamToPlayer(activeUrl), 100);
          return; // ✅ success
        }

        // Collect error/hints for display if all endpoints fail
        lastError = data?.error || `Server responded with status ${res.status}`;
        lastHints = data?.hint || [];
      } catch (err: any) {
        lastError = err.message;
        lastHints = [];
      }
    }

    // All endpoints failed
    setIsLoading(false);
    setErrorMessage(lastError || 'Could not extract stream link.');
    setHintMessages(lastHints);
  };

  const handleToggleProxy = (enabled: boolean) => {
    setUseProxy(enabled);
    if (currentStreamUrl) {
      const activeLink = enabled && proxyUrl ? proxyUrl : currentStreamUrl;
      attachStreamToPlayer(activeLink);
    }
  };

  const handleClear = () => {
    setInputUrl('');
    setCurrentStreamUrl(null);
    setErrorMessage(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  return (
    <div className="vp-container">
      {/* Top Banner / Hero */}
      <div className="vp-banner glass">
        <div className="vp-badge">
          <Film size={14} />
          <span>Diskwala Direct Stream Engine</span>
        </div>
        <h2 className="vp-banner-title">Diskwala Video Player</h2>
        <p className="vp-banner-subtitle">
          Watch Diskwala videos directly in your browser without iframes, popups, or installing apps.
        </p>

        {/* Input Bar Form */}
        <form
          className="vp-url-bar"
          onSubmit={e => {
            e.preventDefault();
            handlePlayVideo();
          }}
        >
          <input
            type="text"
            className="vp-url-input"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            placeholder="Paste Diskwala link (e.g., https://www.diskwala.com/app/6acf185b2a52418b2433aeb6)..."
            disabled={isLoading}
          />
          {inputUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClear}
              style={{ marginRight: '8px' }}
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !inputUrl.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'center' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Play Video</span>
              </>
            )}
          </button>
        </form>

        {/* Quick test buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Try example link:</span>
          {sampleLinks.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputUrl(s.url);
                handlePlayVideo(s.url);
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
            >
              <Zap size={12} style={{ marginRight: '4px', color: 'var(--color-accent)' }} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Backend Server Configuration Toggle */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Railway Backend: <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{backendUrl}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
          >
            <Settings size={12} style={{ marginRight: '4px' }} />
            {showSettings ? 'Hide Settings' : 'Change Backend URL'}
          </button>
        </div>

        {showSettings && (
          <div style={{
            marginTop: '10px',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)'
          }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Railway Backend Endpoint:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                placeholder="https://tool-sathi-tool-sathi.up.railway.app"
                className="vp-url-input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              />
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="btn btn-primary btn-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div style={{
          padding: '16px 20px',
          margin: '20px 0',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
            <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>
                Playback Notice: Diskwala Link Protected
              </strong>
              <div>{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={() => { setErrorMessage(null); setHintMessages([]); }}
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px' }}
            >
              Dismiss
            </button>
          </div>

          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.82rem',
            color: 'var(--color-text-muted)'
          }}>
            <p style={{ margin: '0 0 6px 0' }}>
              💡 <strong>Why this happens:</strong> Diskwala blocks web streaming via a proprietary
              <code> Appicrypt</code> WASM signature system — only their mobile app can pass this check.
            </p>
            {hintMessages.length > 0 ? (
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                {hintMessages.map((h, i) => <li key={i} style={{ marginBottom: '4px' }}>🚀 {h}</li>)}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>
                🚀 <strong>Quick fix:</strong> Paste a direct <code>.mp4</code> or <code>.m3u8</code> link,
                or set <code>DISKWALA_API_KEY</code> / <code>DISKWALA_RESOLVER_URL</code> in Railway <code>.env</code>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main HTML5 Video Player */}
      <div className="vp-player-card glass" style={{ position: 'relative', overflow: 'hidden', marginTop: '20px' }}>
        <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: 'var(--radius-lg)', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              color: '#fff'
            }}>
              <div className="loading-ring" style={{ marginBottom: '14px' }}></div>
              <p style={{ fontWeight: 600 }}>Fetching direct video stream...</p>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Resolving CDN links without iframes</span>
            </div>
          )}

          <video
            ref={videoRef}
            id="diskwala-video-player"
            controls
            autoPlay
            playsInline
            preload="auto"
            style={{ width: '100%', maxHeight: '560px', outline: 'none' }}
          >
            Your browser does not support the HTML5 video element.
          </video>
        </div>

        {/* Stream Details & Options Bar */}
        {currentStreamUrl && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--color-text)' }}>
                {videoTitle}
              </strong>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className="format-tag">{streamFormat.toUpperCase()}</span>
                <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Direct Stream Active
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Proxy toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={e => handleToggleProxy(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>CORS Proxy Fallback</span>
              </label>

              {/* Direct link button */}
              <a
                href={currentStreamUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> Open Stream URL
              </a>

              {/* Download link button */}
              <a
                href={currentStreamUrl}
                download={videoTitle ? `${videoTitle}.mp4` : 'video.mp4'}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginTop: '30px'
      }}>
        <div className="tool-stat-card glass" style={{ textAlign: 'left', padding: '16px 20px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>
            No Iframes or Ads
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Extracts the pure direct video stream and loads it straight into a native HTML5 video player.
          </p>
        </div>

        <div className="tool-stat-card glass" style={{ textAlign: 'left', padding: '16px 20px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981', marginBottom: '6px' }}>
            HLS & MP4 Compatible
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Powered by Hls.js to seamlessly play adaptive streaming manifests (.m3u8) as well as MP4 files.
          </p>
        </div>

        <div className="tool-stat-card glass" style={{ textAlign: 'left', padding: '16px 20px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '6px' }}>
            Bypass App Requirement
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Watch shared Diskwala clips on Desktop or Mobile browser without installing any third-party apps.
          </p>
        </div>
      </div>
    </div>
  );
}
