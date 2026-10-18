import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import './tools.css';

export default function OpenGraphTagGenerator() {
  const [title, setTitle] = useState<string>('ToolSathi Studio');
  const [description, setDescription] = useState<string>('Free web utilities for creators and developers.');
  const [url, setUrl] = useState<string>('https://toolsathi.com');
  const [imageUrl, setImageUrl] = useState<string>('https://toolsathi.com/og-banner.png');
  const [siteName, setSiteName] = useState<string>('ToolSathi');
  const [twitterUser, setTwitterUser] = useState<string>('@toolsathi');
  const [copied, setCopied] = useState<boolean>(false);

  const tagsSnippet = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="og:site_name" content="${siteName}" />

<!-- Twitter Card -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${url}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<meta property="twitter:image" content="${imageUrl}" />
<meta property="twitter:site" content="${twitterUser}" />`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tagsSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>Open Graph & Twitter Tag Builder</h3>

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-field">
            <label className="tool-label">Page Title</label>
            <input type="text" className="tool-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="tool-field">
            <label className="tool-label">Canonical URL</label>
            <input type="url" className="tool-input" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="tool-field">
            <label className="tool-label">OG Image Banner URL</label>
            <input type="url" className="tool-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          </div>
          <div className="tool-field">
            <label className="tool-label">Twitter / X Handle</label>
            <input type="text" className="tool-input" value={twitterUser} onChange={e => setTwitterUser(e.target.value)} />
          </div>
        </div>

        <div className="tool-field" style={{ marginBottom: 'var(--space-xl)' }}>
          <label className="tool-label">Meta Description</label>
          <textarea
            className="tool-textarea"
            style={{ height: '70px' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Generated Meta Tags</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy All Meta Tags'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={tagsSnippet}
          style={{ height: '240px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
