import React, { useState } from 'react';
import { Type, Copy, Check } from 'lucide-react';
import './tools.css';

export default function CaseConverter() {
  const [text, setText] = useState<string>('ToolSathi is the ultimate online developer and multimedia toolkit.');
  const [copied, setCopied] = useState(false);

  const toSentenceCase = (str: string) => {
    return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
  };

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(w => (w.length > 0 ? w[0].toUpperCase() + w.substring(1) : ''))
      .join(' ');
  };

  const toCamelCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, c => c.toUpperCase());
  };

  const toSnakeCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const toKebabCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>Source Text</label>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <textarea
          className="tool-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste text to transform case..."
          style={{ height: '160px', marginBottom: 'var(--space-xl)' }}
        />

        <label className="tool-label" style={{ marginBottom: 'var(--space-sm)' }}>Transform Case</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)' }}>
          <button type="button" onClick={() => setText(text.toUpperCase())} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            UPPERCASE
          </button>
          <button type="button" onClick={() => setText(text.toLowerCase())} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            lowercase
          </button>
          <button type="button" onClick={() => setText(toTitleCase(text))} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            Title Case
          </button>
          <button type="button" onClick={() => setText(toSentenceCase(text))} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            Sentence case
          </button>
          <button type="button" onClick={() => setText(toCamelCase(text))} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            camelCase
          </button>
          <button type="button" onClick={() => setText(toPascalCase(text))} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            PascalCase
          </button>
          <button type="button" onClick={() => setText(toSnakeCase(text))} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            snake_case
          </button>
          <button type="button" onClick={() => setText(toKebabCase(text))} className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }}>
            kebab-case
          </button>
        </div>
      </div>
    </div>
  );
}
