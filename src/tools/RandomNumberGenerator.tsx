import React, { useState } from 'react';
import { Dices, RefreshCw, Copy, Check } from 'lucide-react';
import './tools.css';

export default function RandomNumberGenerator() {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [results, setResults] = useState<number[]>([42]);
  const [copied, setCopied] = useState<boolean>(false);

  const generate = () => {
    if (min >= max) return;
    const list: number[] = [];
    const range = max - min + 1;

    if (!allowDuplicates && count > range) {
      alert('Count cannot exceed range when duplicates are not allowed.');
      return;
    }

    const seen = new Set<number>();
    while (list.length < count) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const val = min + (array[0] % range);

      if (!allowDuplicates) {
        if (!seen.has(val)) {
          seen.add(val);
          list.push(val);
        }
      } else {
        list.push(val);
      }
    }

    setResults(list);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Minimum Value</label>
            <input
              type="number"
              value={min}
              onChange={e => setMin(parseInt(e.target.value) || 0)}
              className="tool-input"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Maximum Value</label>
            <input
              type="number"
              value={max}
              onChange={e => setMax(parseInt(e.target.value) || 1)}
              className="tool-input"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Quantity</label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="tool-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={allowDuplicates}
              onChange={e => setAllowDuplicates(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Allow Duplicate Numbers
          </label>
        </div>

        <div style={{ textAlign: 'center', background: 'var(--color-bg)', padding: 'var(--space-2xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
            {results.map((r, i) => (
              <span
                key={i}
                style={{
                  fontSize: count > 5 ? '1.5rem' : '2.5rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  padding: '8px 18px',
                  background: 'var(--color-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)'
                }}
              >
                {r}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={generate}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> Generate New Random
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost"
              style={{ border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
