import React, { useState, useRef } from 'react';
import { Upload, FileVideo, HardDrive, Clock, Maximize2, Shield } from 'lucide-react';
import './tools.css';

interface VideoMeta {
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
}

export default function VideoMetadataViewer() {
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      // Calculate gcd for aspect ratio
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const w = video.videoWidth;
      const h = video.videoHeight;
      const divisor = gcd(w, h);
      const ratioStr = divisor > 0 ? `${w / divisor}:${h / divisor}` : 'N/A';

      setMeta({
        name: file.name,
        size: file.size,
        type: file.type || 'video/unknown',
        duration: video.duration,
        width: w,
        height: h,
        aspectRatio: ratioStr,
      });
      setLoading(false);
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      setLoading(false);
      alert('Could not parse metadata for this video format.');
    };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m}m ${s}s ${ms}ms`;
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <Upload size={24} />
          </div>
          <span className="tool-dropzone-text">Click or drag a video file here</span>
          <span className="tool-dropzone-hint">Supports MP4, WebM, MOV, OGG, MKV (Processed 100% locally)</span>
        </label>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <div className="loading-ring" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--color-text-muted)' }}>Reading video metadata stream...</p>
        </div>
      )}

      {meta && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <FileVideo size={22} color="var(--color-primary)" />
              <strong style={{ fontSize: '1.1rem' }}>{meta.name}</strong>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-raised)', padding: '4px 10px', borderRadius: '4px' }}>
              {meta.type}
            </span>
          </div>

          <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{meta.width} × {meta.height}</div>
              <div className="tool-stat-label">Resolution</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{meta.aspectRatio}</div>
              <div className="tool-stat-label">Aspect Ratio</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{formatBytes(meta.size)}</div>
              <div className="tool-stat-label">File Size</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{formatDuration(meta.duration)}</div>
              <div className="tool-stat-label">Duration</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Detailed Technical Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
              <div>Total Seconds: <strong>{meta.duration.toFixed(3)}s</strong></div>
              <div>Estimated Bitrate: <strong>{meta.duration > 0 ? `${Math.round((meta.size * 8) / meta.duration / 1000)} kbps` : 'N/A'}</strong></div>
              <div>Width: <strong>{meta.width} px</strong></div>
              <div>Height: <strong>{meta.height} px</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
