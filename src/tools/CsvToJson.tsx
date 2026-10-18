import React, { useState } from 'react';
import { FileJson, Copy, Download, Check, RefreshCw } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

const SAMPLE_CSV = `id,name,role,department,location
101,Sarah Connor,Security Lead,Engineering,San Francisco
102,John Doe,Frontend Architect,Design,London
103,Alex Rivera,Data Scientist,Analytics,Tokyo
104,Elena Rostova,Product Manager,Growth,Berlin`;

export default function CsvToJson() {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const convertCsvToJson = (csv: string) => {
    try {
      setErrorMsg(null);
      const lines = csv.trim().split('\n');
      if (lines.length < 2) {
        setJsonOutput('[]');
        return;
      }

      // Simple CSV header parse (supports commas)
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const results = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const currentline = line.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
        const obj: Record<string, any> = {};

        headers.forEach((header, index) => {
          let val: any = currentline[index] !== undefined ? currentline[index] : null;
          // Auto cast numbers or booleans
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (val !== null && val !== '' && !isNaN(Number(val))) val = Number(val);

          obj[header] = val;
        });

        results.push(obj);
      }

      setJsonOutput(JSON.stringify(results, null, 2));
    } catch (err) {
      setErrorMsg('Failed to parse CSV: ' + (err as Error).message);
    }
  };

  React.useEffect(() => {
    convertCsvToJson(SAMPLE_CSV);
  }, []);

  const handleCopy = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: 'application/json' });
      saveAs(blob, 'converted.json');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>CSV Input</label>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setCsvText(SAMPLE_CSV);
              convertCsvToJson(SAMPLE_CSV);
            }}
          >
            Reset Sample
          </button>
        </div>

        <textarea
          className="tool-textarea"
          value={csvText}
          onChange={e => {
            setCsvText(e.target.value);
            convertCsvToJson(e.target.value);
          }}
          placeholder="Paste CSV rows with headers here..."
          style={{ height: '180px', marginBottom: 'var(--space-lg)' }}
        />

        {errorMsg && (
          <div className="tool-alert tool-alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            {errorMsg}
          </div>
        )}

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">JSON Output</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download .json
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={jsonOutput}
          style={{ height: '220px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
