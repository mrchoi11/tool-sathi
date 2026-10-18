import React, { useState } from 'react';
import { Search, Monitor, Smartphone, Copy, Check } from 'lucide-react';
import './tools.css';

export default function MetaTitlePreview() {
  const [title, setTitle] = useState<string>('ToolSathi — Fast Online Video Player, PDF Tools & Media Converters');
  const [description, setDescription] = useState<string>('Process media, convert documents, format data, and stream videos directly in your browser. Fast, free, and secure zero-upload client tools.');
  const [slug, setSlug] = useState<string>('tools/video-player');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const titleChars = title.length;
  const descChars = description.length;

  const isTitleGood = titleChars >= 40 && titleChars <= 60;
  const isDescGood = descChars >= 120 && descChars <= 160;

  const handleCopyTags = () => {
    const tags = `<title>${title}</title>\n<meta name="description" content="${description}" />`;
    navigator.clipboard.writeText(tags);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="tool-field">
            <div className="tool-label">
              <span>Page Title</span>
              <span style={{ fontSize: '0.8rem', color: isTitleGood ? '#10b981' : titleChars > 60 ? '#f87171' : 'var(--color-text-muted)' }}>
                {titleChars} / 60 characters
              </span>
            </div>
            <input
              type="text"
              className="tool-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Target URL Path / Slug</label>
            <input
              type="text"
              className="tool-input"
              value={slug}
              onChange={e => setSlug(e.target.value)}
            />
          </div>
        </div>

        <div className="tool-field" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-label">
            <span>Meta Description</span>
            <span style={{ fontSize: '0.8rem', color: isDescGood ? '#10b981' : descChars > 160 ? '#f87171' : 'var(--color-text-muted)' }}>
              {descChars} / 160 characters
            </span>
          </div>
          <textarea
            className="tool-textarea"
            style={{ height: '80px' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Google SERP Snippet Preview</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`btn btn-sm ${device === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`btn btn-sm ${device === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>
        </div>

        {/* Google SERP Simulated Result */}
        <div
          style={{
            background: '#ffffff',
            color: '#202124',
            padding: device === 'desktop' ? '20px 24px' : '16px',
            borderRadius: '10px',
            maxWidth: device === 'desktop' ? '650px' : '380px',
            margin: '0 auto var(--space-xl)',
            fontFamily: 'arial, sans-serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              TS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#202124', lineHeight: 1.2 }}>ToolSathi</span>
              <span style={{ fontSize: '12px', color: '#4d5156', lineHeight: 1.2 }}>
                https://toolsathi.com › {slug}
              </span>
            </div>
          </div>

          <h3
            style={{
              fontSize: device === 'desktop' ? '20px' : '18px',
              fontWeight: 400,
              color: '#1a0dab',
              margin: '6px 0',
              lineHeight: 1.3,
              cursor: 'pointer'
            }}
          >
            {title || 'Page Title Here'}
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: '#4d5156',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            {description || 'Page meta description snippet preview appears here.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            type="button"
            onClick={handleCopyTags}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy HTML Tags'}
          </button>
        </div>
      </div>
    </div>
  );
}
