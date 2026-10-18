import React, { useState } from 'react';
import { Upload, FileSearch, FileText, Calendar, User, Tag } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import './tools.css';

interface PdfMeta {
  name: string;
  size: number;
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export default function PdfMetadataViewer() {
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setLoading(true);
    try {
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      setMeta({
        name: f.name,
        size: f.size,
        pageCount: doc.getPageCount(),
        title: doc.getTitle() || undefined,
        author: doc.getAuthor() || undefined,
        subject: doc.getSubject() || undefined,
        creator: doc.getCreator() || undefined,
        producer: doc.getProducer() || undefined,
        creationDate: doc.getCreationDate() ? doc.getCreationDate()?.toLocaleString() : undefined,
        modificationDate: doc.getModificationDate() ? doc.getModificationDate()?.toLocaleString() : undefined,
      });
    } catch (err) {
      alert('Unable to parse PDF metadata: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <FileSearch size={24} />
          </div>
          <span className="tool-dropzone-text">Upload PDF Document</span>
          <span className="tool-dropzone-hint">Extract embedded document properties, author, and revision stamps</span>
        </label>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <div className="loading-ring" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--color-text-muted)' }}>Reading PDF internal structures...</p>
        </div>
      )}

      {meta && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <FileText size={22} color="var(--color-primary)" />
              <strong style={{ fontSize: '1.1rem' }}>{meta.name}</strong>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {formatBytes(meta.size)}
            </span>
          </div>

          <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{meta.pageCount}</div>
              <div className="tool-stat-label">Total Pages</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value" style={{ fontSize: '1.1rem' }}>{meta.author || 'Not specified'}</div>
              <div className="tool-stat-label">Author</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value" style={{ fontSize: '1.1rem' }}>{meta.creator || 'Standard'}</div>
              <div className="tool-stat-label">Software / Creator</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Document Metadata Dictionary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
              <div>Title: <strong>{meta.title || 'Untitled'}</strong></div>
              <div>Subject: <strong>{meta.subject || 'None'}</strong></div>
              <div>Producer: <strong>{meta.producer || 'Unknown'}</strong></div>
              <div>Created: <strong>{meta.creationDate || 'Unknown'}</strong></div>
              <div>Modified: <strong>{meta.modificationDate || 'Unknown'}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
