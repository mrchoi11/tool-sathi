import React, { useState } from 'react';
import { CheckCircle, AlertCircle, FileCode } from 'lucide-react';
import './tools.css';

export default function JsonValidator() {
  const [jsonInput, setJsonInput] = useState<string>('{\n  "title": "ToolSathi Validator",\n  "status": "active",\n  "version": 2.0\n}');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string; stats?: { keys: number; size: number } } | null>(null);

  const validate = (text: string) => {
    if (!text.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const keyCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1;
      setValidationResult({
        isValid: true,
        stats: {
          keys: keyCount,
          size: new Blob([text]).size
        }
      });
    } catch (err) {
      setValidationResult({
        isValid: false,
        error: (err as Error).message
      });
    }
  };

  React.useEffect(() => {
    validate(jsonInput);
  }, []);

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
          Enter JSON to Validate
        </label>
        <textarea
          className="tool-textarea"
          value={jsonInput}
          onChange={e => {
            setJsonInput(e.target.value);
            validate(e.target.value);
          }}
          placeholder="Paste JSON to test syntax..."
          style={{ height: '220px', marginBottom: 'var(--space-lg)' }}
        />

        {validationResult && (
          <div>
            {validationResult.isValid ? (
              <div className="tool-alert tool-alert-success">
                <CheckCircle size={20} />
                <div>
                  <strong>Valid JSON:</strong> Syntactically correct and fully RFC 8259 compliant.
                </div>
              </div>
            ) : (
              <div className="tool-alert tool-alert-danger">
                <AlertCircle size={20} />
                <div>
                  <strong>Invalid JSON:</strong> {validationResult.error}
                </div>
              </div>
            )}

            {validationResult.stats && (
              <div className="tool-stats-grid" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: '#10b981' }}>Valid</div>
                  <div className="tool-stat-label">Syntax Status</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{validationResult.stats.keys}</div>
                  <div className="tool-stat-label">Top-Level Properties</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{validationResult.stats.size} B</div>
                  <div className="tool-stat-label">Payload Size</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
