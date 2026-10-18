import React, { useState } from 'react';
import { Upload, RotateCw, RotateCcw, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function ImageRotator() {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [rotatedUrl, setRotatedUrl] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setImgSrc(url);
      setRotation(0);
      setRotatedUrl(url);
    }
  };

  const applyRotation = (angleDelta: number) => {
    const nextAngle = (rotation + angleDelta) % 360;
    setRotation(nextAngle);

    if (!imgSrc) return;
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rads = (nextAngle * Math.PI) / 180;
      const is90or270 = Math.abs(nextAngle) % 180 === 90;

      canvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rads);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        canvas.toBlob(blob => {
          if (blob) {
            setRotatedUrl(URL.createObjectURL(blob));
          }
        }, 'image/png');
      }
    };
  };

  const handleDownload = () => {
    if (rotatedUrl && file) {
      saveAs(rotatedUrl, `rotated_${rotation}deg_${file.name.replace(/\.[^/.]+$/, '')}.png`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!imgSrc ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <RotateCw size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Rotate</span>
            <span className="tool-dropzone-hint">Rotate 90° clockwise, 180°, or counter-clockwise</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file?.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Current Rotation: <strong>{rotation}°</strong>
                </span>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
              <button type="button" onClick={() => applyRotation(-90)} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={16} /> Rotate 90° Left
              </button>
              <button type="button" onClick={() => applyRotation(90)} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCw size={16} /> Rotate 90° Right
              </button>
              <button type="button" onClick={() => applyRotation(180)} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
                Rotate 180°
              </button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!rotatedUrl}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Rotated Image
              </button>
            </div>

            {rotatedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <img
                  src={rotatedUrl}
                  alt="Rotated preview"
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
