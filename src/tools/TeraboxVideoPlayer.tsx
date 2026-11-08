import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings,
  SkipBack, SkipForward, AlertTriangle, Check, Copy, RotateCcw,
  Clipboard, Film, CheckCircle2, ShieldCheck, Zap, HelpCircle, Loader2
} from 'lucide-react';
import Hls from 'hls.js';
import './tools.css';
import './VideoPlayer.css';

interface GatewayResolveData {
  name?: string;
  size?: number | string;
  thumb?: string;
  dlink?: string;
  fid?: string;
  uk?: string;
  shareid?: string;
}

export default function TeraboxVideoPlayer() {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [gatewayUrl, setGatewayUrl] = useState<string>(() => {
    const envUrl = import.meta.env.VITE_GATEWAY_URL;
    if (!envUrl || envUrl.includes('workers.dev') || envUrl.includes('railway.app')) {
      return '';
    }
    return envUrl;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<GatewayResolveData | null>(null);
  const [currentSurl, setCurrentSurl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [pastedFeedback, setPastedFeedback] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Load saved gateway URL on mount
  useEffect(() => {
    const saved = localStorage.getItem('protoolbox_gateway_url') || localStorage.getItem('toolsathi_gateway_url');
    if (saved && (saved.includes('workers.dev') || saved.includes('railway.app') || saved.includes('propdigital360.in'))) {
      localStorage.removeItem('protoolbox_gateway_url');
      localStorage.removeItem('toolsathi_gateway_url');
      setGatewayUrl('');
    } else if (saved) {
      setGatewayUrl(saved);
    }
  }, []);

  // Helper: Extract surl from any TeraBox URL variant
  const extractSurl = (rawUrl: string): string => {
    const clean = rawUrl.trim();
    const sMatch = clean.match(/\/s\/(?:1)?([a-zA-Z0-9_-]+)/);
    const surlMatch = clean.match(/surl=([a-zA-Z0-9_-]+)/);
    if (sMatch && sMatch[1]) return sMatch[1];
    if (surlMatch && surlMatch[1]) return surlMatch[1];
    return clean.replace(/[^a-zA-Z0-9_-]/g, '');
  };

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

  // Clipboard Paste Handler — just paste, user taps Play manually
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
      console.warn('Clipboard read permission denied or unavailable:', err);
    }
  };
  const attachAndPlayStream = useCallback((streamUrl: string, forceHls = false) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const isExplicitHls = forceHls || streamUrl.includes('.m3u8');

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
        // If redirect mode (302) returned 403 from TeraBox CDN, auto-retry via proxy
        if (!streamUrl.includes('proxy=1') && streamUrl.includes('mode=stream')) {
          const proxyUrl = streamUrl + '&proxy=1';
          setStatusText('Switching to proxy mode...');
          video.removeEventListener('canplay', onCanPlay);
          video.src = proxyUrl;
          video.preload = 'auto';
          video.load();

          const onCanPlayProxy = () => {
            setIsLoading(false);
            setIsBuffering(false);
            video.removeEventListener('canplay', onCanPlayProxy);
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          };
          video.addEventListener('canplay', onCanPlayProxy);

          video.onerror = () => {
            setIsLoading(false);
            setIsBuffering(false);
            setErrorMessage('Failed to load video stream. The link may have expired or gateway is offline.');
          };
          return;
        }
        setIsLoading(false);
        setIsBuffering(false);
        setErrorMessage('Failed to load video stream. The link may have expired or gateway is offline.');
      };
    };

    if (isExplicitHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 20 * 1000 * 1000, // 20 MB
        startLevel: -1,           // auto-select quality for fastest start
        abrEwmaDefaultEstimate: 500000, // assume 500 kbps initially (conservative → starts fast)
        testBandwidth: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('HLS encountered fatal error, gracefully falling back to native player:', data);
          hls.destroy();
          hlsRef.current = null;
          // Graceful fallback: TeraBox stream mode frequently returns an MP4 stream
          playNative();
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isExplicitHls) {
      video.src = streamUrl;
      video.onloadeddata = () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      };
      video.onerror = () => {
        playNative();
      };
    } else {
      // Direct MP4 / Range Stream (Standard TeraBox media proxy mode)
      playNative();
    }
  }, []);

  // Skip forward or backward by seconds (Reference Image 2)
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration || 99999);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  };

  // Fast Core play logic — reveals player and starts streaming
  const startPlayback = useCallback(async (rawUrl: string) => {
    const raw = rawUrl.trim();
    if (!raw) return;

    setErrorMessage(null);
    setIsLoading(true);
    setStatusText('Resolving TeraBox link...');

    // Direct files (.mp4 or direct .m3u8)
    if (raw.endsWith('.mp4') || raw.endsWith('.webm') || raw.includes('.m3u8')) {
      setCurrentSurl('');
      setMetadata({ name: raw.split('/').pop() || 'Direct Video' });
      setPlayerVisible(true);
      attachAndPlayStream(raw);
      return;
    }

    const surl = extractSurl(raw);
    if (!surl) {
      setIsLoading(false);
      setErrorMessage('Invalid TeraBox share link format.');
      return;
    }

    setCurrentSurl(surl);
    const cleanGateway = gatewayUrl.replace(/\/$/, '');

    // Endpoints
    const resolveUrl = `${cleanGateway}/api?mode=resolve&surl=${surl}`;
    const streamEndpoint = `${cleanGateway}/api?mode=stream&surl=${surl}`;

    let streamStarted = false;
    const launchStream = (streamUrl: string) => {
      if (!streamStarted) {
        streamStarted = true;
        setPlayerVisible(true);
        attachAndPlayStream(streamUrl);
      }
    };

    // If resolve takes longer than 2.5s, launch streaming proxy directly so video starts without delay
    const fallbackTimer = setTimeout(() => {
      launchStream(streamEndpoint);
    }, 2500);

    try {
      const res = await fetch(resolveUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      }).catch(() => null);

      if (res && res.ok) {
        const resJson = await res.json().catch(() => null);
        if (resJson) {
          const fileData = resJson.data || resJson.list?.[0] || resJson;
          setMetadata({
            name: fileData.name || fileData.file_name || fileData.server_filename || fileData.title || `TeraBox Video [${surl}]`,
            size: fileData.size || fileData.sizeBytes,
            thumb: fileData.thumb || fileData.thumbs?.url3 || fileData.thumbnail,
            dlink: fileData.dlink,
            fid: fileData.fid,
            uk: fileData.uk,
            shareid: fileData.shareid
          });

          if (fileData.dlink && !streamStarted) {
            clearTimeout(fallbackTimer);
            // Use redirect stream mode — PHP will 302 to TeraBox CDN directly (fastest)
            // If redirect fails (403 from CDN), attachAndPlayStream's onerror auto-retries with ?proxy=1
            const redirectStreamUrl = `${cleanGateway}/api?mode=stream&surl=${surl}`;
            launchStream(redirectStreamUrl);
            return;
          }
        }
      } else if (res && !res.ok) {
        const errJson = await res.json().catch(() => null);
        if (errJson?.error) {
          clearTimeout(fallbackTimer);
          setIsLoading(false);
          setErrorMessage(errJson.error);
          return;
        }
      }
    } catch {}

    clearTimeout(fallbackTimer);
    launchStream(streamEndpoint);
  }, [gatewayUrl, attachAndPlayStream]);

  // Main Handler: Fetch from terabox-gateway and play stream
  const handlePlaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startPlayback(inputUrl);
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

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [playerVisible, setPlayerVisible] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hides quickly after inactivity (1.5s), tap reveals or hides
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1500); // Quick 1.5s idle then hides in 0.1s
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFull);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, []);

  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

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

  return (
    <div className="tool-container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Video Player Display — only shown after link is submitted */}
      <div
        className={`player-wrapper player-reveal ${playerVisible ? 'player-reveal--visible' : ''}`}
        style={{ display: playerVisible ? undefined : 'none' }}
      >
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
              
              {/* Cute Mascot SVG */}
              <div style={{ animation: 'cuteFloat 2.4s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Glowing Aura */}
                  <circle cx="50" cy="50" r="42" fill="url(#cuteGlow)" opacity="0.3" />
                  
                  {/* Body - Cute Popcorn / TV Mascot */}
                  <rect x="22" y="24" width="56" height="52" rx="18" fill="url(#mascotGrad)" stroke="#818cf8" strokeWidth="2.5" />
                  
                  {/* Antenna with sparkling star */}
                  <path d="M50 24V14" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="11" r="4.5" fill="#38bdf8" />
                  
                  {/* Cute Big Sparkling Eyes */}
                  <g style={{ transformOrigin: '50% 46%', animation: 'cuteBlink 3.6s infinite' }}>
                    {/* Left Eye */}
                    <circle cx="38" cy="46" r="6.5" fill="#0f172a" />
                    <circle cx="36" cy="44" r="2.2" fill="#ffffff" />
                    <circle cx="40" cy="48" r="1.1" fill="#ffffff" />
                    {/* Right Eye */}
                    <circle cx="62" cy="46" r="6.5" fill="#0f172a" />
                    <circle cx="60" cy="44" r="2.2" fill="#ffffff" />
                    <circle cx="64" cy="48" r="1.1" fill="#ffffff" />
                  </g>
                  
                  {/* Rosy Cheeks */}
                  <circle cx="31" cy="54" r="3.5" fill="#f472b6" opacity="0.6" />
                  <circle cx="69" cy="54" r="3.5" fill="#f472b6" opacity="0.6" />
                  
                  {/* Happy Smile */}
                  <path d="M44 55C46 58 54 58 56 55" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
                  
                  {/* Cute Headphones */}
                  <rect x="15" y="40" width="7" height="18" rx="3.5" fill="#6366f1" />
                  <rect x="78" y="40" width="7" height="18" rx="3.5" fill="#6366f1" />
                  <path d="M18 40C18 25 82 25 82 40" stroke="#6366f1" strokeWidth="3" fill="none" strokeLinecap="round" />

                  <defs>
                    <linearGradient id="mascotGrad" x1="22" y1="24" x2="78" y2="76" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff" />
                      <stop offset="1" stopColor="#e0e7ff" />
                    </linearGradient>
                    <radialGradient id="cuteGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(42)">
                      <stop stopColor="#818cf8" />
                      <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>

                {/* Animated Pulsing Dots */}
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
                Playback Error
              </h4>
              <p style={{ color: '#94a3b8', maxWidth: '480px', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  if (inputUrl.trim()) {
                    startPlayback(inputUrl);
                  }
                }}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1.25rem' }}
              >
                <RotateCcw size={15} /> Try Again
              </button>
            </div>
          )}

          {/* Big Center Play Button Overlay (Reference Image Match) */}
          {!isLoading && !isPlaying && (
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

          {/* Minimalist White Bottom Controls Bar (Reference Image Match) */}
          <div className="minimal-white-controls">
            {/* Mobile-only Timeline Track (spans top of bar on mobile) */}
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

                {/* Skip Back 10s (|◀) */}
                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  className="white-ctrl-btn"
                  title="Rewind 10s"
                  aria-label="Rewind 10s"
                >
                  <SkipBack size={16} />
                </button>

                {/* Skip Forward 10s (▶|) */}
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
                          onClick={() => {
                            handleSpeedChange(s);
                            setShowSettingsMenu(false);
                          }}
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

      {/* Input & Action Controls Panel */}
      <div className="vp-input-panel">
        <form onSubmit={handlePlaySubmit} className="vp-form">
          {/* Link Input */}
          <div className="vp-input-wrap">
            <input
              type="text"
              className="tool-input"
              placeholder="Paste your link here..."
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Action Buttons */}
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
                  startPlayback(inputUrl);
                } else if (currentSurl) {
                  attachAndPlayStream(`${gatewayUrl.replace(/\/$/, '')}/api?mode=stream&surl=${currentSurl}`);
                }
              }}
              disabled={isLoading || (!inputUrl.trim() && !currentSurl)}
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

        {/* Error Notification when player box is not opened */}
        {errorMessage && !playerVisible && (
          <div style={{
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

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

      {/* Step-by-Step User Guide */}
      <div className="vp-guide">
        <div className="vp-guide-header">
          <div className="vp-guide-icon">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
              How to Play TeraBox Videos
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              Watch any TeraBox video directly — no app, no ads.
            </p>
          </div>
        </div>

        {/* Step Cards */}
        <div className="vp-guide-steps">
          <div className="vp-step-card">
            <div className="vp-step-badge" style={{ background: '#38bdf8' }}>1</div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Copy TeraBox Link</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Open TeraBox and tap <strong>Share → Copy Link</strong>.
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

        {/* Feature Highlights */}
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
            <span><strong>All Domains</strong> — terabox, 1024tera &amp; more</span>
          </div>
        </div>
      </div>
    </div>
  );
}
