import React, { useState } from 'react';
import { Type, Copy, Check, Trash2 } from 'lucide-react';
import './tools.css';

export default function WordCounter() {
  const [text, setText] = useState<string>('ToolSathi delivers an incredible collection of client-side web tools.');
  const [copied, setCopied] = useState(false);

  const cleanWords = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s+/g, '').length;
  const wordCount = cleanWords.length;
  const lineCount = text ? text.split('\n').length : 0;
  const paragraphCount = text ? text.split(/\n+/).filter(p => p.trim().length > 0).length : 0;
  const readingTimeSec = Math.ceil((wordCount / 200) * 60);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>Type or Paste Text</label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="button" onClick={handleCopy} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={() => setText('')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        <textarea
          className="tool-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start typing or paste your content here..."
          style={{ height: '220px', marginBottom: 'var(--space-xl)' }}
        />

        <div className="tool-stats-grid">
          <div className="tool-stat-card">
            <div className="tool-stat-value">{wordCount}</div>
            <div className="tool-stat-label">Words</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{charCount}</div>
            <div className="tool-stat-label">Characters</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{charNoSpaces}</div>
            <div className="tool-stat-label">Chars (No Spaces)</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{paragraphCount}</div>
            <div className="tool-stat-label">Paragraphs</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{lineCount}</div>
            <div className="tool-stat-label">Lines</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{readingTimeSec}s</div>
            <div className="tool-stat-label">Est. Reading Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
