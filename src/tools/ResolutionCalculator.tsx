import React, { useState } from 'react';
import { Ruler, Monitor, Smartphone, Video } from 'lucide-react';
import './tools.css';

interface ResProfile {
  label: string;
  name: string;
  width: number;
  height: number;
  category: 'standard' | 'mobile' | 'cinematic';
}

const RESOLUTIONS: ResProfile[] = [
  { label: '8K UHD', name: 'Ultra High Definition', width: 7680, height: 4320, category: 'standard' },
  { label: '4K UHD', name: '2160p (UHD)', width: 3840, height: 2160, category: 'standard' },
  { label: '1440p QHD', name: '2K Quad High Definition', width: 2560, height: 1440, category: 'standard' },
  { label: '1080p FHD', name: 'Full HD (Standard)', width: 1920, height: 1080, category: 'standard' },
  { label: '720p HD', name: 'High Definition', width: 1280, height: 720, category: 'standard' },
  { label: '480p SD', name: 'Standard Definition (DVD)', width: 854, height: 480, category: 'standard' },
  { label: '360p Low', name: 'Mobile / Bandwidth Saver', width: 640, height: 360, category: 'standard' },
  { label: 'TikTok / Shorts', name: 'Vertical Full HD (9:16)', width: 1080, height: 1920, category: 'mobile' },
  { label: 'Instagram Square', name: '1:1 Standard', width: 1080, height: 1080, category: 'mobile' },
  { label: 'Instagram Portrait', name: '4:5 Feed', width: 1080, height: 1350, category: 'mobile' },
];

export default function ResolutionCalculator() {
  const [selectedRes, setSelectedRes] = useState<ResProfile>(RESOLUTIONS[3]);
  const [fps, setFps] = useState<number>(30);
  const [bitrateMbps, setBitrateMbps] = useState<number>(8);

  const totalPixels = selectedRes.width * selectedRes.height;
  const megapixels = (totalPixels / 1000000).toFixed(2);
  const aspect = (selectedRes.width / selectedRes.height).toFixed(2);

  // Approximate uncompressed raw frame size (RGB 24-bit = 3 bytes per pixel)
  const uncompressedFrameMB = ((totalPixels * 3) / (1024 * 1024)).toFixed(2);
  // Estimated compressed video size for 1 minute: (bitrate * 60) / 8 MB
  const oneMinuteSizeMB = ((bitrateMbps * 60) / 8).toFixed(1);
  const oneHourSizeGB = (((bitrateMbps * 3600) / 8) / 1024).toFixed(2);

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>Select Common Standard Resolution</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          {RESOLUTIONS.map(res => (
            <button
              key={res.label}
              type="button"
              onClick={() => setSelectedRes(res)}
              className={`btn btn-ghost ${selectedRes.label === res.label ? 'active' : ''}`}
              style={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                padding: '10px 14px',
                border: selectedRes.label === res.label ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedRes.label === res.label ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
              }}
            >
              <div>
                <strong style={{ display: 'block', color: 'var(--color-text)' }}>{res.label}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{res.width} × {res.height}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{selectedRes.width} × {selectedRes.height}</div>
            <div className="tool-stat-label">Dimensions</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{megapixels} MP</div>
            <div className="tool-stat-label">Total Pixels</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{aspect}:1</div>
            <div className="tool-stat-label">Aspect Ratio</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{uncompressedFrameMB} MB</div>
            <div className="tool-stat-label">Raw Frame Size</div>
          </div>
        </div>

        {/* Video Bitrate & Storage Estimator */}
        <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Bitrate & File Size Estimator</h4>
          
          <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="tool-field">
              <label className="tool-label">Target Bitrate (Mbps): {bitrateMbps} Mbps</label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={bitrateMbps}
                onChange={e => setBitrateMbps(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>
            <div className="tool-field">
              <label className="tool-label">Frame Rate (FPS)</label>
              <select className="tool-select" value={fps} onChange={e => setFps(parseInt(e.target.value))}>
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Standard Web/TV)</option>
                <option value={60}>60 FPS (Smooth Gaming / Sports)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
            <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>1 Minute Recording</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>~{oneMinuteSizeMB} MB</strong>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>1 Hour Recording</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-accent)' }}>~{oneHourSizeGB} GB</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
