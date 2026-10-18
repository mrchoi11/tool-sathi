import React, { useState } from 'react';
import { Clock, Download, Copy, Check, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

const SAMPLE_SUBTITLE = `1
00:01:20,000 --> 00:01:24,000
Audio and video are slightly out of sync.

2
00:01:24,500 --> 00:01:28,000
Shift subtitle timestamps effortlessly.`;

export default function SubtitleTimestampShifter() {
  const [subText, setSubText] = useState<string>(SAMPLE_SUBTITLE);
  const [offsetMs, setOffsetMs] = useState<number>(1500); // 1.5s
  const [shiftedOutput, setShiftedOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Time format helper (hh:mm:ss,ms or hh:mm:ss.ms)
  const shiftTimestamp = (timeStr: string, deltaMs: number, delimiter: string): string => {
    const parts = timeStr.split(/[:.,]/);
    if (parts.length < 4) return timeStr;

    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const s = parseInt(parts[2]);
    const ms = parseInt(parts[3]);

    let totalMs = (h * 3600 + m * 60 + s) * 1000 + ms + deltaMs;
    if (totalMs < 0) totalMs = 0;

    const newH = Math.floor(totalMs / 3600000);
    totalMs %= 3600000;
    const newM = Math.floor(totalMs / 60000);
    totalMs %= 60000;
    const newS = Math.floor(totalMs / 1000);
    const newMs = totalMs % 1000;

    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    return `${pad(newH)}:${pad(newM)}:${pad(newS)}${delimiter}${pad(newMs, 3)}`;
  };

  const applyShift = (text: string, delta: number) => {
    // Matches 00:00:00,000 or 00:00:00.000
    const result = text.replace(
      /(\d{2}:\d{2}:\d{2}(?:[.,]\d{3}))\s+-->\s+(\d{2}:\d{2}:\d{2}(?:[.,]\d{3}))/g,
      (_, start, end) => {
        const startDelim = start.includes(',') ? ',' : '.';
        const endDelim = end.includes(',') ? ',' : '.';
        const newStart = shiftTimestamp(start, delta, startDelim);
        const newEnd = shiftTimestamp(end, delta, endDelim);
        return `${newStart} --> ${newEnd}`;
      }
    );
    setShiftedOutput(result);
  };

  React.useEffect(() => {
    applyShift(SAMPLE_SUBTITLE, offsetMs);
  }, []);

  const handleOffsetChange = (val: number) => {
    setOffsetMs(val);
    applyShift(subText, val);
  };

  const handleCopy = () => {
    if (shiftedOutput) {
      navigator.clipboard.writeText(shiftedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (shiftedOutput) {
      const isVtt = subText.includes('WEBVTT');
      const blob = new Blob([shiftedOutput], { type: isVtt ? 'text/vtt' : 'application/x-subrip' });
      saveAs(blob, `synced_subtitles.${isVtt ? 'vtt' : 'srt'}`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-field">
            <label className="tool-label">Offset in Milliseconds ({offsetMs > 0 ? `+${offsetMs}` : offsetMs} ms)</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                type="number"
                step="100"
                value={offsetMs}
                onChange={e => handleOffsetChange(parseInt(e.target.value) || 0)}
                className="tool-input"
              />
              <button type="button" onClick={() => handleOffsetChange(offsetMs - 500)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)' }}>
                -500ms
              </button>
              <button type="button" onClick={() => handleOffsetChange(offsetMs + 500)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)' }}>
                +500ms
              </button>
            </div>
          </div>
        </div>

        <label className="tool-label" style={{ marginBottom: 'var(--space-xs)' }}>Subtitle Source (SRT or VTT)</label>
        <textarea
          className="tool-textarea"
          value={subText}
          onChange={e => {
            setSubText(e.target.value);
            applyShift(e.target.value, offsetMs);
          }}
          placeholder="Paste subtitle content here..."
          style={{ height: '160px', marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Synchronized Subtitle Result</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download File
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={shiftedOutput}
          style={{ height: '180px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
