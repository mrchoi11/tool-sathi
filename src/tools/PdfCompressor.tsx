import React, { useState } from 'react';
import { Upload, FileDown, FileText, Download, Check, Sparkles } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import './tools.css';

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setOriginalSize(f.size);
      setCompressedSize(null);
      setCompressedBlob(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      // Load and re-save using objects optimization
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      
      // Save with object stream compression
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([compressedBytes as any], { type: 'application/pdf' });

      setCompressedBlob(blob);
      setCompressedSize(blob.size);
    } catch (err) {
      alert('Error compressing PDF: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (compressedBlob && file) {
      saveAs(compressedBlob, `compressed_${file.name}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savingsPct = compressedSize && originalSize
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <FileDown size={24} />
            </div>
            <span className="tool-dropzone-text">Upload PDF to Compress</span>
            <span className="tool-dropzone-hint">Optimizes objects and structure without uploading to cloud</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <FileText size={24} color="var(--color-primary)" />
                <div>
                  <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Original File Size: <strong>{formatBytes(originalSize)}</strong>
                  </span>
                </div>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
              <button
                type="button"
                onClick={handleCompress}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Sparkles size={16} /> {isProcessing ? 'Optimizing PDF...' : 'Compress PDF'}
              </button>

              {compressedBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-success"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff' }}
                >
                  <Download size={16} /> Download Optimized PDF
                </button>
              )}
            </div>

            {compressedSize !== null && (
              <div className="tool-stats-grid">
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{formatBytes(originalSize)}</div>
                  <div className="tool-stat-label">Original Size</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: '#10b981' }}>{formatBytes(compressedSize)}</div>
                  <div className="tool-stat-label">Optimized Size</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: 'var(--color-accent)' }}>{savingsPct}%</div>
                  <div className="tool-stat-label">Space Saved</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
