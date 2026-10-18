import React, { useState } from 'react';
import { Captions, Copy, Download, Check, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

const SAMPLE_VTT = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Welcome to ToolSathi Studio.

2
00:00:04.500 --> 00:00:08.200
All your favorite browser tools, unified in one platform.`;

export default function VttToSrt() {
  const [vttInput, setVttInput] = useState<string>(SAMPLE_VTT);
  const [srtOutput, setSrtOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const convertVttToSrt = (vtt: string) => {
    // Strip WEBVTT header and replace period in timestamps with comma
    let srt = vtt.replace(/^WEBVTT[^\n]*\n+/i, '').trim();
    srt = srt.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2');
    setSrtOutput(srt);
  };

  React.useEffect(() => {
    convertVttToSrt(SAMPLE_VTT);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setVttInput(reader.result);
          convertVttToSrt(reader.result);
        }
      };
      reader.readAsText(f);
    }
  };

  const handleCopy = () => {
    if (srtOutput) {
      navigator.clipboard.writeText(srtOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (srtOutput) {
      const blob = new Blob([srtOutput], { type: 'application/x-subrip;charset=utf-8' });
      saveAs(blob, 'subtitles.srt');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>WebVTT Input</label>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> Upload .vtt File
            <input type="file" accept=".vtt,text/plain" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <textarea
          className="tool-textarea"
          value={vttInput}
          onChange={e => {
            setVttInput(e.target.value);
            convertVttToSrt(e.target.value);
          }}
          placeholder="Paste WebVTT (.vtt) subtitle lines here..."
          style={{ height: '180px', marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">SubRip (.srt) Output</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy SRT'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download .srt
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={srtOutput}
          style={{ height: '200px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
