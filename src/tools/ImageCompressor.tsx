import React, { useState, useRef, useCallback } from 'react';
import { Upload, ImageDown, Download, Check, RefreshCw, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { saveAs } from 'file-saver';
import imageCompression from 'browser-image-compression';
import './tools.css';

export default function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Compression options matching user architecture
  const [maxSizeMB, setMaxSizeMB] = useState<number>(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState<number>(1920);
  const [useWebWorker, setUseWebWorker] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'original' | 'image/jpeg' | 'image/webp'>('original');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper compression function using browser-image-compression (NPM or CDN fallback)
  const runCompression = useCallback(async (
    file: File,
    targetSizeMB: number,
    dimensionLimit: number,
    workerFlag: boolean,
    fmt: 'original' | 'image/jpeg' | 'image/webp'
  ) => {
    setIsProcessing(true);
    setProgress(5);
    setErrorMessage(null);

    const options: any = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: dimensionLimit,
      useWebWorker: workerFlag,
      onProgress: (pct: number) => setProgress(Math.min(95, Math.max(10, Math.round(pct))))
    };

    if (fmt !== 'original') {
      options.fileType = fmt;
    }

    try {
      // Use imported library or global CDN window.imageCompression
      const compressorFn: any = (typeof imageCompression === 'function' ? imageCompression : (imageCompression as any)?.default || window.imageCompression);
      if (!compressorFn) {
        throw new Error('Image compression engine could not be initialized.');
      }

      const result: File = await compressorFn(file, options);
      setProgress(100);

      const downloadUrl = URL.createObjectURL(result);
      setCompressedFile(result);
      setCompressedUrl(downloadUrl);
      setCompressedSize(result.size);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Compression failed:', err);
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Compression failed. Please try a different image or format.');
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setErrorMessage(null);
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    runCompression(file, maxSizeMB, maxWidthOrHeight, useWebWorker, outputFormat);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleApplySettings = () => {
    if (originalFile) {
      runCompression(originalFile, maxSizeMB, maxWidthOrHeight, useWebWorker, outputFormat);
    }
  };

  const handleDownload = () => {
    if (compressedUrl && originalFile) {
      const ext = outputFormat === 'image/webp'
        ? 'webp'
        : outputFormat === 'image/jpeg'
        ? 'jpg'
        : originalFile.name.split('.').pop() || 'jpg';
      
      const rawBase = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
      const downloadFilename = `compressed-${rawBase}.${ext}`;
      saveAs(compressedUrl, downloadFilename);
    }
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setOriginalFile(null);
    setOriginalUrl(null);
    setCompressedFile(null);
    setCompressedUrl(null);
    setCompressedSize(null);
    setErrorMessage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savingsPct = originalFile && compressedSize
    ? Math.max(0, Math.round(((originalFile.size - compressedSize) / originalFile.size) * 100))
    : 0;

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            marginBottom: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {!originalFile ? (
          <label
            htmlFor="imageInput"
            className={`tool-dropzone ${isDragging ? 'tool-dropzone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              borderColor: isDragging ? 'var(--color-primary)' : undefined,
              backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : undefined
            }}
          >
            <input
              id="imageInput"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            <div className="tool-dropzone-icon">
              <ImageDown size={28} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Compress</span>
            <span className="tool-dropzone-hint">
              Drag & drop or click to browse. Processed 100% locally on your device via Web Workers.
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="format-tag">Fast Browser Compression</span>
              <span className="format-tag">No Server Uploads</span>
              <span className="format-tag">Zero File Size Limit</span>
            </div>
          </label>
        ) : (
          <div>
            {/* Header with image name & switch button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-xl)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block' }}>{originalFile.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Original Size: <strong>{formatBytes(originalFile.size)}</strong> ({originalFile.type || 'image'})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} /> New Image
                </button>
              </div>
            </div>

            {/* Compression Options Controls */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--space-md)',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}>
                <Sliders size={18} style={{ color: 'var(--color-primary)' }} />
                <span>Compression Parameters</span>
              </div>

              <div className="tool-form-grid">
                {/* Max Target Size */}
                <div className="tool-field">
                  <label className="tool-label">
                    Max Target Size: <strong>{maxSizeMB} MB</strong>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[0.2, 0.5, 1, 2, 5].map(mb => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => { setMaxSizeMB(mb); }}
                        className={`btn btn-sm ${maxSizeMB === mb ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ border: '1px solid var(--color-border)' }}
                      >
                        {mb < 1 ? `${mb * 1000} KB` : `${mb} MB`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Dimension */}
                <div className="tool-field">
                  <label className="tool-label">Max Width / Height</label>
                  <select
                    className="tool-select"
                    value={maxWidthOrHeight}
                    onChange={e => setMaxWidthOrHeight(parseInt(e.target.value, 10))}
                  >
                    <option value={1280}>1280 px (HD - Compact)</option>
                    <option value={1920}>1920 px (Full HD - Recommended)</option>
                    <option value={2560}>2560 px (2K - High Quality)</option>
                    <option value={3840}>3840 px (4K - Ultra)</option>
                  </select>
                </div>

                {/* Output Format */}
                <div className="tool-field">
                  <label className="tool-label">Output Format</label>
                  <select
                    className="tool-select"
                    value={outputFormat}
                    onChange={e => setOutputFormat(e.target.value as any)}
                  >
                    <option value="original">Keep Original Format</option>
                    <option value="image/webp">WebP (Maximum Compression)</option>
                    <option value="image/jpeg">JPG / JPEG (Universal Compatibility)</option>
                  </select>
                </div>

                {/* Web Worker toggle */}
                <div className="tool-field" style={{ justifyContent: 'center' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    height: '100%'
                  }}>
                    <input
                      type="checkbox"
                      checked={useWebWorker}
                      onChange={e => setUseWebWorker(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <span>Enable Multi-Thread WebWorker (Smooth UI)</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleApplySettings}
                  disabled={isProcessing}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={14} /> Re-compress with Settings
                </button>
              </div>
            </div>

            {/* Progress / Loading Indicator */}
            {isProcessing && (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-xl)',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                marginBottom: 'var(--space-xl)'
              }}>
                <div className="loading-ring" style={{ margin: '0 auto 12px auto' }}></div>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Compressing image client-side...</strong>
                <div style={{
                  width: '100%',
                  maxWidth: '320px',
                  height: '8px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-primary)',
                    transition: 'width 0.2s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                  {progress}% complete
                </span>
              </div>
            )}

            {/* Comparison Stats */}
            {!isProcessing && compressedSize !== null && (
              <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{formatBytes(originalFile.size)}</div>
                  <div className="tool-stat-label">Original File Size</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: '#10b981' }}>{formatBytes(compressedSize)}</div>
                  <div className="tool-stat-label">Compressed File Size</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: 'var(--color-accent)' }}>
                    {savingsPct > 0 ? `-${savingsPct}%` : 'Optimal'}
                  </div>
                  <div className="tool-stat-label">Space Saved</div>
                </div>
              </div>
            )}

            {/* Download Action Bar */}
            {!isProcessing && compressedUrl && (
              <div style={{
                display: 'flex',
                gap: 'var(--space-md)',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-xl)'
              }}>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '12px 24px' }}
                >
                  <Download size={18} /> Download Compressed Image
                </button>
                <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> Compression completed successfully
                </span>
              </div>
            )}

            {/* Side-by-side or Preview Card */}
            {compressedUrl && !isProcessing && (
              <div style={{
                marginTop: 'var(--space-xl)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-lg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Compressed Image Preview</span>
                  <a
                    href={compressedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Open Full Size
                  </a>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'repeating-conic-gradient(#80808018 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-lg)',
                  border: '1px solid var(--color-border)',
                  maxHeight: '480px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={compressedUrl}
                    alt="Compressed result"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '440px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'contain',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
