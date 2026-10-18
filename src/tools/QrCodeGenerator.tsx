import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Copy, Check, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import './tools.css';

export default function QrCodeGenerator() {
  const [text, setText] = useState<string>('https://toolsathi.com');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [darkColor, setDarkColor] = useState<string>('#000000');
  const [lightColor, setLightColor] = useState<string>('#ffffff');
  const [qrSize, setQrSize] = useState<number>(320);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    if (!text.trim()) {
      setQrDataUrl('');
      return;
    }
    try {
      const url = await QRCode.toDataURL(text, {
        width: qrSize,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    generateCode();
  }, [text, darkColor, lightColor, qrSize]);

  const handleDownload = () => {
    if (qrDataUrl) {
      saveAs(qrDataUrl, 'qrcode.png');
    }
  };

  const handleCopy = () => {
    if (qrDataUrl) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          URL or Text Content
        </label>
        <input
          type="text"
          className="tool-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="https://yourwebsite.com or text payload..."
          style={{ marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Foreground Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={darkColor}
                onChange={e => setDarkColor(e.target.value)}
                style={{ width: '42px', height: '42px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={darkColor}
                onChange={e => setDarkColor(e.target.value)}
                className="tool-input"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="tool-field">
            <label className="tool-label">Background Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={lightColor}
                onChange={e => setLightColor(e.target.value)}
                style={{ width: '42px', height: '42px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={lightColor}
                onChange={e => setLightColor(e.target.value)}
                className="tool-input"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="tool-field">
            <label className="tool-label">Image Resolution ({qrSize} × {qrSize} px)</label>
            <select className="tool-select" value={qrSize} onChange={e => setQrSize(parseInt(e.target.value))}>
              <option value={200}>200 × 200 px (Compact)</option>
              <option value={320}>320 × 320 px (Standard)</option>
              <option value={600}>600 × 600 px (High-Res Print)</option>
            </select>
          </div>
        </div>

        {qrDataUrl && (
          <div style={{ textAlign: 'center', background: 'var(--color-bg)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'inline-block', padding: '12px', background: lightColor, borderRadius: '12px', boxShadow: 'var(--shadow-md)', marginBottom: 'var(--space-lg)' }}>
              <img src={qrDataUrl} alt="Generated QR code" style={{ display: 'block', maxWidth: '280px', height: 'auto' }} />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download PNG QR Code
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-ghost"
                style={{ border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy Payload'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
