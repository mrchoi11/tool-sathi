import React, { useState } from 'react';
import { Binary, Download, Image as ImageIcon } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function Base64ToImage() {
  const [base64Input, setBase64Input] = useState<string>('');
  const [parsedUrl, setParsedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDecode = () => {
    let str = base64Input.trim();
    if (!str) return;

    setErrorMsg(null);
    if (!str.startsWith('data:image/')) {
      // Default prepend PNG data url header if naked base64
      str = `data:image/png;base64,${str}`;
    }

    const testImg = new Image();
    testImg.src = str;
    testImg.onload = () => {
      setParsedUrl(str);
    };
    testImg.onerror = () => {
      setErrorMsg('Invalid Base64 image data. Please ensure it is a valid encoded image.');
      setParsedUrl(null);
    };
  };

  const handleDownload = () => {
    if (parsedUrl) {
      saveAs(parsedUrl, 'decoded_image.png');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>Paste Base64 Image String</h3>
        <textarea
          className="tool-textarea"
          placeholder="Paste data:image/png;base64,... or raw base64 string here"
          value={base64Input}
          onChange={e => setBase64Input(e.target.value)}
          style={{ height: '160px', marginBottom: 'var(--space-md)' }}
        />

        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button type="button" onClick={handleDecode} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Binary size={16} /> Decode & Preview Image
          </button>
        </div>

        {errorMsg && (
          <div className="tool-alert tool-alert-danger" style={{ marginTop: 'var(--space-md)' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {parsedUrl && (
        <div className="tool-card-panel" style={{ textAlign: 'center' }}>
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <span className="tool-result-title">Decoded Image Preview</span>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-success btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: '#fff' }}
            >
              <Download size={14} /> Download Image
            </button>
          </div>

          <img
            src={parsedUrl}
            alt="Decoded preview"
            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
          />
        </div>
      )}
    </div>
  );
}
