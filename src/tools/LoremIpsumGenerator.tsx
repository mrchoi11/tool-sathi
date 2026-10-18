import React, { useState } from 'react';
import { AlignJustify, Copy, Check, RefreshCw } from 'lucide-react';
import './tools.css';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

export default function LoremIpsumGenerator() {
  const [count, setCount] = useState<number>(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generateLorem = () => {
    let output = '';

    const getRandomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];

    const generateSentence = () => {
      const len = 8 + Math.floor(Math.random() * 8);
      const words = Array.from({ length: len }, getRandomWord);
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      return words.join(' ') + '.';
    };

    const generateParagraph = () => {
      const numSentences = 4 + Math.floor(Math.random() * 3);
      return Array.from({ length: numSentences }, generateSentence).join(' ');
    };

    if (type === 'paragraphs') {
      const paras = Array.from({ length: count }, generateParagraph);
      if (startWithLorem && paras.length > 0) {
        paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + paras[0];
      }
      output = paras.join('\n\n');
    } else if (type === 'sentences') {
      const sentences = Array.from({ length: count }, generateSentence);
      if (startWithLorem && sentences.length > 0) {
        sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      }
      output = sentences.join(' ');
    } else {
      const words = Array.from({ length: count }, getRandomWord);
      if (startWithLorem && words.length >= 2) {
        words[0] = 'Lorem';
        words[1] = 'ipsum';
      }
      output = words.join(' ');
    }

    setResult(output);
  };

  React.useEffect(() => {
    generateLorem();
  }, [count, type, startWithLorem]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="tool-field">
            <label className="tool-label">Quantity</label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="tool-input"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Generate Type</label>
            <select className="tool-select" value={type} onChange={e => setType(e.target.value as any)}>
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>

          <div className="tool-field" style={{ justifyContent: 'center' }}>
            <label className="tool-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={startWithLorem}
                onChange={e => setStartWithLorem(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
              Start with "Lorem ipsum..."
            </label>
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">Generated Placeholder Text</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={generateLorem}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={14} /> Regenerate
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={result}
          style={{ height: '240px', background: 'var(--color-bg)', lineHeight: 1.7 }}
        />
      </div>
    </div>
  );
}
