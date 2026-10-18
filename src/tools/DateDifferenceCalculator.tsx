import React, { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import './tools.css';

export default function DateDifferenceCalculator() {
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  const calculateDiff = () => {
    if (!startDate || !endDate) return null;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    const months = (totalDays / 30.4375).toFixed(1);

    return { totalDays, weeks, remainingDays, months };
  };

  const diff = calculateDiff();

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="tool-input"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="tool-input"
            />
          </div>
        </div>

        {diff && (
          <div className="tool-stats-grid">
            <div className="tool-stat-card">
              <div className="tool-stat-value" style={{ color: 'var(--color-primary)' }}>{diff.totalDays}</div>
              <div className="tool-stat-label">Total Days</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value">{diff.weeks}w {diff.remainingDays}d</div>
              <div className="tool-stat-label">Weeks & Days</div>
            </div>
            <div className="tool-stat-card">
              <div className="tool-stat-value">~{diff.months}</div>
              <div className="tool-stat-label">Estimated Months</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
