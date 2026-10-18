import React, { useState } from 'react';
import { Copy, Check, Filter } from 'lucide-react';
import './tools.css';

const SAMPLE_LIST = `apple
banana
orange
apple
grapes
banana
mango
orange`;

export default function RemoveDuplicateLines() {
  const [inputText, setInputText] = useState<string>(SAMPLE_LIST);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(true);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const cleanDuplicates = () => {
    let lines = inputText.split('\n');
    if (trimWhitespace) {
      lines = lines.map(l => l.trim()).filter(Boolean);
    }

    const seen = new Set<string>();
    const unique: string[] = [];

    lines.forEach(line => {
      const compareKey = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(compareKey)) {
        seen.add(compareKey);
        unique.push(line);
      }
    });

    return {
      cleanedText: unique.join('\n'),
      originalCount: lines.length,
      uniqueCount: unique.length,
      removedCount: lines.length - unique.length,
    };
  };

  const { cleanedText, originalCount, uniqueCount, removedCount } = cleanDuplicates();

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          Input Lines List
        </label>
        <textarea
          className="tool-textarea"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste list of items/lines here..."
          style={{ height: '180px', marginBottom: 'var(--space-lg)' }}
        />

        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={e => setCaseSensitive(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Case Sensitive
          </label>

          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={e => setTrimWhitespace(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Trim Empty Lines & Whitespace
          </label>
        </div>

        <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-stat-card">
            <div className="tool-stat-value">{originalCount}</div>
            <div className="tool-stat-label">Total Lines</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value" style={{ color: '#10b981' }}>{uniqueCount}</div>
            <div className="tool-stat-label">Unique Lines</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value" style={{ color: 'var(--color-accent)' }}>{removedCount}</div>
            <div className="tool-stat-label">Duplicates Removed</div>
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="tool-result-title">Deduplicated Result</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Unique Lines'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={cleanedText}
          style={{ height: '180px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
