import React, { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import './tools.css';

export default function UrlSlugGenerator() {
  const [inputText, setInputText] = useState<string>('How to Build a High Performance Video Player in React 19!');
  const [separator, setSeparator] = useState<string>('-');
  const [lowercase, setLowercase] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  const generateSlug = (text: string): string => {
    let slug = text
      .normalize('NFD') // separate accents from letters
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // remove invalid chars
      .trim();

    if (lowercase) {
      slug = slug.toLowerCase();
    }

    slug = slug.replace(/\s+/g, separator);
    return slug;
  };

  const slug = generateSlug(inputText);

  const handleCopy = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          Headline or Article Title
        </label>
        <input
          type="text"
          className="tool-input"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter title to convert into URL slug..."
          style={{ marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Word Separator</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {[
                { label: 'Hyphen (-)', val: '-' },
                { label: 'Underscore (_)', val: '_' },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setSeparator(item.val)}
                  className={`btn ${separator === item.val ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ border: '1px solid var(--color-border)', flex: 1 }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-field" style={{ justifyContent: 'center' }}>
            <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={lowercase}
                onChange={e => setLowercase(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
              Force Lowercase Characters
            </label>
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="tool-result-title">SEO Slug Output</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Slug'}
          </button>
        </div>

        <div style={{ background: 'var(--color-bg)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>example.com/</span>
          <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem', wordBreak: 'break-all' }}>{slug}</strong>
        </div>
      </div>
    </div>
  );
}
