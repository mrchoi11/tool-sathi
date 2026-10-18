import React, { useState } from 'react';
import { Upload, RotateCcw, RotateCw, FileText, Download, Check } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import './tools.css';

export default function PdfRotation() {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotatedBlob, setRotatedBlob] = useState<Blob | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setRotatedBlob(null);
    }
  };

  const handleRotate = async () => {
    if (!file) return;
    setIsRotating(true);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationAngle) % 360));
      });

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes as any], { type: 'application/pdf' });
      setRotatedBlob(blob);
    } catch (err) {
      alert('Error rotating PDF pages: ' + (err as Error).message);
    } finally {
      setIsRotating(false);
    }
  };

  const handleDownload = () => {
    if (rotatedBlob && file) {
      saveAs(rotatedBlob, `rotated_${rotationAngle}deg_${file.name}`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <RotateCw size={24} />
            </div>
            <span className="tool-dropzone-text">Upload PDF Document to Rotate</span>
            <span className="tool-dropzone-hint">Change page orientation by 90°, 180°, or 270°</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <FileText size={24} color="var(--color-primary)" />
                <strong style={{ fontSize: '1.05rem' }}>{file.name}</strong>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label className="tool-label" style={{ marginBottom: 'var(--space-sm)' }}>Rotation Direction</label>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                {[
                  { angle: 90, label: '90° Clockwise' },
                  { angle: 180, label: '180° Flip' },
                  { angle: 270, label: '90° Counter-Clockwise' },
                ].map(r => (
                  <button
                    key={r.angle}
                    type="button"
                    onClick={() => {
                      setRotationAngle(r.angle);
                      setRotatedBlob(null);
                    }}
                    className={`btn ${rotationAngle === r.angle ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleRotate}
                disabled={isRotating}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <RotateCw size={16} /> {isRotating ? 'Rotating Pages...' : `Rotate PDF by ${rotationAngle}°`}
              </button>

              {rotatedBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-success"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff' }}
                >
                  <Download size={16} /> Download Rotated PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
