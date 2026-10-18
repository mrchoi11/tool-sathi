import React, { useState, useRef, useEffect } from 'react';
import { Upload, Crop, Download, Check } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 }); // in percentages
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setImgSrc(URL.createObjectURL(f));
      setCroppedUrl(null);
    }
  };

  const setPresetRatio = (wRatio: number, hRatio: number) => {
    const targetAspect = wRatio / hRatio;
    setCropBox(prev => {
      let newW = prev.width;
      let newH = Math.round(newW / targetAspect);
      if (newH > 90) {
        newH = 80;
        newW = Math.round(newH * targetAspect);
      }
      return { ...prev, width: Math.min(newW, 90), height: Math.min(newH, 90) };
    });
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    const cropX = Math.round((cropBox.x / 100) * naturalW);
    const cropY = Math.round((cropBox.y / 100) * naturalH);
    const cropW = Math.round((cropBox.width / 100) * naturalW);
    const cropH = Math.round((cropBox.height / 100) * naturalH);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, cropW);
    canvas.height = Math.max(1, cropH);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      canvas.toBlob(blob => {
        if (blob) {
          setCroppedUrl(URL.createObjectURL(blob));
        }
      }, 'image/png');
    }
  };

  const handleDownload = () => {
    if (croppedUrl && file) {
      saveAs(croppedUrl, `cropped_${file.name.replace(/\.[^/.]+$/, '')}.png`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!imgSrc ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <Crop size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Crop</span>
            <span className="tool-dropzone-hint">Crop to 1:1, 16:9, 4:3, or custom dimensions</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <span className="tool-result-title">Crop Image</span>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
              <button type="button" onClick={() => setPresetRatio(1, 1)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)' }}>
                1:1 Square
              </button>
              <button type="button" onClick={() => setPresetRatio(16, 9)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)' }}>
                16:9 Widescreen
              </button>
              <button type="button" onClick={() => setPresetRatio(4, 3)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)' }}>
                4:3 Standard
              </button>
              <button type="button" onClick={() => setPresetRatio(9, 16)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)' }}>
                9:16 Vertical
              </button>
            </div>

            {/* Image Frame with Overlay */}
            <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto var(--space-lg)', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Source to crop"
                style={{ width: '100%', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: `${cropBox.y}%`,
                  left: `${cropBox.x}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                  border: '2px dashed var(--color-primary)',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Range adjustments */}
            <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
              <div className="tool-field">
                <label className="tool-label">Horizontal Position ({cropBox.x}%)</label>
                <input
                  type="range"
                  min="0"
                  max={100 - cropBox.width}
                  value={cropBox.x}
                  onChange={e => setCropBox(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
              </div>
              <div className="tool-field">
                <label className="tool-label">Vertical Position ({cropBox.y}%)</label>
                <input
                  type="range"
                  min="0"
                  max={100 - cropBox.height}
                  value={cropBox.y}
                  onChange={e => setCropBox(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
              </div>
              <div className="tool-field">
                <label className="tool-label">Crop Size ({cropBox.width}%)</label>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={cropBox.width}
                  onChange={e => {
                    const w = parseInt(e.target.value);
                    setCropBox(prev => ({
                      ...prev,
                      width: w,
                      x: Math.min(prev.x, 100 - w)
                    }));
                  }}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleCrop}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Crop size={16} /> Apply Crop
              </button>

              {croppedUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-success"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff' }}
                >
                  <Download size={16} /> Download Cropped Image
                </button>
              )}
            </div>

            {croppedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-sm)' }}>Cropped Preview</span>
                <img
                  src={croppedUrl}
                  alt="Cropped output"
                  style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
