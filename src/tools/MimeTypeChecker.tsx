import React, { useState } from 'react';
import { Upload, FileQuestion, FileCheck } from 'lucide-react';
import './tools.css';

interface MimeResult {
  fileName: string;
  fileSize: number;
  browserMime: string;
  detectedType: string;
  extension: string;
}

export default function MimeTypeChecker() {
  const [result, setResult] = useState<MimeResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    
    setResult({
      fileName: file.name,
      fileSize: file.size,
      browserMime: file.type || 'application/octet-stream',
      detectedType: file.type ? file.type.split('/')[0] : 'binary',
      extension: ext,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <FileQuestion size={24} />
          </div>
          <span className="tool-dropzone-text">Upload Any File to Check MIME Type</span>
          <span className="tool-dropzone-hint">Detects media container, HTTP content-type, and extension mapping</span>
        </label>
      </div>

      {result && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <FileCheck size={22} color="var(--color-primary)" />
              <strong style={{ fontSize: '1.1rem' }}>{result.fileName}</strong>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {formatBytes(result.fileSize)}
            </span>
          </div>

          <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="tool-stat-card">
              <div className="tool-stat-value" style={{ fontSize: '1.1rem', wordBreak: 'break-all' }}>{result.browserMime}</div>
              <div className="tool-stat-label">Full MIME Type</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value">.{result.extension}</div>
              <div className="tool-stat-label">File Extension</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value" style={{ textTransform: 'capitalize' }}>{result.detectedType}</div>
              <div className="tool-stat-label">Primary Category</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
