import React, { useState } from 'react';
import { Upload, FlipHorizontal, FlipVertical, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function ImageFlipper() {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [flippedUrl, setFlippedUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setImgSrc(url);
      setFlipH(false);
      setFlipV(false);
      setFlippedUrl(url);
    }
  };

  const renderFlipped = (newH: boolean, newV: boolean) => {
    if (!imgSrc) return;
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(newH ? canvas.width : 0, newV ? canvas.height : 0);
        ctx.scale(newH ? -1 : 1, newV ? -1 : 1);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob) {
            setFlippedUrl(URL.createObjectURL(blob));
          }
        }, 'image/png');
      }
    };
  };

  const toggleHorizontal = () => {
    const nextH = !flipH;
    setFlipH(nextH);
    renderFlipped(nextH, flipV);
  };

  const toggleVertical = () => {
    const nextV = !flipV;
    setFlipV(nextV);
    renderFlipped(flipH, nextV);
  };

  const handleDownload = () => {
    if (flippedUrl && file) {
      saveAs(flippedUrl, `flipped_${file.name.replace(/\.[^/.]+$/, '')}.png`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!imgSrc ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <FlipHorizontal size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Flip</span>
            <span className="tool-dropzone-hint">Flip horizontally (mirror) or vertically</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file?.name}</strong>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              <button
                type="button"
                onClick={toggleHorizontal}
                className={`btn ${flipH ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FlipHorizontal size={16} /> Flip Horizontal {flipH ? '(Active)' : ''}
              </button>
              <button
                type="button"
                onClick={toggleVertical}
                className={`btn ${flipV ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FlipVertical size={16} /> Flip Vertical {flipV ? '(Active)' : ''}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!flippedUrl}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Flipped Image
              </button>
            </div>

            {flippedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <img
                  src={flippedUrl}
                  alt="Flipped preview"
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
