import React, { useState } from 'react';
import { AlignLeft, AlertCircle, CheckCircle } from 'lucide-react';
import './tools.css';

const SAMPLE_CONTENT = `<h1>Ultimate Web Productivity Guide</h1>
<p>Here is an introduction to building digital tools.</p>
<h2>1. Video Streaming Architecture</h2>
<p>HLS and MP4 containers are the industry standard.</p>
<h3>1.1 Bandwidth Considerations</h3>
<p>Ensure multiple bitrates are encoded.</p>
<h2>2. PDF Client Manipulations</h2>
<p>pdf-lib enables zero-upload document merging.</p>`;

interface HeadingItem {
  tag: string;
  level: number;
  text: string;
}

export default function HeadingStructureAnalyzer() {
  const [content, setContent] = useState<string>(SAMPLE_CONTENT);

  const analyzeHeadings = (html: string): { headings: HeadingItem[]; issues: string[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const list: HeadingItem[] = [];
    const issues: string[] = [];

    let h1Count = 0;
    let prevLevel = 0;

    nodes.forEach(node => {
      const tag = node.tagName.toLowerCase();
      const level = parseInt(tag.replace('h', ''));
      const text = node.textContent?.trim() || '';

      if (level === 1) h1Count++;
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push(`Heading level skipped: Jumped from <h${prevLevel}> directly to <h${level}> ("${text}")`);
      }
      prevLevel = level;

      list.push({ tag, level, text });
    });

    if (h1Count === 0) issues.push('Missing <h1> heading tag on the page.');
    if (h1Count > 1) issues.push(`Found ${h1Count} <h1> headings. SEO best practice recommends exactly one <h1> per page.`);

    return { headings: list, issues };
  };

  const { headings, issues } = analyzeHeadings(content);

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          HTML Content to Analyze
        </label>
        <textarea
          className="tool-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Paste page HTML or article content with heading tags..."
          style={{ height: '160px', marginBottom: 'var(--space-lg)' }}
        />

        {/* Quality Diagnostics */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          {issues.length === 0 ? (
            <div className="tool-alert tool-alert-success">
              <CheckCircle size={18} />
              <div>
                <strong>Clean Heading Hierarchy:</strong> Exactly one &lt;h1&gt; found and all heading sub-levels are sequentially ordered.
              </div>
            </div>
          ) : (
            <div className="tool-alert tool-alert-warning" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <AlertCircle size={18} /> Found {issues.length} Structural Issue{issues.length > 1 ? 's' : ''}:
              </div>
              <ul style={{ margin: '6px 0 0 20px', padding: 0, fontSize: '0.85rem' }}>
                {issues.map((iss, i) => (
                  <li key={i}>{iss}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Detected Heading Outline ({headings.length})</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {headings.map((h, idx) => (
            <div
              key={idx}
              style={{
                marginLeft: `${(h.level - 1) * 20}px`,
                padding: '8px 12px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid var(--color-${h.level === 1 ? 'primary' : 'secondary'})`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                {h.tag}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                {h.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
