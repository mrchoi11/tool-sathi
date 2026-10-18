import React, { useState } from 'react';
import { FileText, Copy, Check } from 'lucide-react';
import './tools.css';

const SAMPLE_HTML = `<div class="hero-section">
  <h1>Launch Products Faster</h1>
  <p>Discover high performance utilities built for <strong>engineers</strong> and <em>creators</em>.</p>
  <ul>
    <li>Video player tools</li>
    <li>PDF compression & merging</li>
  </ul>
</div>`;

export default function HtmlToText() {
  const [htmlInput, setHtmlInput] = useState<string>(SAMPLE_HTML);
  const [copied, setCopied] = useState(false);

  const extractPlainText = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const plainText = extractPlainText(htmlInput);

  const handleCopy = () => {
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
          HTML Input
        </label>
        <textarea
          className="tool-textarea"
          value={htmlInput}
          onChange={e => setHtmlInput(e.target.value)}
          placeholder="Paste raw HTML here..."
          style={{ height: '180px', marginBottom: 'var(--space-xl)' }}
        />

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Extracted Plain Text</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Clean Text'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={plainText}
          style={{ height: '200px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
