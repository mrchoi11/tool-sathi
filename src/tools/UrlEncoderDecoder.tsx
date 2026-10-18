import React, { useState } from 'react';
import { Link, Copy, Check } from 'lucide-react';
import './tools.css';

export default function UrlEncoderDecoder() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState<string>('https://toolsathi.com/search?query=react 19 & tools=pdf,video');
  const [outputText, setOutputText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const processUrl = (text: string, currentMode: 'encode' | 'decode') => {
    try {
      if (!text) {
        setOutputText('');
        return;
      }
      if (currentMode === 'encode') {
        setOutputText(encodeURIComponent(text));
      } else {
        setOutputText(decodeURIComponent(text));
      }
    } catch (err) {
      setOutputText('Decoding error: ' + (err as Error).message);
    }
  };

  React.useEffect(() => {
    processUrl(inputText, mode);
  }, [mode]);

  const handleInputChange = (val: string) => {
    setInputText(val);
    processUrl(val, mode);
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <button
            type="button"
            onClick={() => setMode('encode')}
            className={`btn ${mode === 'encode' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ border: '1px solid var(--color-border)', flex: 1 }}
          >
            Encode URL
          </button>
          <button
            type="button"
            onClick={() => setMode('decode')}
            className={`btn ${mode === 'decode' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ border: '1px solid var(--color-border)', flex: 1 }}
          >
            Decode URL
          </button>
        </div>

        <label className="tool-label" style={{ marginBottom: 'var(--space-xs)' }}>
          {mode === 'encode' ? 'Standard URL / Text to Encode' : 'Encoded URI to Decode'}
        </label>
        <textarea
          className="tool-textarea"
          value={inputText}
          onChange={e => handleInputChange(e.target.value)}
          placeholder="Paste URL here..."
          style={{ height: '140px', marginBottom: 'var(--space-lg)' }}
        />

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="tool-result-title">{mode === 'encode' ? 'Encoded URL' : 'Decoded URL'}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={outputText}
          style={{ height: '160px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
