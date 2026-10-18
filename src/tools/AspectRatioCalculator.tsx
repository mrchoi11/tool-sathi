import React, { useState } from 'react';
import { Maximize2, RefreshCw } from 'lucide-react';
import './tools.css';

const PRESETS = [
  { name: '16:9 Widescreen (YouTube, TV)', w: 16, h: 9, sampleW: 1920, sampleH: 1080 },
  { name: '9:16 Vertical (TikTok, Reels, Shorts)', w: 9, h: 16, sampleW: 1080, sampleH: 1920 },
  { name: '4:3 Standard (Classic TV, iPad)', w: 4, h: 3, sampleW: 1440, sampleH: 1080 },
  { name: '1:1 Square (Instagram Post)', w: 1, h: 1, sampleW: 1080, sampleH: 1080 },
  { name: '21:9 Ultra-wide (Cinema)', w: 21, h: 9, sampleW: 2560, sampleH: 1080 },
  { name: '4:5 Portrait (Instagram Feed)', w: 4, h: 5, sampleW: 1080, sampleH: 1350 },
];

export default function AspectRatioCalculator() {
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [targetWidth, setTargetWidth] = useState<number>(1280);

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height) || 1;
  const ratioX = width / divisor;
  const ratioY = height / divisor;

  // Calculated target height based on ratio
  const calculatedHeight = Math.round((targetWidth / width) * height) || 0;

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>Original Video Dimensions</h3>
        
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Width (px)</label>
            <input
              type="number"
              min="1"
              value={width}
              onChange={e => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
              className="tool-input"
            />
          </div>
          <div className="tool-field">
            <label className="tool-label">Height (px)</label>
            <input
              type="number"
              min="1"
              value={height}
              onChange={e => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
              className="tool-input"
            />
          </div>
        </div>

        <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{ratioX}:{ratioY}</div>
            <div className="tool-stat-label">Simplified Ratio</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{(width / height).toFixed(2)}:1</div>
            <div className="tool-stat-label">Decimal Ratio</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{(width * height / 1000000).toFixed(2)} MP</div>
            <div className="tool-stat-label">Total Megapixels</div>
          </div>
        </div>

        {/* Visual Preview Box */}
        <div style={{ background: 'var(--color-bg)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', textAlign: 'center', marginBottom: 'var(--space-xl)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-md)' }}>Visual Aspect Ratio Frame</span>
          <div
            style={{
              margin: '0 auto',
              width: width >= height ? '220px' : `${Math.round(220 * (width / height))}px`,
              height: height > width ? '220px' : `${Math.round(220 * (height / width))}px`,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
              border: '2px dashed var(--color-primary)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-primary)'
            }}
          >
            {ratioX}:{ratioY}
          </div>
        </div>

        {/* Preset Buttons */}
        <h4 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-sm)' }}>Quick Preset Dimensions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          {PRESETS.map(p => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setWidth(p.sampleW);
                setHeight(p.sampleH);
              }}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', border: '1px solid var(--color-border)', fontSize: '0.825rem', textAlign: 'left', padding: '10px 14px' }}
            >
              <div>
                <strong style={{ display: 'block', color: 'var(--color-text)' }}>{p.w}:{p.h}</strong>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{p.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Scaled Dimension Calculator */}
        <div style={{ background: 'var(--color-surface-raised)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)' }}>Scale to Target Width</h4>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label className="tool-label">New Width (px)</label>
              <input
                type="number"
                value={targetWidth}
                onChange={e => setTargetWidth(parseInt(e.target.value) || 0)}
                className="tool-input"
              />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label className="tool-label">Calculated New Height (px)</label>
              <input
                type="text"
                readOnly
                value={`${calculatedHeight} px`}
                className="tool-input"
                style={{ fontWeight: 700, color: 'var(--color-primary)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
