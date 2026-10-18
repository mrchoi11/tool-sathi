import React, { useState } from 'react';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // In production, send to email service API
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="newsletter-section" style={{
      padding: '3rem 0',
    }}>
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)',
          borderRadius: '1.25rem',
          padding: '3rem 2rem',
          border: '1px solid rgba(99,102,241,0.12)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: '-40%', right: '-10%',
            width: '300px', height: '300px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30%', left: '-5%',
            width: '250px', height: '250px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={24} color="white" />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Stay Updated with ToolSathi
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
              Get notified about new tools, feature updates, tips & tricks, and exclusive guides. No spam, ever.
            </p>

            {subscribed ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10b981', fontSize: '1rem', fontWeight: 500 }}>
                <CheckCircle size={20} /> You're subscribed! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', maxWidth: '460px', margin: '0 auto',
                flexWrap: 'wrap',
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Mail size={16} style={{
                    position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', pointerEvents: 'none',
                  }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    aria-label="Email address for newsletter"
                    style={{
                      width: '100%', padding: '0.7rem 0.85rem 0.7rem 2.5rem',
                      borderRadius: '0.5rem', background: 'var(--bg)',
                      border: '1px solid var(--border)', color: 'var(--text)',
                      fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  Subscribe
                </button>
              </form>
            )}

            <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', opacity: 0.7 }}>
              By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
