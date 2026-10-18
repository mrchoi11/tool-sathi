import React, { useState } from 'react';
import { Upload, ArrowRightLeft, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

type Format = 'image/jpeg' | 'image/png' | 'image/webp';

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<Format>('image/png');
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    const url = URL.createObjectURL(f);
    setSourceUrl(url);
    convert(f, targetFormat);
  };

  const convert = (f: File, fmt: Format) => {
    setIsProcessing(true);
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (fmt === 'image/jpeg') {
          // White background for transparent PNG when converting to JPG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          if (blob) {
            setConvertedUrl(URL.createObjectURL(blob));
            setConvertedSize(blob.size);
          }
          setIsProcessing(false);
        }, fmt, 0.92);
      }
      URL.revokeObjectURL(url);
    };
  };

  const handleFormatChange = (fmt: Format) => {
    setTargetFormat(fmt);
    if (file) {
      convert(file, fmt);
    }
  };

  const handleDownload = () => {
    if (convertedUrl && file) {
      const extMap: Record<Format, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      saveAs(convertedUrl, `${baseName}-converted.${extMap[targetFormat]}`);
    }
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
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <ArrowRightLeft size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Convert</span>
            <span className="tool-dropzone-hint">Convert instantly between JPG, PNG, and WebP formats</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Current: {file.type || 'image'} ({formatBytes(file.size)})
                </span>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="tool-field">
                <label className="tool-label">Convert Target Format</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {[
                    { label: 'PNG', fmt: 'image/png' },
                    { label: 'JPG', fmt: 'image/jpeg' },
                    { label: 'WebP', fmt: 'image/webp' },
                  ].map(item => (
                    <button
                      key={item.fmt}
                      type="button"
                      onClick={() => handleFormatChange(item.fmt as Format)}
                      className={`btn ${targetFormat === item.fmt ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ border: '1px solid var(--color-border)', flex: 1 }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {convertedSize !== null && (
              <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{formatBytes(file.size)}</div>
                  <div className="tool-stat-label">Input Size</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: 'var(--color-primary)' }}>{formatBytes(convertedSize)}</div>
                  <div className="tool-stat-label">Output Size</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!convertedUrl}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Converted Image
              </button>
            </div>

            {convertedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <img
                  src={convertedUrl}
                  alt="Converted output"
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
