import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  AlertTriangle, Check, RotateCcw, Clipboard, Film, Sparkles,
  CheckCircle2, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import Hls from 'hls.js';
import './tools.css';
import './VideoPlayer.css';

interface FileMetadata {
  name?: string;
  size?: number | string;
  format?: string;
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
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
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
        setErrorMessage('Failed to load video stream. Please check your link.');
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

    // Direct video stream passthrough
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

    let lastError = 'Unable to extract stream link. Please verify the URL.';

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
      {/* Video Player Display — Only shown after a video link is submitted/fetched */}
      {hasStream && (
        <div className="player-wrapper" style={{ marginBottom: '1.25rem' }}>
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

            {/* Buffering Pill Badge */}
            {isBuffering && isPlaying && !isLoading && (
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
                padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', gap: '8px', zIndex: 9,
                color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8' }} />
                <span>Buffering stream...</span>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(7, 7, 10, 0.85)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10, backdropFilter: 'blur(6px)'
              }}>
                <p style={{ color: '#f8fafc', fontSize: '0.98rem', fontWeight: 600, marginTop: '8px' }}>
                  Loading video...
                </p>
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
                  {/* Desktop Speed Buttons */}
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

                  {/* Mobile Speed Dropdown */}
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

      {/* Input & Action Controls Panel */}
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
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isLoading ? (
                <>
                  <span className="spin-animation" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Play Video</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Metadata Card (if available) */}
        {metadata && (
          <div className="vp-meta-card">
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Film size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {metadata.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean User Guide Section (Same design as TeraBox player) */}
      <div className="vp-guide">
        <div className="vp-guide-header">
          <div className="vp-guide-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              How to Play Diskwala Videos
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              Instant high-speed playback in 3 easy steps
            </p>
          </div>
        </div>

        <div className="vp-guide-steps">
          <div className="vp-step-card">
            <div className="vp-step-badge">1</div>
            <strong style={{ fontSize: '0.88rem', color: '#f1f5f9' }}>Copy Link</strong>
            <p style={{ fontSize: '0.78rem', color: '#8b92a9', margin: 0, lineHeight: 1.4 }}>
              Copy any shared Diskwala link or video URL to your clipboard.
            </p>
          </div>

          <div className="vp-step-card">
            <div className="vp-step-badge">2</div>
            <strong style={{ fontSize: '0.88rem', color: '#f1f5f9' }}>Paste Link</strong>
            <p style={{ fontSize: '0.78rem', color: '#8b92a9', margin: 0, lineHeight: 1.4 }}>
              Click the "Paste" button above to insert your link instantly.
            </p>
          </div>

          <div className="vp-step-card">
            <div className="vp-step-badge">3</div>
            <strong style={{ fontSize: '0.88rem', color: '#f1f5f9' }}>Stream Online</strong>
            <p style={{ fontSize: '0.78rem', color: '#8b92a9', margin: 0, lineHeight: 1.4 }}>
              Click "Play Video" and enjoy smooth, buffer-free playback.
            </p>
          </div>
        </div>

        <div className="vp-feature-row">
          <div className="vp-feature-item">
            <CheckCircle2 size={15} color="#10b981" />
            <span>Ad-free experience</span>
          </div>
          <div className="vp-feature-item">
            <Zap size={15} color="#ff2a44" />
            <span>Direct stream player</span>
          </div>
          <div className="vp-feature-item">
            <ShieldCheck size={15} color="#3b82f6" />
            <span>Secure & private</span>
          </div>
        </div>
      </div>
    </div>
  );
}
