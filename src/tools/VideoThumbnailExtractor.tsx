import React, { useState, useRef } from 'react';
import { Upload, Camera, Download, Clock } from 'lucide-react';
import './tools.css';

export default function VideoThumbnailExtractor() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSnapshots([]);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setSnapshots(prev => [dataUrl, ...prev]);
    }
  };

  const downloadImage = (dataUrl: string, idx: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `video-thumbnail-frame-${idx + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!videoSrc ? (
          <label className="tool-dropzone">
            <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <Upload size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Video to Extract Snapshots</span>
            <span className="tool-dropzone-hint">Drag & drop or select an MP4, WebM, or MOV file</span>
          </label>
        ) : (
          <div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-md)' }}>
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Current Position: <strong>{currentTime.toFixed(2)}s</strong> / {duration.toFixed(2)}s
              </span>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="button" onClick={handleCapture} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={16} /> Capture High-Res Frame
                </button>
                <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                  Change Video
                  <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {snapshots.length > 0 && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <span className="tool-result-title">Captured Frames ({snapshots.length})</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSnapshots([])}
            >
              Clear All
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            {snapshots.map((thumb, idx) => (
              <div key={idx} className="card" style={{ padding: 'var(--space-xs)', overflow: 'hidden' }}>
                <img src={thumb} alt={`Captured frame ${idx + 1}`} style={{ width: '100%', borderRadius: 'var(--radius-sm)', display: 'block' }} />
                <div style={{ padding: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Frame #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => downloadImage(thumb, idx)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
