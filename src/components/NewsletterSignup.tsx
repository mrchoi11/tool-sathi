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
    <section className="newsletter-section" style={{ padding: '1.5rem 0 2.5rem' }}>
      <div className="container">
        <div className="newsletter-card">
          {/* Decorative element */}
          <div className="newsletter-deco" aria-hidden="true">
            <Send size={22} />
          </div>

          {/* Icon + Text */}
          <div className="newsletter-left">
            <div className="newsletter-icon-wrap">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="newsletter-title">Stay Updated with ProToolBox</h3>
              <p className="newsletter-sub">Get the latest tools, tips &amp; updates in your inbox.</p>
            </div>
          </div>

          {/* Input or Success */}
          {subscribed ? (
            <div className="newsletter-success">
              <CheckCircle size={17} />
              <span>You're subscribed! Thanks for joining.</span>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubmit}>
              <input
                type="email"
                className="newsletter-input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-btn">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .newsletter-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          padding: 1.4rem 2rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 32px -6px rgba(99, 102, 241, 0.1), inset 0 1px 0 #fff;
          overflow: hidden;
        }

        .newsletter-deco {
          position: absolute;
          top: 10px;
          right: 24px;
          color: #818cf8;
          opacity: 0.65;
          transform: rotate(-15deg);
          pointer-events: none;
        }

        .newsletter-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 240px;
        }

        .newsletter-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .newsletter-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 0.15rem;
        }

        .newsletter-sub {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .newsletter-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          padding: 0.3rem 0.3rem 0.3rem 1rem;
          border-radius: 50px;
          border: 1px solid rgba(203, 213, 225, 0.6);
          flex: 1;
          max-width: 400px;
          min-width: 240px;
        }

        .newsletter-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.875rem;
          color: #0f172a;
          font-weight: 500;
          min-width: 0;
        }

        .newsletter-btn {
          padding: 0.55rem 1.25rem;
          border-radius: 50px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 12px rgba(99, 102, 241, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }

        .newsletter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 16px rgba(99, 102, 241, 0.4);
        }

        .newsletter-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #059669;
          font-weight: 700;
          font-size: 0.875rem;
          padding: 0.55rem 1.25rem;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 50px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        @media (max-width: 640px) {
          .newsletter-card {
            padding: 1.2rem 1.25rem;
            gap: 1rem;
            flex-direction: column;
            align-items: flex-start;
          }

          .newsletter-left {
            min-width: unset;
            width: 100%;
          }

          .newsletter-form {
            width: 100%;
            max-width: 100%;
            min-width: unset;
          }

          .newsletter-title { font-size: 0.95rem; }
          .newsletter-sub { font-size: 0.8rem; }
          .newsletter-deco { display: none; }
        }
      `}</style>
    </section>
  );
}
