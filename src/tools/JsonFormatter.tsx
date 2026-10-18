import React, { useState } from 'react';
import { Braces, Copy, Check, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import './tools.css';

const SAMPLE_RAW = `{"platform":"ToolSathi","features":["video-playback","pdf-suite","media-converters"],"stats":{"tools":60,"clientSide":true,"status":"optimal"}}`;

export default function JsonFormatter() {
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_RAW);
  const [formatted, setFormatted] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatJson = (str: string, space: number) => {
    try {
      setErrorMsg(null);
      if (!str.trim()) {
        setFormatted('');
        return;
      }
      const parsed = JSON.parse(str);
      setFormatted(JSON.stringify(parsed, null, space));
    } catch (err) {
      setErrorMsg('Syntax Error: ' + (err as Error).message);
    }
  };

  const minifyJson = () => {
    try {
      setErrorMsg(null);
      const parsed = JSON.parse(jsonInput);
      setFormatted(JSON.stringify(parsed));
    } catch (err) {
      setErrorMsg('Syntax Error: ' + (err as Error).message);
    }
  };

  React.useEffect(() => {
    formatJson(SAMPLE_RAW, indent);
  }, []);

  const handleCopy = () => {
    if (formatted) {
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>Raw JSON Input</label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setJsonInput(SAMPLE_RAW);
                formatJson(SAMPLE_RAW, indent);
              }}
            >
              Reset Sample
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setJsonInput('');
                setFormatted('');
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          className="tool-textarea"
          value={jsonInput}
          onChange={e => {
            setJsonInput(e.target.value);
            formatJson(e.target.value, indent);
          }}
          placeholder="Paste unformatted JSON here..."
          style={{ height: '160px', marginBottom: 'var(--space-md)' }}
        />

        {errorMsg && (
          <div className="tool-alert tool-alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Indent:</span>
            {[2, 4].map(sp => (
              <button
                key={sp}
                type="button"
                onClick={() => {
                  setIndent(sp);
                  formatJson(jsonInput, sp);
                }}
                className={`btn btn-sm ${indent === sp ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: '1px solid var(--color-border)' }}
              >
                {sp} spaces
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={minifyJson}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Minimize2 size={14} /> Minify / Compact
          </button>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Formatted Output</span>
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
          readOnly
          className="tool-textarea"
          value={formatted}
          style={{ height: '260px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
