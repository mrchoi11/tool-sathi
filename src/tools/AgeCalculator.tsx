import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import './tools.css';

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    const now = new Date();

    if (isNaN(birth.getTime())) return null;

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    return { years, months, days, totalDays, totalWeeks, totalHours };
  };

  const age = calculateAge(birthDate);

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-field" style={{ maxWidth: '300px', marginBottom: 'var(--space-xl)' }}>
          <label className="tool-label">Select Date of Birth</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="tool-input"
          />
        </div>

        {age && (
          <div>
            <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="tool-stat-card">
                <div className="tool-stat-value" style={{ color: 'var(--color-primary)' }}>{age.years}</div>
                <div className="tool-stat-label">Years Old</div>
              </div>
              <div className="tool-stat-card">
                <div className="tool-stat-value">{age.months}</div>
                <div className="tool-stat-label">Months</div>
              </div>
              <div className="tool-stat-card">
                <div className="tool-stat-value">{age.days}</div>
                <div className="tool-stat-label">Days</div>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
              <div>Total Days Lived: <strong>{age.totalDays.toLocaleString()} days</strong></div>
              <div>Total Weeks Lived: <strong>{age.totalWeeks.toLocaleString()} weeks</strong></div>
              <div>Total Hours Lived: <strong>~{age.totalHours.toLocaleString()} hours</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
