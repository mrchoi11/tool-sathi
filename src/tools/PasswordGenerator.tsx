import React, { useState, useEffect } from 'react';
import { KeyRound, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import './tools.css';

export default function PasswordGenerator() {
  const [length, setLength] = useState<number>(16);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generate = () => {
    let chars = '';
    if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setPassword('');
      return;
    }

    // Cryptographically secure random values
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    setPassword(result);
  };

  useEffect(() => {
    generate();
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  const handleCopy = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStrength = (len: number): { label: string; color: string } => {
    if (len < 10) return { label: 'Weak', color: '#f87171' };
    if (len < 14) return { label: 'Good', color: '#fbbf24' };
    if (len < 18) return { label: 'Strong', color: '#34d399' };
    return { label: 'Ultra Secure (Recommended)', color: '#10b981' };
  };

  const strength = getStrength(length);

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
          <code style={{ fontSize: '1.35rem', letterSpacing: '1px', color: 'var(--color-text)', wordBreak: 'break-all', fontFamily: 'var(--font-mono, monospace)' }}>
            {password || 'Select at least one character type'}
          </code>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="button" onClick={generate} className="ctrl-btn" title="Regenerate">
              <RefreshCw size={18} />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-label" style={{ marginBottom: 'var(--space-xs)' }}>
            <span>Password Length: <strong>{length} characters</strong></span>
            <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
          </div>
          <input
            type="range"
            min="6"
            max="64"
            value={length}
            onChange={e => setLength(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useUppercase}
              onChange={e => setUseUppercase(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Uppercase Letters (A-Z)
          </label>

          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useLowercase}
              onChange={e => setUseLowercase(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Lowercase Letters (a-z)
          </label>

          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={e => setUseNumbers(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Numbers (0-9)
          </label>

          <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={e => setUseSymbols(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
            />
            Symbols (!@#$%^&*)
          </label>
        </div>
      </div>
    </div>
  );
}
