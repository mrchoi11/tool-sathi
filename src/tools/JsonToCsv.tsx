import React, { useState } from 'react';
import { FileSpreadsheet, Copy, Download, Check } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

const SAMPLE_JSON = `[
  { "id": 1, "name": "Nexus Pro Player", "price": 49.99, "status": "active" },
  { "id": 2, "name": "PDF Suite Elite", "price": 79.00, "status": "active" },
  { "id": 3, "name": "Image Optimizer", "price": 29.50, "status": "beta" }
]`;

export default function JsonToCsv() {
  const [jsonText, setJsonText] = useState<string>(SAMPLE_JSON);
  const [csvOutput, setCsvOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const convertJsonToCsv = (jsonStr: string) => {
    try {
      setErrorMsg(null);
      const parsed = JSON.parse(jsonStr);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      if (arr.length === 0) {
        setCsvOutput('');
        return;
      }

      // Collect all keys
      const keys = Array.from(new Set(arr.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : []))));
      const headerRow = keys.join(',');

      const rows = arr.map(item => {
        return keys
          .map(k => {
            const val = item[k];
            if (val === undefined || val === null) return '';
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
              return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
          })
          .join(',');
      });

      setCsvOutput([headerRow, ...rows].join('\n'));
    } catch (err) {
      setErrorMsg('Invalid JSON syntax: ' + (err as Error).message);
    }
  };

  React.useEffect(() => {
    convertJsonToCsv(SAMPLE_JSON);
  }, []);

  const handleCopy = () => {
    if (csvOutput) {
      navigator.clipboard.writeText(csvOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (csvOutput) {
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'export.csv');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>JSON Input Array</label>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setJsonText(SAMPLE_JSON);
              convertJsonToCsv(SAMPLE_JSON);
            }}
          >
            Reset Sample
          </button>
        </div>

        <textarea
          className="tool-textarea"
          value={jsonText}
          onChange={e => {
            setJsonText(e.target.value);
            convertJsonToCsv(e.target.value);
          }}
          placeholder="Paste JSON array here..."
          style={{ height: '180px', marginBottom: 'var(--space-lg)' }}
        />

        {errorMsg && (
          <div className="tool-alert tool-alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            {errorMsg}
          </div>
        )}

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">CSV Output</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy CSV'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download .csv
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={csvOutput}
          style={{ height: '200px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
