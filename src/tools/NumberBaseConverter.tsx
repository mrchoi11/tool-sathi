import React, { useState } from 'react';
import { Binary, Copy, Check } from 'lucide-react';
import './tools.css';

export default function NumberBaseConverter() {
  const [decimalVal, setDecimalVal] = useState<number>(255);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const bin = decimalVal.toString(2);
  const oct = decimalVal.toString(8);
  const hex = decimalVal.toString(16).toUpperCase();

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-field" style={{ maxWidth: '300px', marginBottom: 'var(--space-xl)' }}>
          <label className="tool-label">Decimal Number (Base 10)</label>
          <input
            type="number"
            value={decimalVal}
            onChange={e => setDecimalVal(parseInt(e.target.value) || 0)}
            className="tool-input"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {[
            { label: 'Binary (Base 2)', val: bin, key: 'bin' },
            { label: 'Hexadecimal (Base 16)', val: hex, key: 'hex' },
            { label: 'Octal (Base 8)', val: oct, key: 'oct' },
            { label: 'Decimal (Base 10)', val: decimalVal.toString(), key: 'dec' },
          ].map(item => (
            <div key={item.key} style={{ background: 'var(--color-bg)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>{item.label}</span>
                <code style={{ fontSize: '1.1rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono, monospace)' }}>{item.val}</code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.val, item.key)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedKey === item.key ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copiedKey === item.key ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
