import React, { useState } from 'react';
import { Link, Copy, Check, ExternalLink } from 'lucide-react';
import './tools.css';

export default function UtmBuilder() {
  const [baseUrl, setBaseUrl] = useState<string>('https://toolsathi.com/tools/video-player');
  const [source, setSource] = useState<string>('google');
  const [medium, setMedium] = useState<string>('cpc');
  const [campaign, setCampaign] = useState<string>('launch_2026');
  const [term, setTerm] = useState<string>('online video player');
  const [content, setContent] = useState<string>('hero_banner');
  const [copied, setCopied] = useState<boolean>(false);

  const buildUrl = (): string => {
    try {
      const cleanBase = baseUrl.trim();
      if (!cleanBase) return '';
      const url = new URL(cleanBase);

      if (source.trim()) url.searchParams.set('utm_source', source.trim());
      if (medium.trim()) url.searchParams.set('utm_medium', medium.trim());
      if (campaign.trim()) url.searchParams.set('utm_campaign', campaign.trim());
      if (term.trim()) url.searchParams.set('utm_term', term.trim());
      if (content.trim()) url.searchParams.set('utm_content', content.trim());

      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  const finalUrl = buildUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          Website Target URL *
        </label>
        <input
          type="url"
          className="tool-input"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          placeholder="https://example.com/landing-page"
          style={{ marginBottom: 'var(--space-lg)' }}
          required
        />

        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Campaign Source (utm_source) *</label>
            <input
              type="text"
              className="tool-input"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g. google, newsletter, twitter"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Campaign Medium (utm_medium) *</label>
            <input
              type="text"
              className="tool-input"
              value={medium}
              onChange={e => setMedium(e.target.value)}
              placeholder="e.g. cpc, email, social, banner"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Campaign Name (utm_campaign)</label>
            <input
              type="text"
              className="tool-input"
              value={campaign}
              onChange={e => setCampaign(e.target.value)}
              placeholder="e.g. spring_sale, product_launch"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Campaign Term (utm_term)</label>
            <input
              type="text"
              className="tool-input"
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder="Target keyword (e.g. video tools)"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Campaign Content (utm_content)</label>
            <input
              type="text"
              className="tool-input"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="A/B test variation (e.g. cta_top)"
            />
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="tool-result-title">Generated Trackable Campaign URL</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Campaign Link'}
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={finalUrl}
          style={{ height: '90px', background: 'var(--color-bg)', color: 'var(--color-primary)', fontWeight: 600 }}
        />
      </div>
    </div>
  );
}
