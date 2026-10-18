import React, { useState } from 'react';
import { Binary, Copy, Check, ArrowRightLeft } from 'lucide-react';
import './tools.css';

export default function Base64EncoderDecoder() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState<string>('Hello from ToolSathi! 🚀');
  const [outputText, setOutputText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processText = (text: string, currentMode: 'encode' | 'decode') => {
    setErrorMsg(null);
    try {
      if (!text) {
        setOutputText('');
        return;
      }
      if (currentMode === 'encode') {
        // UTF-8 safe base64 encoding
        const encoded = btoa(unescape(encodeURIComponent(text)));
        setOutputText(encoded);
      } else {
        // UTF-8 safe base64 decoding
        const decoded = decodeURIComponent(escape(atob(text.trim())));
        setOutputText(decoded);
      }
    } catch (err) {
      setErrorMsg('Failed to ' + currentMode + ': ' + (err as Error).message);
    }
  };

  React.useEffect(() => {
    processText(inputText, mode);
  }, [mode]);

  const handleInputChange = (val: string) => {
    setInputText(val);
    processText(val, mode);
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
            Encode to Base64
          </button>
          <button
            type="button"
            onClick={() => setMode('decode')}
            className={`btn ${mode === 'decode' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ border: '1px solid var(--color-border)', flex: 1 }}
          >
            Decode from Base64
          </button>
        </div>

        <label className="tool-label" style={{ marginBottom: 'var(--space-xs)' }}>
          {mode === 'encode' ? 'Plain Text Input' : 'Base64 Input String'}
        </label>
        <textarea
          className="tool-textarea"
          value={inputText}
          onChange={e => handleInputChange(e.target.value)}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste base64 string to decode...'}
          style={{ height: '140px', marginBottom: 'var(--space-md)' }}
        />

        {errorMsg && (
          <div className="tool-alert tool-alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            {errorMsg}
          </div>
        )}

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="tool-result-title">{mode === 'encode' ? 'Base64 Encoded Result' : 'Decoded Plain Text'}</span>
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
