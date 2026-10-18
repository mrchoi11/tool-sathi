import React, { useState } from 'react';
import { Upload, ScanSearch, Image as ImageIcon } from 'lucide-react';
import './tools.css';

interface ImageMeta {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  lastModified: string;
}

export default function ImageMetadataViewer() {
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    setImgUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const divisor = gcd(w, h);
      const ratio = divisor > 0 ? `${w / divisor}:${h / divisor}` : 'N/A';
      const mp = ((w * h) / 1000000).toFixed(2);

      setMeta({
        name: f.name,
        size: f.size,
        type: f.type || 'image/unknown',
        width: w,
        height: h,
        aspectRatio: ratio,
        megapixels: mp,
        lastModified: new Date(f.lastModified).toLocaleString(),
      });
    };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <ScanSearch size={24} />
          </div>
          <span className="tool-dropzone-text">Upload Image to Inspect Metadata</span>
          <span className="tool-dropzone-hint">View exact dimensions, aspect ratio, file size, format, and details</span>
        </label>
      </div>

      {meta && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <ImageIcon size={22} color="var(--color-primary)" />
              <strong style={{ fontSize: '1.1rem' }}>{meta.name}</strong>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-raised)', padding: '4px 10px', borderRadius: '4px' }}>
              {meta.type}
            </span>
          </div>

          <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{meta.width} × {meta.height}</div>
              <div className="tool-stat-label">Dimensions</div>
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
              <div className="tool-stat-value">{meta.megapixels} MP</div>
              <div className="tool-stat-label">Resolution</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Detailed Image Attributes</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
              <div>File Name: <strong>{meta.name}</strong></div>
              <div>MIME Type: <strong>{meta.type}</strong></div>
              <div>Last Modified: <strong>{meta.lastModified}</strong></div>
              <div>Pixel Count: <strong>{(meta.width * meta.height).toLocaleString()} px</strong></div>
            </div>
          </div>

          {imgUrl && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={imgUrl}
                alt={meta.name}
                style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
