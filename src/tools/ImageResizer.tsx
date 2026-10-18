import React, { useState } from 'react';
import { Upload, Scaling, Download, Lock, Unlock } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [resizedSize, setResizedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.src = url;

    img.onload = () => {
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      triggerResize(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
    };
  };

  const triggerResize = (imgOrFile: HTMLImageElement | File, w: number, h: number) => {
    setIsProcessing(true);
    const process = (img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (blob) {
            setResizedUrl(URL.createObjectURL(blob));
            setResizedSize(blob.size);
          }
          setIsProcessing(false);
        }, file?.type || 'image/jpeg', 0.92);
      }
    };

    if (imgOrFile instanceof Image) {
      process(imgOrFile);
    } else if (file) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = () => {
        process(img);
        URL.revokeObjectURL(url);
      };
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspect && origWidth > 0) {
      const newH = Math.round((val / origWidth) * origHeight);
      setTargetHeight(newH);
      if (file) triggerResize(file, val, newH);
    } else if (file) {
      triggerResize(file, val, targetHeight);
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspect && origHeight > 0) {
      const newW = Math.round((val / origHeight) * origWidth);
      setTargetWidth(newW);
      if (file) triggerResize(file, newW, val);
    } else if (file) {
      triggerResize(file, targetWidth, val);
    }
  };

  const handleScalePercent = (pct: number) => {
    if (origWidth > 0 && origHeight > 0) {
      const newW = Math.round(origWidth * (pct / 100));
      const newH = Math.round(origHeight * (pct / 100));
      setTargetWidth(newW);
      setTargetHeight(newH);
      if (file) triggerResize(file, newW, newH);
    }
  };

  const handleDownload = () => {
    if (resizedUrl && file) {
      saveAs(resizedUrl, `resized_${targetWidth}x${targetHeight}_${file.name}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <Scaling size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Resize</span>
            <span className="tool-dropzone-hint">Change width, height, or scale by percentage</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Original: {origWidth} × {origHeight} px ({formatBytes(file.size)})
                </span>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Percent shortcuts */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Preset Scales:</span>
              {[25, 50, 75, 100, 150, 200].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleScalePercent(p)}
                  className="btn btn-ghost btn-sm"
                  style={{ border: '1px solid var(--color-border)', fontSize: '0.8rem' }}
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Dimension controls */}
            <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)', alignItems: 'flex-end' }}>
              <div className="tool-field">
                <label className="tool-label">Width (px)</label>
                <input
                  type="number"
                  min="1"
                  value={targetWidth}
                  onChange={e => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="tool-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`btn btn-sm ${lockAspect ? 'btn-primary' : 'btn-ghost'}`}
                  title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
                  <span style={{ fontSize: '0.75rem' }}>{lockAspect ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>

              <div className="tool-field">
                <label className="tool-label">Height (px)</label>
                <input
                  type="number"
                  min="1"
                  value={targetHeight}
                  onChange={e => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="tool-input"
                />
              </div>
            </div>

            {resizedSize !== null && (
              <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{targetWidth} × {targetHeight}</div>
                  <div className="tool-stat-label">Output Dimensions</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: 'var(--color-primary)' }}>{formatBytes(resizedSize)}</div>
                  <div className="tool-stat-label">Resized Size</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!resizedUrl}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Resized Image
              </button>
            </div>

            {resizedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <img
                  src={resizedUrl}
                  alt="Resized output"
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
