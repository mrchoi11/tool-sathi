import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, 
  Settings, Link as LinkIcon, Upload, Check, AlertTriangle,
  Clipboard, SkipBack, SkipForward, Loader2, Sparkles, Film, ShieldCheck, Zap
} from 'lucide-react';
import Hls from 'hls.js';
import './tools.css';
import './VideoPlayer.css';

const SAMPLE_VIDEOS = [
  { name: 'Big Buck Bunny (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Tears of Steel (HLS)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { name: 'Elephants Dream (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'For Bigger Blazes (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
];

export default function VideoPlayer() {
  const [inputUrl, setInputUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [activeSource, setActiveSource] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{ width?: number; height?: number; name?: string } | null>({
    name: 'Big Buck Bunny (MP4)'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Reset controls timer
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSettingsMenu(false);
      }, 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load and play video source
  const loadSource = useCallback((url: string, title?: string) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setActiveSource(url);
    setVideoInfo({ name: title || url.split('/').pop()?.split('?')[0] || 'Direct Video' });

    const isHls = url.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setIsLoading(false);
          setErrorMessage('Failed to play HLS stream. Please check link validity or CORS headers.');
        }
      });
      hlsRef.current = hls;
    } else {
      video.src = url;
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
        setErrorMessage('Unable to play video. Check format, direct link validity, or CORS headers.');
      };
    }
  }, []);

  // Auto-load initial source on mount
  useEffect(() => {
    loadSource(activeSource, 'Big Buck Bunny (MP4)');
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setControlsVisible(true);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        resetControlsTimeout();
      }).catch(err => {
        setErrorMessage('Playback was prevented: ' + err.message);
      });
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      resetControlsTimeout();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    resetControlsTimeout();
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
    resetControlsTimeout();
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

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const trimmed = text.trim();
          setInputUrl(trimmed);
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission denied:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setInputUrl(file.name);
      loadSource(localUrl, file.name);
    }
  };

  const handlePlaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    loadSource(inputUrl.trim());
  };

  return (
    <div className="tool-container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Video Player Display */}
      <div className="player-wrapper player-reveal player-reveal--visible">
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
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                setVideoInfo(prev => ({
                  ...prev,
                  width: videoRef.current?.videoWidth,
                  height: videoRef.current?.videoHeight
                }));
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onClick={() => {
              if (isPlaying) {
                if (!controlsVisible) {
                  setControlsVisible(true);
                  resetControlsTimeout();
                } else {
                  togglePlay();
                }
              } else {
                togglePlay();
              }
            }}
            playsInline
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Subtle Live Buffering Pill Badge */}
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

          {/* Cute Character Loading Animation Overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(10, 11, 18, 0.92)',
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
                <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="42" fill="url(#cuteGlowVp)" opacity="0.3" />
                  <rect x="22" y="24" width="56" height="52" rx="18" fill="url(#mascotGradVp)" stroke="#818cf8" strokeWidth="2.5" />
                  <path d="M50 24V14" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="11" r="4.5" fill="#38bdf8" />
                  <g style={{ transformOrigin: '50% 46%', animation: 'cuteBlink 3.6s infinite' }}>
                    <circle cx="38" cy="46" r="6.5" fill="#0f172a" />
                    <circle cx="36" cy="44" r="2.2" fill="#ffffff" />
                    <circle cx="62" cy="46" r="6.5" fill="#0f172a" />
                    <circle cx="60" cy="44" r="2.2" fill="#ffffff" />
                  </g>
                  <ellipse cx="32" cy="55" rx="4" ry="2.5" fill="#f472b6" opacity="0.7" />
                  <ellipse cx="68" cy="55" rx="4" ry="2.5" fill="#f472b6" opacity="0.7" />
                  <path d="M43 56C45 60 55 60 57 56" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <defs>
                    <radialGradient id="cuteGlowVp" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) scale(42)">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="mascotGradVp" x1="22" y1="24" x2="78" y2="76" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff" />
                      <stop offset="1" stopColor="#e0e7ff" />
                    </linearGradient>
                  </defs>
                </svg>

                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <div style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.3px' }}>
                    Loading Video Stream...
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '6px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block', animation: 'cuteBounceDots 1.2s infinite 0s' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block', animation: 'cuteBounceDots 1.2s infinite 0.2s' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f472b6', display: 'inline-block', animation: 'cuteBounceDots 1.2s infinite 0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Notification Overlay */}
          {errorMessage && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(10, 11, 18, 0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 11, padding: '1.5rem', textAlign: 'center', backdropFilter: 'blur(6px)'
            }}>
              <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '10px' }} />
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>Playback Error</div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '380px', margin: '0 0 16px 0', lineHeight: 1.5 }}>{errorMessage}</p>
              <button
                type="button"
                onClick={() => loadSource(activeSource)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} /> Retry Playback
              </button>
            </div>
          )}

          {/* Center Big Play Button Overlay */}
          {!isPlaying && !isLoading && !errorMessage && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="center-play-btn"
              title="Play Video"
              aria-label="Play Video"
            >
              <Play size={32} fill="#ffffff" color="#ffffff" style={{ marginLeft: '4px' }} />
            </div>
          )}

          {/* Sleek Non-Blocking Bottom Controls Bar (Cinematic Gradient) */}
          <div className="minimal-white-controls">
            {/* Mobile-only Timeline Track */}
            <div className="white-timeline-wrap mobile-only-timeline">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="white-timeline-range"
                aria-label="Seekbar"
                style={{
                  '--progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                } as React.CSSProperties}
              />
            </div>

            {/* Controls Row */}
            <div className="white-controls-row">
              <div className="white-ctrl-group-left">
                {/* Play / Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="white-ctrl-btn"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                </button>

                {/* Skip Back 10s */}
                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  className="white-ctrl-btn"
                  title="Rewind 10s"
                  aria-label="Rewind 10s"
                >
                  <SkipBack size={16} />
                </button>

                {/* Skip Forward 10s */}
                <button
                  type="button"
                  onClick={() => skipTime(10)}
                  className="white-ctrl-btn"
                  title="Forward 10s"
                  aria-label="Forward 10s"
                >
                  <SkipForward size={16} />
                </button>

                {/* Time Display */}
                <span className="white-time-display">
                  {formatSeconds(currentTime)} / {formatSeconds(duration)}
                </span>
              </div>

              {/* Desktop-only Centered Seekbar */}
              <div className="white-timeline-wrap desktop-only-timeline">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="white-timeline-range"
                  aria-label="Seekbar"
                  style={{
                    '--progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                  } as React.CSSProperties}
                />
              </div>

              <div className="white-ctrl-group-right">
                {/* Volume Mute/Unmute */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMute = !isMuted;
                    setIsMuted(nextMute);
                    if (videoRef.current) videoRef.current.muted = nextMute;
                  }}
                  className="white-ctrl-btn"
                  title={isMuted ? 'Unmute' : 'Mute'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>

                {/* Settings (Speed Menu) */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowSettingsMenu(prev => !prev)}
                    className="white-ctrl-btn"
                    title="Playback Speed"
                    aria-label="Playback Speed"
                  >
                    <Settings size={16} />
                  </button>

                  {showSettingsMenu && (
                    <div className="speed-popup-menu">
                      <div className="speed-popup-title">Speed</div>
                      {[0.5, 1, 1.25, 1.5, 2].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSpeedChange(s)}
                          className={`speed-popup-item ${playbackSpeed === s ? 'active' : ''}`}
                        >
                          {s}x {playbackSpeed === s && '✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="white-ctrl-btn"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input & Action Controls Panel (Exact TeraBox UI Style) */}
      <div className="vp-input-panel">
        <form onSubmit={handlePlaySubmit} className="vp-form">
          {/* Link Input */}
          <div className="vp-input-wrap">
            <input
              type="text"
              className="tool-input"
              placeholder="Paste direct MP4, WebM, HLS (.m3u8), or video link..."
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Action Buttons Row */}
          <div className="vp-action-row">
            {/* Paste Button */}
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

            {/* Reload Button */}
            <button
              type="button"
              onClick={() => {
                if (inputUrl.trim()) {
                  loadSource(inputUrl.trim());
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

            {/* Play Button */}
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="btn btn-primary vp-play-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>{isLoading ? 'Loading...' : 'Play'}</span>
            </button>
          </div>
        </form>

        {/* Local File & Quick Sample Row */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={15} /> Play Local Video
            <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Sample Streams:</span>
            {SAMPLE_VIDEOS.map(sample => (
              <button
                key={sample.name}
                type="button"
                onClick={() => {
                  setInputUrl(sample.url);
                  loadSource(sample.url, sample.name);
                }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--color-border)' }}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Metadata Card */}
        {videoInfo && videoInfo.name && (
          <div className="vp-meta-card" style={{ marginTop: '1.25rem' }}>
            <div className="vp-meta-info" style={{ flex: 1 }}>
              <div className="vp-meta-title" title={videoInfo.name}>{videoInfo.name}</div>
              <div className="vp-meta-meta" style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                {videoInfo.width && videoInfo.height && (
                  <span>Resolution: {videoInfo.width}×{videoInfo.height}</span>
                )}
                {duration > 0 && <span>Duration: {formatSeconds(duration)}</span>}
                <span>Speed: {playbackSpeed}x</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="vp-feature-row">
        <div className="vp-feature-item">
          <Zap size={18} color="#ef4444" />
          <div>
            <strong>Instant Streaming</strong>
            <p>Direct MP4, WebM, and adaptive HLS (.m3u8) playback with zero lag.</p>
          </div>
        </div>
        <div className="vp-feature-item">
          <Film size={18} color="#3b82f6" />
          <div>
            <strong>High Definition</strong>
            <p>Crystal clear 1080p and 4K playback with hardware-accelerated rendering.</p>
          </div>
        </div>
        <div className="vp-feature-item">
          <ShieldCheck size={18} color="#10b981" />
          <div>
            <strong>100% Private</strong>
            <p>Streams play directly in your browser without logging or ads.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
