import React, { useState } from 'react';
import { Map, Copy, Download, Check } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

const DEFAULT_URLS = `https://toolsathi.com/
https://toolsathi.com/tools
https://toolsathi.com/tools/video-player
https://toolsathi.com/tools/pdf-merger
https://toolsathi.com/tools/image-compressor`;

export default function XmlSitemapGenerator() {
  const [urlsInput, setUrlsInput] = useState<string>(DEFAULT_URLS);
  const [changeFreq, setChangeFreq] = useState<string>('weekly');
  const [priority, setPriority] = useState<string>('0.8');
  const [copied, setCopied] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const generateSitemap = (): string => {
    const urls = urlsInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    urls.forEach(u => {
      xml += `  <url>\n    <loc>${u}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>${changeFreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
  };

  const xmlOutput = generateSitemap();

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlOutput], { type: 'application/xml;charset=utf-8' });
    saveAs(blob, 'sitemap.xml');
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          Website URLs (one per line)
        </label>
        <textarea
          className="tool-textarea"
          value={urlsInput}
          onChange={e => setUrlsInput(e.target.value)}
          placeholder="https://example.com/page-1..."
          style={{ height: '140px', marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Change Frequency</label>
            <select className="tool-select" value={changeFreq} onChange={e => setChangeFreq(e.target.value)}>
              <option value="always">Always</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="tool-field">
            <label className="tool-label">Priority</label>
            <select className="tool-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="1.0">1.0 (Highest)</option>
              <option value="0.8">0.8 (Default)</option>
              <option value="0.6">0.6</option>
              <option value="0.4">0.4</option>
            </select>
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Generated XML Sitemap</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download sitemap.xml
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={xmlOutput}
          style={{ height: '220px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
