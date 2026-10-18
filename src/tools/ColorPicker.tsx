import React, { useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import './tools.css';

export default function ColorPicker() {
  const [hex, setHex] = useState<string>('#6366f1');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Convert HEX to RGB
  const hexToRgb = (hexStr: string): { r: number; g: number; b: number } => {
    let clean = hexStr.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const copyVal = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedType(key);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const PALETTES = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'];

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '2px solid var(--color-border)' }}>
            <input
              type="color"
              value={hex}
              onChange={e => setHex(e.target.value)}
              style={{ position: 'absolute', inset: '-10px', width: '120px', height: '120px', cursor: 'pointer', border: 'none' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="tool-label" style={{ marginBottom: '4px' }}>Select or Type Hex Code</label>
            <input
              type="text"
              className="tool-input"
              value={hex}
              onChange={e => setHex(e.target.value)}
              style={{ fontSize: '1.1rem', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Curated Swatches */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-sm)' }}>Curated Designer Swatches</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PALETTES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setHex(p)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: p,
                  border: hex.toLowerCase() === p.toLowerCase() ? '3px solid #fff' : '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transform: hex.toLowerCase() === p.toLowerCase() ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.15s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Formats Converter Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {[
            { label: 'HEX', val: hex.toUpperCase(), key: 'hex' },
            { label: 'RGB', val: rgbString, key: 'rgb' },
            { label: 'HSL', val: hslString, key: 'hsl' },
            { label: 'CSS Variable', val: `--primary-color: ${hex};`, key: 'css' },
          ].map(item => (
            <div key={item.key} style={{ background: 'var(--color-bg)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>{item.label}</span>
                <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{item.val}</strong>
              </div>
              <button
                type="button"
                onClick={() => copyVal(item.val, item.key)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedType === item.key ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copiedType === item.key ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
