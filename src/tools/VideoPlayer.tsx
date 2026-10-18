import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  Settings, Link as LinkIcon, Upload, FastForward, Check, AlertCircle 
} from 'lucide-react';
import Hls from 'hls.js';
import './tools.css';
import './VideoPlayer.css';

const SAMPLE_VIDEOS = [
  { name: 'Big Buck Bunny (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Elephants Dream (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'For Bigger Blazes (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { name: 'Tears of Steel (HLS Stream)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }
];

export default function VideoPlayer() {
  const [videoUrl, setVideoUrl] = useState('');
  const [activeSource, setActiveSource] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | 'fit'>('16:9');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ width: number; height: number; codec?: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Initialize stream / media
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorMsg(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (activeSource.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(activeSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setErrorMsg('Failed to stream HLS source. Please verify stream URL or CORS headers.');
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeSource;
      }
    } else {
      video.src = activeSource;
    }
  }, [activeSource]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        setErrorMsg('Autoplay was prevented or source cannot be loaded: ' + err.message);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoInfo({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerContainerRef.current.requestFullscreen();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setActiveSource(localUrl);
      setErrorMsg(null);
    }
  };

  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setActiveSource(videoUrl.trim());
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tool-container">
      {/* Player Frame */}
      <div className="player-wrapper">
        <div 
          ref={playerContainerRef} 
          className={`video-player-frame aspect-${aspectRatio}`}
        >
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setErrorMsg('Unable to play video. Check format, direct link validity, or CORS headers.')}
            onClick={togglePlay}
            playsInline
          />

          {errorMsg && (
            <div className="player-overlay error-overlay">
              <AlertCircle size={36} color="#ef4444" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Controls Bar */}
          <div className="player-controls">
            <div className="timeline-container">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="timeline-range"
              />
            </div>

            <div className="controls-row">
              <div className="controls-left">
                <button type="button" onClick={togglePlay} className="ctrl-btn" title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button type="button" onClick={toggleMute} className="ctrl-btn" title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />

                <span className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="controls-right">
                {/* Speed presets */}
                <div className="speed-selector">
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

                <button type="button" onClick={toggleFullscreen} className="ctrl-btn" title="Toggle Fullscreen">
                  <Maximize size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Options */}
      <div className="tool-card-panel">
        <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>Load Video Source</h3>
        <form onSubmit={handleLoadUrl} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="url"
              placeholder="Paste direct MP4, WebM, OGG, or HLS (.m3u8) video URL..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className="tool-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Load URL
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> Play Local Video File
            <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>or test with sample videos:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SAMPLE_VIDEOS.map(sample => (
              <button
                key={sample.name}
                type="button"
                onClick={() => setActiveSource(sample.url)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.8rem', border: '1px solid var(--color-border)' }}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stream & Player Diagnostics */}
      {videoInfo && (
        <div className="tool-stats-grid">
          <div className="tool-stat-card">
            <div className="tool-stat-value">{videoInfo.width}×{videoInfo.height}</div>
            <div className="tool-stat-label">Resolution</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{formatTime(duration)}</div>
            <div className="tool-stat-label">Duration</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{playbackSpeed}x</div>
            <div className="tool-stat-label">Playback Rate</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value" style={{ color: isMuted ? '#f87171' : 'var(--color-accent)' }}>
              {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
            </div>
            <div className="tool-stat-label">Audio Level</div>
          </div>
        </div>
      )}
    </div>
  );
}
