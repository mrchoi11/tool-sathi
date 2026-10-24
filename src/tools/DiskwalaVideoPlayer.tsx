import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  AlertTriangle, Check, Copy, RotateCcw, Clipboard, Film,
  CheckCircle2, ShieldCheck, Zap, HelpCircle
} from 'lucide-react';
import Hls from 'hls.js';
import './tools.css';
import './VideoPlayer.css';

interface FileMetadata {
  name?: string;
  size?: number | string;
  thumb?: string;
}

export default function DiskwalaVideoPlayer() {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [backendUrl] = useState<string>(
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_GATEWAY_URL ||
    'https://tool-sathi-tool-sathi.up.railway.app'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasStream, setHasStream] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const formatBytes = (bytes?: number | string): string => {
    if (!bytes) return '';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num) || num <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text.trim());
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission denied:', err);
    }
  };

  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

  const attachAndPlayStream = useCallback((streamUrl: string) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setHasStream(true);

    const isHls = streamUrl.includes('.m3u8');

    const playNative = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = streamUrl;
      video.preload = 'auto';
      video.load();

      const onCanPlay = () => {
        setIsLoading(false);
        setIsBuffering(false);
        video.removeEventListener('canplay', onCanPlay);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      };

      video.addEventListener('canplay', onCanPlay);

      video.onerror = () => {
        setIsLoading(false);
        setIsBuffering(false);
        setErrorMessage('Failed to load video stream. The link may have expired or is unavailable.');
      };
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy();
          hlsRef.current = null;
          playNative();
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src = streamUrl;
      video.onloadeddata = () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      };
      video.onerror = () => playNative();
    } else {
      playNative();
    }
  }, []);

  const handlePlaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputUrl.trim();
    if (!raw) return;

    setErrorMessage(null);
    setIsLoading(true);

    // Direct files (.mp4 or direct .m3u8)
    if (raw.match(/\.(mp4|m3u8|webm)(\?.*)?$/i)) {
      setMetadata({ name: raw.split('/').pop()?.split('?')[0] || 'Direct Video' });
      attachAndPlayStream(raw);
      return;
    }

    const cleanBackend = backendUrl.replace(/\/$/, '');
    const endpoints = [
      `${cleanBackend}/api/diskwala-proxy?url=${encodeURIComponent(raw)}`,
      `${cleanBackend}/api/get-video-stream?url=${encodeURIComponent(raw)}`
    ];

    let lastError = 'Unable to play video stream. Please verify the Diskwala link.';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
        const data = await res.json().catch(() => ({}));

        if (data?.success && (data.streamUrl || data.videoUrl)) {
          const stream = data.streamUrl || data.videoUrl;
          setMetadata({
            name: data.title || data.fileInfo?.name || 'Diskwala Video',
            size: data.fileInfo?.size
          });
          attachAndPlayStream(stream);
          return;
        }

        if (data?.error) {
          lastError = data.error;
        }
      } catch (err: any) {
        lastError = err.message || 'Connection error with streaming server.';
      }
    }

    setIsLoading(false);
    setErrorMessage(lastError);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } else {
      const req = container.requestFullscreen ||
        (container as any).webkitRequestFullscreen ||
        (container as any).mozRequestFullScreen ||
        (container as any).msRequestFullscreen;

      if (req) {
        req.call(container).catch(() => {
          if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        });
      } else if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="tool-container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Video Player Display — Only visible after a video link is submitted */}
      {hasStream && (
        <div className="player-wrapper">
          <div
            ref={playerContainerRef}
            className={`video-player-frame aspect-16-9 ${isFullscreen ? 'is-fullscreen' : ''} ${!controlsVisible && isPlaying ? 'controls-hidden' : ''}`}
            onMouseMove={resetControlsTimeout}
            onMouseEnter={resetControlsTimeout}
            onTouchStart={resetControlsTimeout}
            onDoubleClick={toggleFullscreen}
            onMouseLeave={() => { if (isPlaying) setControlsVisible(false); }}
            style={{ position: 'relative', background: '#07070a', overflow: 'hidden' }}
          >
            <video
              ref={videoRef}
              preload="auto"
              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
              onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onCanPlay={() => setIsBuffering(false)}
              onClick={togglePlay}
              playsInline
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Live Buffering Badge */}
            {isBuffering && isPlaying && !isLoading && (
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
                padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', gap: '8px', zIndex: 9,
                color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', animation: 'cuteBounceDots 0.8s infinite' }} />
                <span>Buffering stream...</span>
              </div>
            )}

            {/* Cute Mascot Loading Animation Overlay (Same as TeraBox) */}
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(7, 7, 10, 0.88)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10, backdropFilter: 'blur(6px)'
              }}>
                <style>{`
                  @keyframes cuteFloat {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                  }
                  @keyframes cuteBlink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                  }
                  @keyframes cuteBounceDots {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1.1); opacity: 1; }
                  }
                `}</style>
                
                <div style={{ animation: 'cuteFloat 2.4s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="42" fill="url(#cuteGlowDisk)" opacity="0.3" />
                    <rect x="22" y="24" width="56" height="52" rx="18" fill="url(#mascotGradDisk)" stroke="#818cf8" strokeWidth="2.5" />
                    <path d="M50 24V14" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="50" cy="11" r="4.5" fill="#38bdf8" />
                    <g style={{ transformOrigin: '50% 46%', animation: 'cuteBlink 3.6s infinite' }}>
                      <circle cx="38" cy="46" r="6.5" fill="#0f172a" />
                      <circle cx="36" cy="44" r="2.2" fill="#ffffff" />
                      <circle cx="40" cy="48" r="1.1" fill="#ffffff" />
                      <circle cx="62" cy="46" r="6.5" fill="#0f172a" />
                      <circle cx="60" cy="44" r="2.2" fill="#ffffff" />
                      <circle cx="64" cy="48" r="1.1" fill="#ffffff" />
                    </g>
                    <circle cx="31" cy="54" r="3.5" fill="#f472b6" opacity="0.6" />
                    <circle cx="69" cy="54" r="3.5" fill="#f472b6" opacity="0.6" />
                    <path d="M44 55C46 58 54 58 56 55" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
                    <rect x="15" y="40" width="7" height="18" rx="3.5" fill="#6366f1" />
                    <rect x="78" y="40" width="7" height="18" rx="3.5" fill="#6366f1" />
                    <path d="M18 40C18 25 82 25 82 40" stroke="#6366f1" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="mascotGradDisk" x1="22" y1="24" x2="78" y2="76" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="1" stopColor="#e0e7ff" />
                      </linearGradient>
                      <radialGradient id="cuteGlowDisk" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(42)">
                        <stop stopColor="#818cf8" />
                        <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', alignItems: 'center' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', animation: 'cuteBounceDots 1.2s infinite ease-in-out', animationDelay: '0s' }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', animation: 'cuteBounceDots 1.2s infinite ease-in-out', animationDelay: '0.2s' }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', animation: 'cuteBounceDots 1.2s infinite ease-in-out', animationDelay: '0.4s' }} />
                  </div>

                  <p style={{ color: '#f8fafc', fontSize: '0.98rem', fontWeight: 600, marginTop: '8px', letterSpacing: '0.3px' }}>
                    Loading video...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message Overlay */}
            {errorMessage && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(10, 11, 18, 0.94)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '2rem', textAlign: 'center', zIndex: 12
              }}>
                <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                  Playback Notice
                </h4>
                <p style={{ color: '#94a3b8', maxWidth: '480px', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    if (inputUrl.trim()) {
                      handlePlaySubmit({ preventDefault: () => {} } as React.FormEvent);
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1.25rem' }}
                >
                  <RotateCcw size={15} /> Try Again
                </button>
              </div>
            )}

            {/* Custom Controls */}
            <div className="player-controls">
              <div className="timeline-container">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="timeline-range"
                  aria-label="Seekbar"
                />
              </div>

              <div className="controls-row">
                <div className="controls-left">
                  <button type="button" onClick={togglePlay} className="ctrl-btn" title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <button type="button" onClick={() => {
                    const nextMute = !isMuted;
                    setIsMuted(nextMute);
                    if (videoRef.current) videoRef.current.muted = nextMute;
                  }} className="ctrl-btn" title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <span className="time-display">
                    {formatSeconds(currentTime)} / {formatSeconds(duration)}
                  </span>
                </div>

                <div className="controls-right">
                  {/* Desktop Speed Selector */}
                  <div className="speed-selector-desktop">
                    {[0.5, 1, 1.25, 1.5, 2].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSpeedChange(s)}
                        className={`speed-btn ${playbackSpeed === s ? 'active' : ''}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Mobile Speed Dropdown — keeps Fullscreen button accessible */}
                  <div className="speed-selector-mobile">
                    <select
                      className="speed-select-native"
                      value={playbackSpeed}
                      onChange={e => handleSpeedChange(parseFloat(e.target.value))}
                      aria-label="Playback Speed"
                    >
                      {[0.5, 1, 1.25, 1.5, 2].map(s => (
                        <option key={s} value={s}>{s}x</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="ctrl-btn"
                    title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
                    aria-label={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
                  >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input & Action Controls Panel (Exact TeraBox Player Design) */}
      <div className="vp-input-panel">
        <form onSubmit={handlePlaySubmit} className="vp-form">
          <div className="vp-input-wrap">
            <input
              type="text"
              className="tool-input"
              placeholder="Paste your Diskwala link here..."
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div className="vp-action-row">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--color-border)' }}
              title="Paste link from clipboard"
            >
              {pastedFeedback ? <Check size={16} color="#10b981" /> : <Clipboard size={16} />}
              <span>{pastedFeedback ? 'Pasted!' : 'Paste'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (inputUrl.trim()) {
                  handlePlaySubmit({ preventDefault: () => {} } as React.FormEvent);
                }
              }}
              disabled={isLoading || !inputUrl.trim()}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--color-border)' }}
              title="Reload video stream"
            >
              <RotateCcw size={16} />
              <span>Reload</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="btn btn-primary vp-play-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <Play size={16} />
              <span>{isLoading ? 'Loading...' : 'Play'}</span>
            </button>
          </div>
        </form>

        {/* Metadata Card */}
        {metadata && metadata.name && (
          <div className="vp-meta-card">
            {metadata.thumb ? (
              <img
                src={metadata.thumb}
                alt={metadata.name}
                style={{ width: '96px', height: '58px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
              />
            ) : (
              <div className="vp-meta-thumb">
                <Film size={22} color="#6366f1" />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.2rem', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {metadata.name}
              </h4>
              {metadata.size && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Size: <strong>{formatBytes(metadata.size)}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inputUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.78rem', border: '1px solid var(--color-border)', flexShrink: 0 }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        )}
      </div>

      {/* Step-by-Step User Guide (Matching TeraBox Player Exactly) */}
      <div className="vp-guide">
        <div className="vp-guide-header">
          <div className="vp-guide-icon">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
              How to Play Diskwala Videos
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              Watch any Diskwala video directly — no app, no ads.
            </p>
          </div>
        </div>

        <div className="vp-guide-steps">
          <div className="vp-step-card">
            <div className="vp-step-badge" style={{ background: '#38bdf8' }}>1</div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Copy Diskwala Link</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Open Diskwala and tap <strong>Share → Copy Link</strong>.
            </p>
          </div>

          <div className="vp-step-card">
            <div className="vp-step-badge" style={{ background: '#818cf8' }}>2</div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Paste Your Link</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Tap the <strong>Paste</strong> button to insert the link instantly.
            </p>
          </div>

          <div className="vp-step-card">
            <div className="vp-step-badge" style={{ background: '#34d399' }}>3</div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Watch in Full HD</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Hit <strong>Play</strong> — stream with seek, audio &amp; speed controls.
            </p>
          </div>
        </div>

        <div className="vp-feature-row">
          <div className="vp-feature-item">
            <Zap size={15} color="#38bdf8" />
            <span><strong>Instant Streaming</strong> — No waiting</span>
          </div>
          <div className="vp-feature-item">
            <ShieldCheck size={15} color="#34d399" />
            <span><strong>Ad-Free</strong> — Clean playback</span>
          </div>
          <div className="vp-feature-item">
            <CheckCircle2 size={15} color="#818cf8" />
            <span><strong>Direct Stream</strong> — Native HTML5 video player</span>
          </div>
        </div>
      </div>
    </div>
  );
}
