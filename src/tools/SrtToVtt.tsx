import React, { useState } from 'react';
import { Captions, Copy, Download, Check, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';
import './tools.css';

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,000
Welcome to ToolSathi Studio.

2
00:00:04,500 --> 00:00:08,200
All your favorite browser tools, unified in one platform.`;

export default function SrtToVtt() {
  const [srtInput, setSrtInput] = useState<string>(SAMPLE_SRT);
  const [vttOutput, setVttOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const convertSrtToVtt = (srt: string) => {
    // VTT requires 'WEBVTT' header and period instead of comma in timestamps: 00:00:01.000
    let vtt = 'WEBVTT\n\n' + srt.trim();
    // Replace 00:00:00,000 with 00:00:00.000
    vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    setVttOutput(vtt);
  };

  React.useEffect(() => {
    convertSrtToVtt(SAMPLE_SRT);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSrtInput(reader.result);
          convertSrtToVtt(reader.result);
        }
      };
      reader.readAsText(f);
    }
  };

  const handleCopy = () => {
    if (vttOutput) {
      navigator.clipboard.writeText(vttOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (vttOutput) {
      const blob = new Blob([vttOutput], { type: 'text/vtt;charset=utf-8' });
      saveAs(blob, 'subtitles.vtt');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600 }}>SRT Input</label>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> Upload .srt File
            <input type="file" accept=".srt,text/plain" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <textarea
          className="tool-textarea"
          value={srtInput}
          onChange={e => {
            setSrtInput(e.target.value);
            convertSrtToVtt(e.target.value);
          }}
          placeholder="Paste SubRip (.srt) subtitle lines here..."
          style={{ height: '180px', marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">WebVTT Output</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy VTT'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download .vtt
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={vttOutput}
          style={{ height: '200px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
