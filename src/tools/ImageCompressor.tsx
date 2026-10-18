import React, { useState, useRef } from 'react';
import { Upload, ImageDown, Download, Check, RefreshCw } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    compressImage(file, quality, outputFormat);
  };

  const compressImage = (file: File, q: number, format: 'image/jpeg' | 'image/webp') => {
    setIsProcessing(true);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compUrl = URL.createObjectURL(blob);
              setCompressedUrl(compUrl);
              setCompressedSize(blob.size);
            }
            setIsProcessing(false);
          },
          format,
          q
        );
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      setIsProcessing(false);
      alert('Error loading image.');
    };
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (originalFile) {
      compressImage(originalFile, newQ, outputFormat);
    }
  };

  const handleFormatChange = (newF: 'image/jpeg' | 'image/webp') => {
    setOutputFormat(newF);
    if (originalFile) {
      compressImage(originalFile, quality, newF);
    }
  };

  const handleDownload = () => {
    if (compressedUrl && originalFile) {
      const ext = outputFormat === 'image/jpeg' ? 'jpg' : 'webp';
      const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
      saveAs(compressedUrl, `${baseName}-compressed.${ext}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const savingsPct = originalFile && compressedSize
    ? Math.max(0, Math.round(((originalFile.size - compressedSize) / originalFile.size) * 100))
    : 0;

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!originalFile ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <ImageDown size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Compress</span>
            <span className="tool-dropzone-hint">Supports JPG, PNG, and WebP (Client-side fast compression)</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{originalFile.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Original Size: {formatBytes(originalFile.size)}
                </span>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Controls */}
            <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="tool-field">
                <label className="tool-label">
                  Compression Quality: <strong>{Math.round(quality * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={quality}
                  onChange={e => handleQualityChange(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>

              <div className="tool-field">
                <label className="tool-label">Export Format</label>
                <select className="tool-select" value={outputFormat} onChange={e => handleFormatChange(e.target.value as any)}>
                  <option value="image/jpeg">JPG / JPEG (Universal compatibility)</option>
                  <option value="image/webp">WebP (Modern web format, higher compression)</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            {compressedSize !== null && (
              <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{formatBytes(originalFile.size)}</div>
                  <div className="tool-stat-label">Original</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: '#10b981' }}>{formatBytes(compressedSize)}</div>
                  <div className="tool-stat-label">Compressed</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: 'var(--color-accent)' }}>{savingsPct}%</div>
                  <div className="tool-stat-label">Reduction</div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!compressedUrl}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Compressed Image
              </button>
            </div>

            {/* Preview Box */}
            {compressedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-sm)' }}>
                  Compressed Preview
                </span>
                <img
                  src={compressedUrl}
                  alt="Compressed preview"
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
