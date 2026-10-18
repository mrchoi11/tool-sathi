import React, { useState } from 'react';
import { Fingerprint, Copy, Check, RefreshCw } from 'lucide-react';
import './tools.css';

export default function UuidGenerator() {
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const generateUuidV4 = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (
        parseInt(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))
      ).toString(16)
    );
  };

  const generateList = () => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let id = generateUuidV4();
      if (!hyphens) id = id.replace(/-/g, '');
      if (uppercase) id = id.toUpperCase();
      list.push(id);
    }
    setUuids(list);
  };

  React.useEffect(() => {
    generateList();
  }, [count, uppercase, hyphens]);

  const handleCopy = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-field">
            <label className="tool-label">Quantity to Generate</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="tool-input"
            />
          </div>

          <div className="tool-field" style={{ justifyContent: 'center' }}>
            <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={hyphens}
                onChange={e => setHyphens(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
              Include Hyphens (Standard)
            </label>
          </div>

          <div className="tool-field" style={{ justifyContent: 'center' }}>
            <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={uppercase}
                onChange={e => setUppercase(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
              Uppercase Characters
            </label>
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Generated UUIDs v4 ({uuids.length})</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={generateList}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={14} /> Regenerate
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy All'}
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={uuids.join('\n')}
          style={{ height: '220px', background: 'var(--color-bg)', fontSize: '0.9rem' }}
        />
      </div>
    </div>
  );
}
