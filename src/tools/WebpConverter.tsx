import React, { useState, useRef } from 'react';
import { Upload, ArrowRightLeft, Download, Check, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

export default function WebpConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exact HTML5 Canvas conversion logic requested by user
  const convertToWebP = (imageFile: File, q: number) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        try {
          setImageDimensions({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });

          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Canvas 2D context is not available');
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            function (blob) {
              if (blob) {
                const webpUrl = URL.createObjectURL(blob);
                setConvertedUrl(webpUrl);
                setConvertedSize(blob.size);
                setIsProcessing(false);
              } else {
                setIsProcessing(false);
                setErrorMessage('Browser failed to generate WebP blob. Your browser might not support WebP canvas export.');
              }
            },
            'image/webp',
            q
          );
        } catch (err: any) {
          setIsProcessing(false);
          setErrorMessage('Conversion error: ' + (err?.message || 'Failed to process canvas.'));
        }
      };

      img.onerror = function () {
        setIsProcessing(false);
        setErrorMessage('Failed to decode image file. Please ensure it is a valid JPG, PNG, or GIF.');
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = function () {
      setIsProcessing(false);
      setErrorMessage('Failed to read file from disk.');
    };

    reader.readAsDataURL(imageFile);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP, SVG).');
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setSourceUrl(url);

    convertToWebP(selectedFile, quality);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
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
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (file) {
      convertToWebP(file, newQ);
    }
  };

  const handleDownload = () => {
    if (convertedUrl && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const downloadFilename = `${baseName}.webp`;
      saveAs(convertedUrl, downloadFilename);
    }
  };

  const handleReset = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setFile(null);
    setSourceUrl(null);
    setConvertedUrl(null);
    setConvertedSize(null);
    setImageDimensions(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savingsPct = file && convertedSize
    ? Math.round(((file.size - convertedSize) / file.size) * 100)
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

        {!file ? (
          <label
            htmlFor="webpInput"
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
              id="webpInput"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            <div className="tool-dropzone-icon">
              <ArrowRightLeft size={28} />
            </div>
            <span className="tool-dropzone-text">Upload Image to Convert to WebP</span>
            <span className="tool-dropzone-hint">
              Converts JPG, PNG, GIF, BMP, or SVG to modern WebP format instantly in your browser via HTML5 Canvas.
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="format-tag">Fast Client-Side</span>
              <span className="format-tag">Transparent PNG Support</span>
              <span className="format-tag">100% Private</span>
            </div>
          </label>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-xl)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block' }}>{file.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Original: {formatBytes(file.size)} ({file.type || 'image'})
                  {imageDimensions && ` • ${imageDimensions.width} × ${imageDimensions.height} px`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Convert Another
              </button>
            </div>

            {/* Quality & Canvas Controls */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)'
              }}>
                <label className="tool-label" style={{ marginBottom: 0 }}>
                  WebP Compression Quality: <strong>{Math.round(quality * 100)}%</strong>
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {quality >= 0.85 ? 'High Quality (Lossless-like)' : quality >= 0.65 ? 'Balanced (Recommended)' : 'Smallest File Size'}
                </span>
              </div>

              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={e => handleQualityChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginTop: '4px'
              }}>
                <span>10% (Low)</span>
                <span>80% (Default)</span>
                <span>100% (Maximum)</span>
              </div>
            </div>

            {/* Loading Indicator */}
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
                <strong>Drawing on canvas & encoding to WebP...</strong>
              </div>
            )}

            {/* Conversion Stats */}
            {!isProcessing && convertedSize !== null && (
              <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="tool-stat-card">
                  <div className="tool-stat-value">{formatBytes(file.size)}</div>
                  <div className="tool-stat-label">Original ({file.type?.split('/')[1]?.toUpperCase() || 'Input'})</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: '#10b981' }}>{formatBytes(convertedSize)}</div>
                  <div className="tool-stat-label">WebP Output</div>
                </div>
                <div className="tool-stat-card">
                  <div className="tool-stat-value" style={{ color: savingsPct > 0 ? 'var(--color-accent)' : '#10b981' }}>
                    {savingsPct > 0 ? `-${savingsPct}%` : 'Optimized'}
                  </div>
                  <div className="tool-stat-label">Size Change</div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            {!isProcessing && convertedUrl && (
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
                  <Download size={18} /> Download converted-image.webp
                </button>
                <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> WebP conversion complete
                </span>
              </div>
            )}

            {/* Preview Output */}
            {convertedUrl && !isProcessing && (
              <div style={{
                marginTop: 'var(--space-xl)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-lg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>WebP Converted Preview</span>
                  <a
                    href={convertedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Open in New Tab
                  </a>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'repeating-conic-gradient(#80808018 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-lg)',
                  border: '1px solid var(--color-border)',
                  maxHeight: '460px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={convertedUrl}
                    alt="WebP converted result"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '420px',
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
