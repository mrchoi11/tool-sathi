import React, { useState } from 'react';
import { Braces, Copy, Check } from 'lucide-react';
import './tools.css';

type SchemaType = 'SoftwareApplication' | 'Article' | 'Organization' | 'FAQPage';

export default function JsonLdGenerator() {
  const [schemaType, setSchemaType] = useState<SchemaType>('SoftwareApplication');
  const [name, setName] = useState<string>('ToolSathi');
  const [url, setUrl] = useState<string>('https://toolsathi.com');
  const [description, setDescription] = useState<string>('Complete web-based productivity, media player, and document toolkit.');
  const [copied, setCopied] = useState(false);

  const generateSchema = (): string => {
    let data: any = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name,
      url,
      description,
    };

    if (schemaType === 'SoftwareApplication') {
      data = {
        ...data,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any modern browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      };
    } else if (schemaType === 'Organization') {
      data = {
        ...data,
        logo: `${url}/logo.png`,
        sameAs: ['https://twitter.com/toolsathi'],
      };
    }

    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
  };

  const outputSnippet = generateSchema();

  const handleCopy = () => {
    navigator.clipboard.writeText(outputSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-field">
            <label className="tool-label">Schema Type</label>
            <select className="tool-select" value={schemaType} onChange={e => setSchemaType(e.target.value as any)}>
              <option value="SoftwareApplication">SoftwareApplication (Web App / Tools)</option>
              <option value="Article">Article / Blog Post</option>
              <option value="Organization">Organization / Brand</option>
              <option value="FAQPage">FAQPage</option>
            </select>
          </div>

          <div className="tool-field">
            <label className="tool-label">Name / Title</label>
            <input
              type="text"
              className="tool-input"
              value={name}
              onChange={e => setName(e.target.value)}
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

        <div className="tool-field" style={{ marginBottom: 'var(--space-xl)' }}>
          <label className="tool-label">Description</label>
          <textarea
            className="tool-textarea"
            style={{ height: '70px' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Generated JSON-LD Schema</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Script Tag'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={outputSnippet}
          style={{ height: '200px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
