import React, { useState } from 'react';
import { Mail, CheckCircle, Send } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="section newsletter-section" style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-pill)',
          padding: '1.75rem 2.5rem',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 16px 42px -6px rgba(99, 102, 241, 0.12), inset 0 1px 0 #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          flexWrap: 'wrap',
          overflow: 'hidden'
        }}>
          {/* Subtle paper plane decorative element */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '28px',
            color: '#818cf8',
            opacity: 0.7,
            transform: 'rotate(-15deg)',
            pointerEvents: 'none'
          }}>
            <Send size={24} />
          </div>

          {/* Left: Icon & Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '300px', flex: '1' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(99, 102, 241, 0.3)',
              flexShrink: 0
            }}>
              <Mail size={24} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: '0.2rem'
              }}>
                Stay Updated with ProToolBox
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                lineHeight: 1.45,
                margin: 0
              }}>
                Get the latest tools, updates and tips delivered to your inbox.
              </p>
            </div>
          </div>

          {/* Right: Email Input & Subscribe Button */}
          {subscribed ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#059669',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '0.65rem 1.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <CheckCircle size={18} />
              <span>You're subscribed! Thanks for joining.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '0.35rem 0.35rem 0.35rem 1.25rem',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid rgba(203, 213, 225, 0.7)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.03)',
              flex: '1',
              maxWidth: '460px',
              minWidth: '280px'
            }}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  fontWeight: 500
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(99, 102, 241, 0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.35)';
                }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
