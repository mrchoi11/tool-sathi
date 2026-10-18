import React, { useState } from 'react';
import { Upload, Share2, Download, Check } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

interface Preset {
  id: string;
  platform: string;
  name: string;
  width: number;
  height: number;
}

const SOCIAL_PRESETS: Preset[] = [
  { id: 'ig-sq', platform: 'Instagram', name: 'Square Post', width: 1080, height: 1080 },
  { id: 'ig-story', platform: 'Instagram', name: 'Story / Reel', width: 1080, height: 1920 },
  { id: 'ig-port', platform: 'Instagram', name: 'Portrait Post', width: 1080, height: 1350 },
  { id: 'yt-thumb', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720 },
  { id: 'yt-banner', platform: 'YouTube', name: 'Channel Banner', width: 2560, height: 1440 },
  { id: 'x-post', platform: 'X / Twitter', name: 'In-Stream Photo', width: 1600, height: 900 },
  { id: 'x-header', platform: 'X / Twitter', name: 'Header Banner', width: 1500, height: 500 },
  { id: 'fb-post', platform: 'Facebook', name: 'Landscape Post', width: 1200, height: 630 },
  { id: 'li-post', platform: 'LinkedIn', name: 'Shared Image', width: 1200, height: 627 },
];

export default function SocialMediaImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset>(SOCIAL_PRESETS[0]);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      generateResize(f, selectedPreset, fitMode);
    }
  };

  const generateResize = (f: File, preset: Preset, mode: 'cover' | 'contain') => {
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a'; // dark canvas backing
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = preset.width / preset.height;

        let renderW = preset.width;
        let renderH = preset.height;
        let offsetX = 0;
        let offsetY = 0;

        if (mode === 'cover') {
          if (imgRatio > targetRatio) {
            renderW = preset.height * imgRatio;
            offsetX = (preset.width - renderW) / 2;
          } else {
            renderH = preset.width / imgRatio;
            offsetY = (preset.height - renderH) / 2;
          }
        } else {
          // contain
          if (imgRatio > targetRatio) {
            renderH = preset.width / imgRatio;
            offsetY = (preset.height - renderH) / 2;
          } else {
            renderW = preset.height * imgRatio;
            offsetX = (preset.width - renderW) / 2;
          }
        }

        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

        canvas.toBlob(blob => {
          if (blob) {
            setResizedUrl(URL.createObjectURL(blob));
          }
        }, 'image/jpeg', 0.92);
      }
      URL.revokeObjectURL(url);
    };
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    if (file) {
      generateResize(file, preset, fitMode);
    }
  };

  const handleFitModeChange = (mode: 'cover' | 'contain') => {
    setFitMode(mode);
    if (file) {
      generateResize(file, selectedPreset, mode);
    }
  };

  const handleDownload = () => {
    if (resizedUrl && file) {
      saveAs(resizedUrl, `${selectedPreset.platform.toLowerCase()}-${selectedPreset.id}-${file.name}`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        {!file ? (
          <label className="tool-dropzone">
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div className="tool-dropzone-icon">
              <Share2 size={24} />
            </div>
            <span className="tool-dropzone-text">Upload Image for Social Media</span>
            <span className="tool-dropzone-hint">Optimized templates for Instagram, YouTube, Twitter, and LinkedIn</span>
          </label>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>{file.name}</strong>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {SOCIAL_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`btn ${selectedPreset.id === preset.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    border: '1px solid var(--color-border)',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '8px 12px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: selectedPreset.id === preset.id ? '#e0e7ff' : 'var(--color-text-muted)' }}>
                      {preset.platform}
                    </span>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>{preset.name}</strong>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{preset.width} × {preset.height}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Fit mode switch */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Image Fit Mode:</span>
              <button
                type="button"
                onClick={() => handleFitModeChange('cover')}
                className={`btn btn-sm ${fitMode === 'cover' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: '1px solid var(--color-border)' }}
              >
                Cover (Fill & Crop)
              </button>
              <button
                type="button"
                onClick={() => handleFitModeChange('contain')}
                className={`btn btn-sm ${fitMode === 'contain' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: '1px solid var(--color-border)' }}
              >
                Contain (Letterbox)
              </button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!resizedUrl}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download {selectedPreset.platform} Image ({selectedPreset.width} × {selectedPreset.height})
              </button>
            </div>

            {resizedUrl && (
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <img
                  src={resizedUrl}
                  alt="Social preview"
                  style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
