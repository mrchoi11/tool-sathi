import React, { useState } from 'react';
import { Upload, ScanLine, Copy, Check, ExternalLink } from 'lucide-react';
import './tools.css';

export default function QrCodeReader() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setDetectedText(null);
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = async () => {
      // Check native browser BarcodeDetector API support
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0) {
            setDetectedText(barcodes[0].rawValue);
            return;
          } else {
            setErrorMsg('No QR code detected in the uploaded image. Please ensure the code is clear and unblurred.');
          }
        } catch (err) {
          setErrorMsg('QR Scanner error: ' + (err as Error).message);
        }
      } else {
        // Fallback info for browsers without BarcodeDetector
        setErrorMsg('Native BarcodeDetector API is not enabled in this browser. Please enable chrome://flags#enable-experimental-web-platform-features or use Chrome / Edge.');
      }
    };
  };

  const handleCopy = () => {
    if (detectedText) {
      navigator.clipboard.writeText(detectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <ScanLine size={24} />
          </div>
          <span className="tool-dropzone-text">Upload Image with QR Code</span>
          <span className="tool-dropzone-hint">Scans barcodes & QR codes directly on your device</span>
        </label>
      </div>

      {imgUrl && (
        <div className="tool-card-panel" style={{ textAlign: 'center' }}>
          <img
            src={imgUrl}
            alt="Scanned QR"
            style={{ maxWidth: '280px', maxHeight: '280px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-lg)' }}
          />

          {detectedText && (
            <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Decoded Payload</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <p style={{ wordBreak: 'break-all', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                {detectedText}
              </p>

              {detectedText.startsWith('http') && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <a
                    href={detectedText}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Open Link <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="tool-alert tool-alert-warning" style={{ textAlign: 'left' }}>
              {errorMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
