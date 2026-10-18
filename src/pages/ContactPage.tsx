import React, { useState } from 'react';
import { Mail, Send, MapPin, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    // Simulating a send — in production, hook this up to an API
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="contact-page" style={{ padding: '3rem 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="section-label">Get in Touch</p>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Contact Us</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto', fontSize: '1.05rem' }}>
            Have a question, suggestion, or want to partner with us? We'd love to hear from you.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
          gap: '2rem',
        }} className="contact-grid">

          {/* Info sidebar */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.10))',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem' }}>Contact Information</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Mail size={20} style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Email</div>
                  <a href="mailto:support@toolsathi.com" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>support@toolsathi.com</a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin size={20} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Location</div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Remote — Global</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MessageCircle size={20} style={{ color: '#06b6d4', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Response Time</div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Within 24–48 hours</span>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.12)',
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                🛡️ We respect your privacy. Your message and contact information will only be used to respond to your inquiry.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid var(--border)',
          }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Message Sent!</h3>
                <p style={{ color: 'var(--text-muted)' }}>Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label htmlFor="contact-name" style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Name</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                        fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                        fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Subject</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                      background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                      fontSize: '0.9rem', outline: 'none',
                    }}
                  >
                    <option value="">Select a subject...</option>
                    <option value="general">General Question</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="business">Business / Partnership</option>
                    <option value="advertising">Advertising Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind..."
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                      background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                      fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    }}
                  />
                </div>

                {status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} /> Failed to send. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === 'sending'}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {status === 'sending' ? (
                    <>Sending...</>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Responsive style */}
        <style>{`
          @media (max-width: 768px) {
            .contact-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
