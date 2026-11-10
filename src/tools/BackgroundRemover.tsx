import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RefreshCw, AlertCircle, Sparkles, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import './tools.css';

type BgOption = 'transparent' | 'white' | 'black' | 'custom';

interface RemovalState {
  status: 'idle' | 'loading-model' | 'processing' | 'done' | 'error';
  progress: number;
  progressMsg: string;
  errorMsg: string;
}

function resizeImageIfNeeded(file: File, maxPx = 2000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxPx && h <= maxPx) { resolve(file); return; }
      const scale = Math.min(maxPx / w, maxPx / h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function applyBackgroundColor(
  resultCanvas: HTMLCanvasElement,
  bgColor: BgOption,
  customColor: string
): string {
  const out = document.createElement('canvas');
  out.width = resultCanvas.width;
  out.height = resultCanvas.height;
  const ctx = out.getContext('2d')!;
  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor === 'custom' ? customColor : bgColor;
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(resultCanvas, 0, 0);
  return out.toDataURL('image/png');
}

export default function BackgroundRemover() {
  const [state, setState] = useState<RemovalState>({
    status: 'idle', progress: 0, progressMsg: '', errorMsg: ''
  });
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [resultCanvas, setResultCanvas] = useState<HTMLCanvasElement | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bgOption, setBgOption] = useState<BgOption>('transparent');
  const [customColor, setCustomColor] = useState('#ffffff');
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<any>(null);

  const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  // Update result preview when bg changes
  useEffect(() => {
    if (resultCanvas) {
      setResultDataUrl(applyBackgroundColor(resultCanvas, bgOption, customColor));
    }
  }, [bgOption, customColor, resultCanvas]);

  const processFile = useCallback(async (file: File) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setState({ status: 'error', progress: 0, progressMsg: '', errorMsg: 'Unsupported format. Please upload JPG, PNG, or WEBP.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setState({ status: 'error', progress: 0, progressMsg: '', errorMsg: 'File too large (max 10MB). Please choose a smaller image.' });
      return;
    }
    if (!('OffscreenCanvas' in window || 'createImageBitmap' in window)) {
      setState({ status: 'error', progress: 0, progressMsg: '', errorMsg: 'Your browser may not support this tool. Please use Chrome, Edge, or Firefox.' });
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const objUrl = URL.createObjectURL(file);
    setOriginalFile(file);
    setOriginalUrl(objUrl);
    setResultCanvas(null);
    setResultDataUrl(null);
    setSliderPos(50);

    try {
      // Load model if not already loaded
      if (!pipelineRef.current) {
        setState({ status: 'loading-model', progress: 5, progressMsg: 'Pehli baar model load ho raha hai, thoda time lag sakta hai...', errorMsg: '' });
        const { pipeline, env } = await import('@huggingface/transformers');
        // Use local cache for Hostinger (no CDN needed after first visit)
        env.allowLocalModels = false;
        const pipe = await pipeline('image-segmentation', 'Xenova/segformer-b2-clothes', {
          progress_callback: (p: any) => {
            if (p.status === 'progress' && p.total) {
              const pct = Math.round((p.loaded / p.total) * 40);
              setState(s => ({ ...s, progress: 5 + pct, progressMsg: `Model download: ${Math.round((p.loaded / p.total) * 100)}%` }));
            }
          }
        });
        pipelineRef.current = pipe;
      }

      setState({ status: 'processing', progress: 50, progressMsg: 'Background remove ho raha hai...', errorMsg: '' });

      // Resize if needed
      const resized = await resizeImageIfNeeded(file, 2000);
      const resizedFile = new File([resized], file.name, { type: 'image/png' });

      // Run segmentation — returns array of { label, mask, score }
      setState(s => ({ ...s, progress: 60, progressMsg: 'AI processing...' }));
      const result = await pipelineRef.current(URL.createObjectURL(resizedFile));

      setState(s => ({ ...s, progress: 85, progressMsg: 'Result taiyaar ho raha hai...' }));

      // Find background mask (label = 'Background' or use inverse of all foreground)
      let bgMask: { data: Uint8ClampedArray; width: number; height: number } | null = null;
      for (const seg of result) {
        if (seg.label?.toLowerCase() === 'background') {
          bgMask = seg.mask;
          break;
        }
      }

      // If no explicit background label, invert union of all foreground masks
      if (!bgMask && result.length > 0) {
        const first = result[0].mask;
        const combined = new Uint8ClampedArray(first.data.length).fill(255);
        for (const seg of result) {
          for (let i = 0; i < seg.mask.data.length; i++) {
            if (seg.mask.data[i] > 128) combined[i] = 0;
          }
        }
        bgMask = { data: combined, width: first.width, height: first.height };
      }

      if (!bgMask) throw new Error('Could not get segmentation mask');

      // Draw result with transparent background
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = URL.createObjectURL(resizedFile);
      });

      const canvas = document.createElement('canvas');
      canvas.width = bgMask.width;
      canvas.height = bgMask.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const maskData = bgMask.data;

      // Apply mask: set alpha=0 where background (mask=255 means background)
      for (let i = 0; i < maskData.length; i++) {
        const alpha = maskData[i] > 128 ? 0 : 255;
        imgData.data[i * 4 + 3] = alpha;
      }
      ctx.putImageData(imgData, 0, 0);

      setResultCanvas(canvas);
      setResultDataUrl(applyBackgroundColor(canvas, bgOption, customColor));
      setState({ status: 'done', progress: 100, progressMsg: '', errorMsg: '' });

    } catch (err: any) {
      console.error('Background removal error:', err);
      setState({
        status: 'error', progress: 0, progressMsg: '',
        errorMsg: err.message?.includes('fetch') || err.message?.includes('network')
          ? 'Model load nahi hua. Internet connection check karein aur dobara try karein.'
          : `Processing error: ${err.message || 'Unknown error'}`
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
    if (!resultCanvas) return;
    const dataUrl = applyBackgroundColor(resultCanvas, bgOption, customColor);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `bg-removed-${originalFile?.name?.replace(/\.[^.]+$/, '') || 'image'}.png`;
    a.click();
  };

  // Before/after slider logic
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSlider(true);
    const onMove = (ev: MouseEvent) => handleSliderMove(ev.clientX);
    const onUp = () => { setIsDraggingSlider(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    setIsDraggingSlider(true);
    const onMove = (ev: TouchEvent) => handleSliderMove(ev.touches[0].clientX);
    const onEnd = () => { setIsDraggingSlider(false); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const isLoading = state.status === 'loading-model' || state.status === 'processing';

  // Checkerboard for transparency display
  const checkerboardStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: '#f0f0f0',
  };

  return (
    <div className="tool-container">

      {/* Privacy notice */}
      <div className="tool-notice glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.18)' }}>
        <Sparkles size={16} style={{ color: '#4f46e5', flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
          🔒 Privacy: Aapki image server par upload nahi hoti — sab kuch aapke device ke browser mein hota hai.
          Pehli baar model download hoga (~40MB), uske baad offline bhi kaam karega.
        </span>
      </div>

      {/* Upload panel */}
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
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="tool-dropzone-icon">
              <Upload size={28} />
            </div>
            <p className="tool-dropzone-text">Image yahan drop karein ya click karein</p>
            <p className="tool-dropzone-hint">JPG, PNG, WEBP — max 10MB</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Progress / Status */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div className="loading-ring" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#4f46e5', fontWeight: 600, marginBottom: '0.5rem' }}>{state.progressMsg}</p>
                <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: 99, width: `${state.progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Aapki image device se bahar nahi ja rahi</p>
              </div>
            )}

            {/* Error */}
            {state.status === 'error' && (
              <div className="tool-error-box" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
                <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Error</p>
                  <p style={{ color: '#7f1d1d', fontSize: '0.9rem' }}>{state.errorMsg}</p>
                </div>
              </div>
            )}

            {/* Before/After slider */}
            {state.status === 'done' && originalUrl && resultDataUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Eye size={16} /> Before / After — slider drag karein
                </p>
                <div
                  ref={sliderContainerRef}
                  style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'col-resize', userSelect: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.14)' }}
                  onMouseDown={handleSliderMouseDown}
                  onTouchStart={handleSliderTouchStart}
                >
                  {/* Result (right/bottom) */}
                  <div style={{ width: '100%', position: 'relative', ...checkerboardStyle }}>
                    <img src={resultDataUrl} alt="Background removed" style={{ width: '100%', display: 'block' }} />
                  </div>
                  {/* Original (left clip) */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: `${sliderPos}%`, height: '100%', overflow: 'hidden' }}>
                    <img src={originalUrl} alt="Original" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none', display: 'block', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {/* Divider */}
                  <div style={{ position: 'absolute', top: 0, left: `${sliderPos}%`, transform: 'translateX(-50%)', height: '100%', width: 3, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.3)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 99, padding: '4px 8px', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'flex', gap: 4 }}>
                      <ChevronLeft size={14} /><ChevronRight size={14} />
                    </div>
                  </div>
                  {/* Labels */}
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>Original</span>
                  <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(79,70,229,0.75)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>Result</span>
                </div>
              </div>
            )}

            {/* Just original preview while processing */}
            {state.status !== 'done' && originalUrl && (
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxHeight: 320 }}>
                <img src={originalUrl} alt="Uploaded" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', background: '#f8fafc' }} />
              </div>
            )}

            {/* Background color picker (only when done) */}
            {state.status === 'done' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Background:</span>
                {(['transparent', 'white', 'black', 'custom'] as BgOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setBgOption(opt)}
                    style={{
                      padding: '0.35rem 0.9rem',
                      borderRadius: 99,
                      border: bgOption === opt ? '2px solid #4f46e5' : '1px solid rgba(0,0,0,0.15)',
                      background: opt === 'transparent' ? 'linear-gradient(135deg,#ccc 25%,transparent 25%,-25%,#ccc 75%,transparent 75%)' : opt === 'custom' ? customColor : opt,
                      color: opt === 'black' ? '#fff' : opt === 'transparent' ? '#334155' : '#1e293b',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: bgOption === opt ? '0 0 0 3px rgba(79,70,229,0.2)' : 'none',
                    }}
                  >
                    {opt === 'transparent' ? '⬜ Transparent' : opt === 'white' ? '⬜ White' : opt === 'black' ? '⬛ Black' : '🎨 Custom'}
                  </button>
                ))}
                {bgOption === 'custom' && (
                  <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
                    style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { fileInputRef.current?.click(); }}
                disabled={isLoading}
              >
                <Upload size={16} /> New Image
              </button>
              {state.status === 'done' && (
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Download PNG
                </button>
              )}
              {(state.status === 'error' || state.status === 'done') && originalFile && (
                <button className="btn btn-secondary" onClick={() => { pipelineRef.current && processFile(originalFile); }} disabled={isLoading}>
                  <RefreshCw size={16} /> Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="tool-card-panel" style={{ background: 'rgba(255,255,255,0.5)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem', fontSize: '1.1rem' }}>Kaise kaam karta hai?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { n: '1', t: 'Image upload karein', d: 'JPG, PNG ya WEBP — max 10MB' },
            { n: '2', t: 'AI process karta hai', d: 'On-device ML model background detect karta hai' },
            { n: '3', t: 'Download karein', d: 'Transparent PNG ya koi bhi background color ke saath' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontSize: '1rem' }}>{s.n}</div>
              <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{s.t}</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

