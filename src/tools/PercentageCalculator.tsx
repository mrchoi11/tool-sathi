import React, { useState } from 'react';
import { Percent } from 'lucide-react';
import './tools.css';

export default function PercentageCalculator() {
  // Mode 1: What is X% of Y?
  const [val1A, setVal1A] = useState<number>(20);
  const [val1B, setVal1B] = useState<number>(150);

  // Mode 2: X is what percent of Y?
  const [val2A, setVal2A] = useState<number>(45);
  const [val2B, setVal2B] = useState<number>(180);

  // Mode 3: Percentage increase / decrease from X to Y
  const [val3A, setVal3A] = useState<number>(80);
  const [val3B, setVal3B] = useState<number>(120);

  const res1 = ((val1A / 100) * val1B).toFixed(2);
  const res2 = val2B !== 0 ? (((val2A / val2B) * 100).toFixed(2)) : '0';
  const res3Diff = val3B - val3A;
  const res3Pct = val3A !== 0 ? (((res3Diff / val3A) * 100).toFixed(2)) : '0';

  return (
    <div className="tool-container">
      {/* Mode 1 */}
      <div className="tool-card-panel">
        <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>1. What is X% of Y?</h4>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>What is</span>
          <input
            type="number"
            value={val1A}
            onChange={e => setVal1A(parseFloat(e.target.value) || 0)}
            className="tool-input"
            style={{ width: '100px' }}
          />
          <span>% of</span>
          <input
            type="number"
            value={val1B}
            onChange={e => setVal1B(parseFloat(e.target.value) || 0)}
            className="tool-input"
            style={{ width: '120px' }}
          />
          <span>=</span>
          <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>{res1}</strong>
        </div>
      </div>

      {/* Mode 2 */}
      <div className="tool-card-panel">
        <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>2. X is what percent of Y?</h4>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            value={val2A}
            onChange={e => setVal2A(parseFloat(e.target.value) || 0)}
            className="tool-input"
            style={{ width: '100px' }}
          />
          <span>is what percent of</span>
          <input
            type="number"
            value={val2B}
            onChange={e => setVal2B(parseFloat(e.target.value) || 0)}
            className="tool-input"
            style={{ width: '120px' }}
          />
          <span>=</span>
          <strong style={{ fontSize: '1.25rem', color: 'var(--color-accent)' }}>{res2}%</strong>
        </div>
      </div>

      {/* Mode 3 */}
      <div className="tool-card-panel">
        <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>3. Percentage Change (Increase or Decrease)</h4>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>From</span>
          <input
            type="number"
            value={val3A}
            onChange={e => setVal3A(parseFloat(e.target.value) || 0)}
            className="tool-input"
            style={{ width: '100px' }}
          />
          <span>to</span>
          <input
            type="number"
            value={val3B}
            onChange={e => setVal3B(parseFloat(e.target.value) || 0)}
            className="tool-input"
            style={{ width: '100px' }}
          />
          <span>=</span>
          <strong style={{ fontSize: '1.25rem', color: parseFloat(res3Pct) >= 0 ? '#10b981' : '#f87171' }}>
            {parseFloat(res3Pct) >= 0 ? `+${res3Pct}%` : `${res3Pct}%`}
          </strong>
        </div>
      </div>
    </div>
  );
}
