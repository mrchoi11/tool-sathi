import React, { useState } from 'react';
import { Upload, Combine, FileText, Trash2, ArrowUp, ArrowDown, Download, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import './tools.css';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

export default function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<PdfFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems: PdfFileItem[] = [];
    for (const f of files) {
      if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
        let pages = 0;
        try {
          const buffer = await f.arrayBuffer();
          const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          pages = doc.getPageCount();
        } catch (err) {
          console.warn('Could not read page count for', f.name);
        }

        newItems.push({
          id: Math.random().toString(36).substring(7),
          file: f,
          name: f.name,
          size: f.size,
          pageCount: pages,
        });
      }
    }

    setPdfFiles(prev => [...prev, ...newItems]);
    setMergedBlob(null);
  };

  const removeFile = (id: string) => {
    setPdfFiles(prev => prev.filter(item => item.id !== id));
    setMergedBlob(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setPdfFiles(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return copy;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) return;
    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      setMergedBlob(blob);
    } catch (err) {
      alert('Error merging PDFs: ' + (err as Error).message);
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (mergedBlob) {
      saveAs(mergedBlob, 'merged_document.pdf');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="application/pdf" multiple onChange={handleFiles} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <Combine size={24} />
          </div>
          <span className="tool-dropzone-text">Add PDF Files to Merge</span>
          <span className="tool-dropzone-hint">Select two or more PDFs to combine into a single document</span>
        </label>
      </div>

      {pdfFiles.length > 0 && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
            <span className="tool-result-title">Documents to Merge ({pdfFiles.length})</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPdfFiles([])}>
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
            {pdfFiles.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-md)',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', width: '20px' }}>
                    {idx + 1}.
                  </span>
                  <FileText size={20} color="var(--color-primary)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatBytes(item.size)} • {item.pageCount ? `${item.pageCount} pages` : 'Calculating...'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    className="ctrl-btn"
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === pdfFiles.length - 1}
                    className="ctrl-btn"
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="ctrl-btn"
                    style={{ color: '#f87171' }}
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleMerge}
              disabled={pdfFiles.length < 2 || isMerging}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Combine size={16} /> {isMerging ? 'Merging Documents...' : `Merge ${pdfFiles.length} PDFs`}
            </button>

            {mergedBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff' }}
              >
                <Download size={16} /> Download Merged PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
