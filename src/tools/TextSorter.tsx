import React, { useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Copy, Check } from 'lucide-react';
import './tools.css';

const SAMPLE_LIST = `Zebra
Apple
Monkey
Orange
Banana
Elephant`;

export default function TextSorter() {
  const [text, setText] = useState<string>(SAMPLE_LIST);
  const [copied, setCopied] = useState<boolean>(false);

  const sortLines = (direction: 'asc' | 'desc') => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    lines.sort((a, b) => {
      return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
    setText(lines.join('\n'));
  };

  const sortNumeric = () => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    lines.sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA - numB;
    });
    setText(lines.join('\n'));
  };

  const reverseLines = () => {
    const lines = text.split('\n');
    setText(lines.reverse().join('\n'));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>Lines to Sort</label>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Result'}
          </button>
        </div>

        <textarea
          className="tool-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste lines here..."
          style={{ height: '200px', marginBottom: 'var(--space-xl)' }}
        />

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => sortLines('asc')}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowDownAZ size={16} /> Alphabetical (A → Z)
          </button>
          <button
            type="button"
            onClick={() => sortLines('desc')}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowUpAZ size={16} /> Alphabetical (Z → A)
          </button>
          <button
            type="button"
            onClick={sortNumeric}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)' }}
          >
            Numeric Sort (1 → 9)
          </button>
          <button
            type="button"
            onClick={reverseLines}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--color-border)' }}
          >
            Reverse Lines Order
          </button>
        </div>
      </div>
    </div>
  );
}
