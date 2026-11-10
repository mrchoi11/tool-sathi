import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RefreshCw, AlertCircle, Sparkles, Eye, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import './tools.css';

type BgOption = 'transparent' | 'white' | 'black' | 'custom';

interface RemovalState {
  status: 'idle' | 'loading-model' | 'processing' | 'done' | 'error';
  progress: number;
  progressMsg: string;
  errorMsg: string;
}

// Helper to downscale oversized images to save memory and processing time
function resizeImageIfNeeded(file: File, maxPx = 2000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxPx && h <= maxPx) {
        resolve(file);
        return;
      }
      const scale = Math.min(maxPx / w, maxPx / h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => (blob ? resolve(blob) : resolve(file)),
        'image/png'
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for processing.'));
    };
    img.src = url;
  });
}

// Apply chosen background to the transparent image canvas
function renderWithBackground(
  transparentImg: HTMLImageElement,
  bgColor: BgOption,
  customColor: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = transparentImg.naturalWidth || transparentImg.width;
  canvas.height = transparentImg.naturalHeight || transparentImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return transparentImg.src;

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor === 'custom' ? customColor : bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(transparentImg, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function BackgroundRemover() {
  const [state, setState] = useState<RemovalState>({
    status: 'idle',
    progress: 0,
    progressMsg: '',
    errorMsg: '',
  });

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultImgElement, setResultImgElement] = useState<HTMLImageElement | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [bgOption, setBgOption] = useState<BgOption>('transparent');
  const [customColor, setCustomColor] = useState('#ffffff');
  const [sliderPos, setSliderPos] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Clean object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  // Re-render when background option changes
  useEffect(() => {
    if (resultImgElement) {
      const dataUrl = renderWithBackground(resultImgElement, bgOption, customColor);
      setResultDataUrl(dataUrl);
    }
  }, [bgOption, customColor, resultImgElement]);

  const processFile = useCallback(async (file: File) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setState({
        status: 'error',
        progress: 0,
        progressMsg: '',
        errorMsg: 'Unsupported file format. Please upload a JPG, PNG, or WEBP image.',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setState({
        status: 'error',
        progress: 0,
        progressMsg: '',
        errorMsg: 'File is too large (maximum size is 10 MB). Please choose a smaller image.',
      });
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const objUrl = URL.createObjectURL(file);
    setOriginalFile(file);
    setOriginalUrl(objUrl);
    setResultBlob(null);
    setResultImgElement(null);
    setResultDataUrl(null);
    setSliderPos(50);

    setState({
      status: 'loading-model',
      progress: 10,
      progressMsg: 'Preparing on-device AI model...',
      errorMsg: '',
    });

    try {
      // Dynamically import @imgly/background-removal to keep initial bundle light
      const { removeBackground } = await import('@imgly/background-removal');

      setState({
        status: 'processing',
        progress: 30,
        progressMsg: 'Removing background with AI...',
        errorMsg: '',
      });

      // Resize large images first
      const preparedBlob = await resizeImageIfNeeded(file, 2000);

      // Run background removal
      const outputBlob = await removeBackground(preparedBlob, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.min(95, Math.round((current / total) * 100));
            setState(s => ({
              ...s,
              progress: pct,
              progressMsg: key.includes('fetch')
                ? `Downloading AI assets (${pct}%)...`
                : `Processing image (${pct}%)...`,
            }));
          }
        },
      });

      // Load into HTMLImageElement for canvas color operations
      const outputUrl = URL.createObjectURL(outputBlob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to render transparent output.'));
        img.src = outputUrl;
      });

      setResultBlob(outputBlob);
      setResultImgElement(img);
      const initialDataUrl = renderWithBackground(img, bgOption, customColor);
      setResultDataUrl(initialDataUrl);

      setState({
        status: 'done',
        progress: 100,
        progressMsg: '',
        errorMsg: '',
      });
    } catch (err: any) {
      console.error('Background removal error:', err);
      setState({
        status: 'error',
        progress: 0,
        progressMsg: '',
        errorMsg: err?.message || 'Failed to remove background. Please try again with a different image.',
      });
    }
  }, [bgOption, customColor, originalUrl]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files[0]) processFile(files[0]);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDownload = () => {
    if (!resultDataUrl) return;
    const a = document.createElement('a');
    a.href = resultDataUrl;
    const nameWithoutExt = originalFile?.name?.replace(/\.[^.]+$/, '') || 'image';
    a.download = `${nameWithoutExt}-no-bg.png`;
    a.click();
  };

  // Slider dragging logic
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => handleSliderMove(ev.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const onMove = (ev: TouchEvent) => handleSliderMove(ev.touches[0].clientX);
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const isLoading = state.status === 'loading-model' || state.status === 'processing';

  // Checkerboard pattern for transparent background
  const checkerboardStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
      linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
      linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: '#ffffff',
  };

  return (
    <div className="tool-container">
      {/* Privacy Notice Banner */}
      <div
        className="tool-notice glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.35rem',
          borderRadius: 'var(--radius-lg, 16px)',
          background: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
        }}
      >
        <Sparkles size={18} style={{ color: '#4f46e5', flexShrink: 0 }} />
        <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 550, lineHeight: 1.5 }}>
          <strong>100% Private & In-Browser:</strong> Your images are processed directly on your device.
          No images are uploaded to any external server. The AI model runs locally using WebAssembly.
        </span>
      </div>

      {/* Main Card Panel */}
      <div className="tool-card-panel">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />

        {!originalUrl ? (
          <div
            className={`tool-dropzone${isDragging ? ' drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="tool-dropzone-icon">
              <Upload size={30} />
            </div>
            <p className="tool-dropzone-text">Drop your image here, or click to browse</p>
            <p className="tool-dropzone-hint">Supports JPG, PNG, WEBP — up to 10 MB</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Loading / Progress State */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div className="loading-ring" style={{ margin: '0 auto 1.25rem' }} />
                <p style={{ color: '#4f46e5', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.65rem' }}>
                  {state.progressMsg}
                </p>
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    borderRadius: 99,
                    height: 10,
                    maxWidth: 420,
                    margin: '0 auto',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                      borderRadius: 99,
                      width: `${state.progress}%`,
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.65rem' }}>
                  First-time initialization downloads on-device AI weights. Subsequent runs are instant.
                </p>
              </div>
            )}

            {/* Error Message */}
            {state.status === 'error' && (
              <div
                className="tool-error-box"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  borderRadius: 'var(--radius-lg, 14px)',
                  padding: '1rem 1.25rem',
                }}
              >
                <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4, fontSize: '0.95rem' }}>
                    Processing Error
                  </p>
                  <p style={{ color: '#7f1d1d', fontSize: '0.88rem', lineHeight: 1.5 }}>{state.errorMsg}</p>
                </div>
              </div>
            )}

            {/* Before / After Comparison Slider */}
            {state.status === 'done' && originalUrl && resultDataUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p
                  style={{
                    fontWeight: 700,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                  }}
                >
                  <Eye size={16} style={{ color: '#4f46e5' }} /> Drag the slider to compare original vs result
                </p>

                <div
                  ref={sliderContainerRef}
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-lg, 16px)',
                    overflow: 'hidden',
                    cursor: 'col-resize',
                    userSelect: 'none',
                    boxShadow: '0 12px 36px rgba(99, 102, 241, 0.16)',
                    maxHeight: 520,
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  {/* Background-removed result (base layer) */}
                  <div style={{ width: '100%', position: 'relative', ...checkerboardStyle }}>
                    <img
                      src={resultDataUrl}
                      alt="Background Removed"
                      style={{ width: '100%', maxHeight: 520, objectFit: 'contain', display: 'block' }}
                    />
                  </div>

                  {/* Original image (clipped on left) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${sliderPos}%`,
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={originalUrl}
                      alt="Original"
                      style={{
                        width: `${100 / (sliderPos / 100)}%`,
                        maxWidth: 'none',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>

                  {/* Vertical divider line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${sliderPos}%`,
                      transform: 'translateX(-50%)',
                      height: '100%',
                      width: 3,
                      background: '#ffffff',
                      boxShadow: '0 0 10px rgba(0, 0, 0, 0.35)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#ffffff',
                        borderRadius: 99,
                        padding: '4px 8px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        color: '#4f46e5',
                      }}
                    >
                      <ChevronLeft size={14} />
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Badges */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 99,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Original
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(79, 70, 229, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 99,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Result
                  </span>
                </div>
              </div>
            )}

            {/* Static preview during processing */}
            {state.status !== 'done' && originalUrl && (
              <div
                style={{
                  borderRadius: 'var(--radius-lg, 16px)',
                  overflow: 'hidden',
                  maxHeight: 360,
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={originalUrl}
                  alt="Uploaded preview"
                  style={{ maxHeight: 360, width: 'auto', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Background Color Customization */}
            {state.status === 'done' && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg, 14px)',
                  background: 'rgba(79, 70, 229, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                }}
              >
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                  Choose Background:
                </span>
                {(
                  [
                    { id: 'transparent', label: 'Transparent' },
                    { id: 'white', label: 'White' },
                    { id: 'black', label: 'Black' },
                    { id: 'custom', label: 'Custom' },
                  ] as { id: BgOption; label: string }[]
                ).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBgOption(opt.id)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: 99,
                      border: bgOption === opt.id ? '2px solid #4f46e5' : '1px solid rgba(0, 0, 0, 0.15)',
                      background:
                        opt.id === 'transparent'
                          ? '#ffffff'
                          : opt.id === 'white'
                          ? '#ffffff'
                          : opt.id === 'black'
                          ? '#0f172a'
                          : customColor,
                      color: opt.id === 'black' ? '#ffffff' : '#1e293b',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: bgOption === opt.id ? '0 0 0 3px rgba(79, 70, 229, 0.22)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {bgOption === opt.id && <Check size={14} />}
                    {opt.label}
                  </button>
                ))}

                {bgOption === 'custom' && (
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    style={{
                      width: 42,
                      height: 36,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    title="Choose custom color"
                  />
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload size={16} /> Choose Another Image
              </button>

              {state.status === 'done' && (
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Download PNG
                </button>
              )}

              {(state.status === 'error' || state.status === 'done') && originalFile && (
                <button
                  className="btn btn-secondary"
                  onClick={() => processFile(originalFile)}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} /> Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="tool-card-panel" style={{ background: 'rgba(255, 255, 255, 0.65)' }}>
        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', fontSize: '1.2rem' }}>
          How It Works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              step: '1',
              title: 'Upload Your Image',
              desc: 'Select or drag any JPG, PNG, or WEBP image up to 10 MB.',
            },
            {
              step: '2',
              title: 'AI Background Removal',
              desc: 'The on-device WebAssembly model automatically isolates the subject with high precision.',
            },
            {
              step: '3',
              title: 'Download & Customize',
              desc: 'Export as transparent PNG or apply custom solid background colors instantly.',
            },
          ].map(s => (
            <div
              key={s.step}
              style={{
                textAlign: 'left',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg, 16px)',
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(99, 102, 241, 0.12)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                }}
              >
                {s.step}
              </div>
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.35rem' }}>
                {s.title}
              </p>
              <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
