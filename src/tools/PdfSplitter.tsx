import React, { useState } from 'react';
import { Upload, Scissors, FileText, Download, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import './tools.css';

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [fromPage, setFromPage] = useState<number>(1);
  const [toPage, setToPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedBlob, setExtractedBlob] = useState<Blob | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = doc.getPageCount();
      setFile(f);
      setTotalPages(pages);
      setFromPage(1);
      setToPage(pages);
      setExtractedBlob(null);
    } catch (err) {
      alert('Could not open PDF file. It might be password protected.');
    }
  };

  const handleExtract = async () => {
    if (!file || fromPage < 1 || toPage > totalPages || fromPage > toPage) {
      alert('Please specify a valid page range.');
      return;
    }

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const newDoc = await PDFDocument.create();

      const pageIndices: number[] = [];
      for (let i = fromPage - 1; i <= toPage - 1; i++) {
        pageIndices.push(i);
      }

      const copied = await newDoc.copyPages(srcDoc, pageIndices);
      copied.forEach(page => newDoc.addPage(page));

      const bytes = await newDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setExtractedBlob(blob);
    } catch (err) {
      alert('Error extracting pages: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (extractedBlob && file) {
      const baseName = file.name.replace(/\.pdf$/i, '');
      saveAs(extractedBlob, `${baseName}-pages-${fromPage}-to-${toPage}.pdf`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <Scissors size={24} />
            </div>
            <span className="tool-dropzone-text">Upload PDF to Split</span>
            <span className="tool-dropzone-hint">Select a multi-page PDF document to extract pages</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <FileText size={24} color="var(--color-primary)" />
                <div>
                  <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Total Pages: <strong>{totalPages}</strong>
                  </span>
                </div>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="tool-field">
                <label className="tool-label">From Page</label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={fromPage}
                  onChange={e => setFromPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
                  className="tool-input"
                />
              </div>
              <div className="tool-field">
                <label className="tool-label">To Page</label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={toPage}
                  onChange={e => setToPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
                  className="tool-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Scissors size={16} /> {isProcessing ? 'Extracting...' : `Extract Pages ${fromPage} - ${toPage}`}
              </button>

              {extractedBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-success"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff' }}
                >
                  <Download size={16} /> Download Extracted PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
