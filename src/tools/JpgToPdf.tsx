import React, { useState } from 'react';
import { Upload, FileUp, Image, Trash2, ArrowUp, ArrowDown, Download, Check } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import './tools.css';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function JpgToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'fit'>('fit');
  const [isConverting, setIsConverting] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems: ImageItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newItems]);
    setPdfBlob(null);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setPdfBlob(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const arrayBuffer = await item.file.arrayBuffer();
        let embeddedImage;

        if (item.file.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(arrayBuffer);
        } else {
          // Default treat as JPG
          embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let page;
        if (pageSize === 'A4') {
          // A4 dimensions: 595.28 x 841.89 points
          page = pdfDoc.addPage([595.28, 841.89]);
          const scale = Math.min(555 / imgWidth, 800 / imgHeight);
          const scaledW = imgWidth * scale;
          const scaledH = imgHeight * scale;
          const x = (595.28 - scaledW) / 2;
          const y = (841.89 - scaledH) / 2;
          page.drawImage(embeddedImage, { x, y, width: scaledW, height: scaledH });
        } else {
          // Fit page to exact image size
          page = pdfDoc.addPage([imgWidth, imgHeight]);
          page.drawImage(embeddedImage, { x: 0, y: 0, width: imgWidth, height: imgHeight });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setPdfBlob(blob);
    } catch (err) {
      alert('Error creating PDF: ' + (err as Error).message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      saveAs(pdfBlob, 'converted_images.pdf');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <FileUp size={24} />
          </div>
          <span className="tool-dropzone-text">Add Images to Convert to PDF</span>
          <span className="tool-dropzone-hint">Supports JPG, PNG, and WebP (reorder before converting)</span>
        </label>
      </div>

      {images.length > 0 && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
            <span className="tool-result-title">Selected Images ({images.length})</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImages([])}>
              Clear All
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            {images.map((img, idx) => (
              <div key={img.id} className="card" style={{ padding: '6px', position: 'relative' }}>
                <img
                  src={img.previewUrl}
                  alt={img.file.name}
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                  title="Remove image"
                >
                  <Trash2 size={12} />
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {idx + 1}. {img.file.name}
                </span>
              </div>
            ))}
          </div>

          <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="tool-field">
              <label className="tool-label">PDF Page Layout</label>
              <select className="tool-select" value={pageSize} onChange={e => setPageSize(e.target.value as any)}>
                <option value="fit">Fit to Image Size (Preserve dimensions)</option>
                <option value="A4">Standard A4 Document (Centered with margins)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FileUp size={16} /> {isConverting ? 'Generating PDF...' : `Generate PDF (${images.length} Pages)`}
            </button>

            {pdfBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff' }}
              >
                <Download size={16} /> Download Resulting PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
