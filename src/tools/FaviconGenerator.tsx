import React, { useState } from 'react';
import { Upload, Globe, Download, Check } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './tools.css';

const FAVICON_SIZES = [16, 32, 48, 64, 128, 192];

export default function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [generatedIcons, setGeneratedIcons] = useState<{ size: number; dataUrl: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    generateFavicons(f);
  };

  const generateFavicons = (f: File) => {
    setIsGenerating(true);
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.src = url;

    img.onload = () => {
      const results: { size: number; dataUrl: string }[] = [];

      FAVICON_SIZES.forEach(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, size, size);
          results.push({
            size,
            dataUrl: canvas.toDataURL('image/png')
          });
        }
      });

      setGeneratedIcons(results);
      setIsGenerating(false);
      URL.revokeObjectURL(url);
    };
  };

  const downloadSingle = (dataUrl: string, size: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `favicon-${size}x${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadZip = async () => {
    if (generatedIcons.length === 0) return;
    const zip = new JSZip();

    for (const icon of generatedIcons) {
      const base64Data = icon.dataUrl.split(',')[1];
      zip.file(`favicon-${icon.size}x${icon.size}.png`, base64Data, { base64: true });
    }

    // Include sample HTML snippet
    const htmlSnippet = `<!-- ToolSathi Favicon Package -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-192x192.png">`;
    zip.file('README-html-tags.txt', htmlSnippet);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'favicons_package.zip');
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <Globe size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Logo or Image</span>
            <span className="tool-dropzone-hint">Generates standard web favicons (16x16 up to 192x192 PNG package)</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file.name}</strong>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={downloadZip}
                disabled={generatedIcons.length === 0}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download All Favicons (.ZIP)
              </button>
            </div>
          </div>
        )}
      </div>

      {generatedIcons.length > 0 && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <span className="tool-result-title">Generated Icons</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-md)' }}>
            {generatedIcons.map(icon => (
              <div key={icon.size} className="card" style={{ padding: 'var(--space-md)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <img src={icon.dataUrl} alt={`${icon.size}px icon`} style={{ width: `${Math.min(icon.size, 40)}px`, height: `${Math.min(icon.size, 40)}px` }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{icon.size} × {icon.size}</span>
                <button
                  type="button"
                  onClick={() => downloadSingle(icon.dataUrl, icon.size)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
