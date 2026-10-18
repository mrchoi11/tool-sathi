import React, { useState } from 'react';
import { Upload, Binary, Copy, Check } from 'lucide-react';
import './tools.css';

export default function ImageToBase64() {
  const [base64, setBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFileName(f.name);
    setFileSize(f.size);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBase64(reader.result);
      }
    };
    reader.readAsDataURL(f);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <Binary size={24} />
          </div>
          <span className="tool-dropzone-text">Upload Image to Convert to Base64</span>
          <span className="tool-dropzone-hint">Supports PNG, JPG, GIF, WebP, SVG</span>
        </label>
      </div>

      {base64 && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
            <span className="tool-result-title">Data URI Output ({fileName})</span>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={() => copyToClipboard(base64, 'raw')}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied === 'raw' ? <Check size={14} /> : <Copy size={14} />} {copied === 'raw' ? 'Copied' : 'Copy Data URI'}
              </button>
            </div>
          </div>

          <textarea
            readOnly
            className="tool-textarea"
            value={base64}
            style={{ fontSize: '0.8rem', height: '160px', marginBottom: 'var(--space-lg)' }}
          />

          <h4 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-sm)' }}>Code Snippets</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>HTML &lt;img&gt; tag</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`<img src="${base64}" alt="${fileName}" />`, 'html')}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {copied === 'html' ? 'Copied' : 'Copy HTML'}
                </button>
              </div>
              <input
                readOnly
                className="tool-input"
                style={{ fontSize: '0.8rem' }}
                value={`<img src="${base64.substring(0, 80)}..." alt="${fileName}" />`}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CSS background-image</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`background-image: url('${base64}');`, 'css')}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {copied === 'css' ? 'Copied' : 'Copy CSS'}
                </button>
              </div>
              <input
                readOnly
                className="tool-input"
                style={{ fontSize: '0.8rem' }}
                value={`background-image: url('${base64.substring(0, 80)}...');`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
