import React, { useState } from 'react';
import { Tag, DollarSign, Percent } from 'lucide-react';
import './tools.css';

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState<number>(100);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  const discountAmount = (originalPrice * discountPercent) / 100;
  const priceAfterDiscount = originalPrice - discountAmount;
  const taxAmount = (priceAfterDiscount * taxPercent) / 100;
  const finalPrice = priceAfterDiscount + taxAmount;

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <div className="tool-form-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-field">
            <label className="tool-label">Original Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={originalPrice}
              onChange={e => setOriginalPrice(parseFloat(e.target.value) || 0)}
              className="tool-input"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Discount Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
              className="tool-input"
            />
          </div>

          <div className="tool-field">
            <label className="tool-label">Sales Tax (%) - Optional</label>
            <input
              type="number"
              min="0"
              value={taxPercent}
              onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)}
              className="tool-input"
            />
          </div>
        </div>

        <div className="tool-stats-grid">
          <div className="tool-stat-card">
            <div className="tool-stat-value" style={{ color: '#10b981' }}>${finalPrice.toFixed(2)}</div>
            <div className="tool-stat-label">Final Price to Pay</div>
          </div>
          <div className="tool-stat-card">
            <div className="tool-stat-value" style={{ color: 'var(--color-primary)' }}>${discountAmount.toFixed(2)}</div>
            <div className="tool-stat-label">You Save</div>
          </div>
          {taxPercent > 0 && (
            <div className="tool-stat-card">
              <div className="tool-stat-value">${taxAmount.toFixed(2)}</div>
              <div className="tool-stat-label">Estimated Tax</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
