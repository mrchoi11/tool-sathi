import React, { useState } from 'react';
import { FileCode, Copy, Check, Eye } from 'lucide-react';
import './tools.css';

const SAMPLE_MD = `# ToolSathi Studio
Welcome to the **fastest** browser utility suite.

### Key Capabilities:
- *100% Client-Side* processing
- Zero document tracking
- Instant output downloads

Check out our [All Tools](/tools) page for more!`;

export default function MarkdownToHtml() {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MD);
  const [copied, setCopied] = useState(false);

  // Client-side markdown to HTML renderer
  const parseMarkdown = (md: string): string => {
    let html = md
      // Escape script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Blockquote
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Unordered lists
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n$/gim, '<br />');

    // Wrap li elements in ul
    html = html.replace(/(<li>.*?<\/li>)/gims, '<ul>$1</ul>');
    return html;
  };

  const htmlOutput = parseMarkdown(markdown);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
          Markdown Input
        </label>
        <textarea
          className="tool-textarea"
          value={markdown}
          onChange={e => setMarkdown(e.target.value)}
          placeholder="Write or paste Markdown syntax here..."
          style={{ height: '180px', marginBottom: 'var(--space-xl)' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
          {/* HTML Code Output */}
          <div>
            <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="tool-result-title">Generated HTML</span>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy HTML'}
              </button>
            </div>
            <textarea
              readOnly
              className="tool-textarea"
              value={htmlOutput}
              style={{ height: '220px', background: 'var(--color-bg)', fontSize: '0.85rem' }}
            />
          </div>

          {/* Live Preview */}
          <div>
            <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="tool-result-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} /> Rendered Preview
              </span>
            </div>
            <div
              style={{
                height: '220px',
                padding: 'var(--space-md)',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflowY: 'auto',
                fontSize: '0.95rem',
                lineHeight: 1.6
              }}
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
