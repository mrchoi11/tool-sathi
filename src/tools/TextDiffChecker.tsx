import React, { useState } from 'react';
import { GitCompare, Check, RefreshCw } from 'lucide-react';
import './tools.css';

const TEXT_ORIG = `ToolSathi version 1.0
Features:
- Video Player
- PDF Splitter
- Basic Converter`;

const TEXT_MOD = `ToolSathi version 2.0
Features:
- Powerful HLS & MP4 Video Player
- PDF Suite (Merge, Split, Compress)
- Image Optimization & Converter
- SEO Utilities`;

export default function TextDiffChecker() {
  const [origText, setOrigText] = useState<string>(TEXT_ORIG);
  const [modText, setModText] = useState<string>(TEXT_MOD);

  const computeDiff = () => {
    const lines1 = origText.split('\n');
    const lines2 = modText.split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const diffs: { type: 'same' | 'added' | 'removed' | 'changed'; text1?: string; text2?: string }[] = [];

    for (let i = 0; i < maxLen; i++) {
      const l1 = lines1[i];
      const l2 = lines2[i];

      if (l1 === l2) {
        diffs.push({ type: 'same', text1: l1, text2: l2 });
      } else if (l1 !== undefined && l2 === undefined) {
        diffs.push({ type: 'removed', text1: l1 });
      } else if (l1 === undefined && l2 !== undefined) {
        diffs.push({ type: 'added', text2: l2 });
      } else {
        diffs.push({ type: 'changed', text1: l1, text2: l2 });
      }
    }
    return diffs;
  };

  const diffResult = computeDiff();

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Original Text (Before)</label>
            <textarea
              className="tool-textarea"
              value={origText}
              onChange={e => setOrigText(e.target.value)}
              style={{ height: '180px' }}
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Modified Text (After)</label>
            <textarea
              className="tool-textarea"
              value={modText}
              onChange={e => setModText(e.target.value)}
              style={{ height: '180px' }}
            />
          </div>
        </div>

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitCompare size={16} /> Visual Differences
          </span>
        </div>

        <div style={{ background: '#090d16', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem', lineHeight: 1.6, overflowX: 'auto' }}>
          {diffResult.map((d, idx) => {
            if (d.type === 'same') {
              return (
                <div key={idx} style={{ color: '#94a3b8', padding: '2px 8px' }}>
                  &nbsp; {d.text1 || ' '}
                </div>
              );
            }
            if (d.type === 'added') {
              return (
                <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '2px' }}>
                  + {d.text2}
                </div>
              );
            }
            if (d.type === 'removed') {
              return (
                <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '2px' }}>
                  - {d.text1}
                </div>
              );
            }
            return (
              <div key={idx} style={{ margin: '2px 0' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '2px' }}>
                  - {d.text1}
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '2px' }}>
                  + {d.text2}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
