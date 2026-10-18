import React, { useState } from 'react';
import { Eye, Copy, Check, Share2, Globe } from 'lucide-react';
import './tools.css';

export default function OpenGraphPreview() {
  const [title, setTitle] = useState<string>('ToolSathi — Ultimate Web Tools & Video Player Suite');
  const [description, setDescription] = useState<string>('Free online tools for developers, creators, and professionals. Play videos, convert PDFs, optimize images and edit data directly in browser.');
  const [url, setUrl] = useState<string>('https://toolsathi.com');
  const [siteName, setSiteName] = useState<string>('ToolSathi');
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
  const [copied, setCopied] = useState(false);

  const ogTagsSnippet = `<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="og:site_name" content="${siteName}" />
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${imageUrl}" />`;

  const handleCopyTags = () => {
    navigator.clipboard.writeText(ogTagsSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>Open Graph Metadata Parameters</h3>

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-field">
            <label className="tool-label">OG Title ({title.length}/60 chars)</label>
            <input
              type="text"
              className="tool-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Canonical URL</label>
            <input
              type="url"
              className="tool-input"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="tool-field" style={{ marginBottom: 'var(--space-lg)' }}>
          <label className="tool-label">OG Description ({description.length}/155 chars)</label>
          <textarea
            className="tool-textarea"
            style={{ height: '80px' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">OG Image URL (1200 × 630)</label>
            <input
              type="url"
              className="tool-input"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Site Name</label>
            <input
              type="text"
              className="tool-input"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
            />
          </div>
        </div>

        {/* Live Social Share Card Preview */}
        <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Live Social Card Preview (Facebook / X / LinkedIn)</h4>
        <div style={{ maxWidth: '580px', margin: '0 auto var(--space-xl)', background: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          {imageUrl && (
            <div style={{ width: '100%', height: '260px', overflow: 'hidden', background: '#0f172a' }}>
              <img src={imageUrl} alt="OG Card Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
              {siteName.toUpperCase()} • {new URL(url || 'https://toolsathi.com').hostname}
            </span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '6px 0', color: '#f8fafc', lineHeight: 1.3 }}>
              {title}
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {description}
            </p>
          </div>
        </div>

        {/* HTML Tag Snippet */}
        <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="tool-result-title">Generated HTML Meta Tags</span>
          <button
            type="button"
            onClick={handleCopyTags}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Meta Tags'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={ogTagsSnippet}
          style={{ height: '150px', background: 'var(--color-bg)', fontSize: '0.8rem' }}
        />
      </div>
    </div>
  );
}
