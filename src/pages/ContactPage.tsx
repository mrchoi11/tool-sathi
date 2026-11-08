import React, { useState } from 'react';
import { Mail, Send, MapPin, MessageCircle, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

export default function ContactPage() {
  usePageSeo(
    'page-contact',
    'Contact Us — ToolSathi Support',
    'Get in touch with the ToolSathi team. Have a suggestion, feedback, or need help? Send us a message.'
  );

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <div className="contact-page" style={{ padding: 'var(--space-xl) 0 var(--space-4xl)', minHeight: '80vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>Contact Us</span>
        </nav>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-label">Get in Touch</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.03em', margin: '0.5rem 0' }}>
            Contact <span className="gradient-text">ToolSathi</span>
          </h1>
          <p style={{ color: '#475569', maxWidth: '540px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Have a question, suggestion, or tool request? We'd love to hear from you.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
          gap: '2rem',
        }} className="contact-grid">

          {/* Info sidebar */}
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Contact Information</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Email Support</div>
                    <a href="mailto:policyian@gmail.com" style={{ color: '#4f46e5', fontSize: '0.9rem', fontWeight: 500 }}>policyian@gmail.com</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Location</div>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Remote — Global</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2', flexShrink: 0 }}>
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Response Time</div>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Within 24–48 hours</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(79, 70, 229, 0.06)',
              border: '1px solid rgba(79, 70, 229, 0.15)',
            }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                🛡️ We respect your privacy. Your information will only be used to respond directly to your inquiry.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '2.25rem',
          }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Message Sent!</h3>
                <p style={{ color: '#475569' }}>Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
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
                    <label htmlFor="contact-name" style={{ display: 'block', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Name</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ display: 'block', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" style={{ display: 'block', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Subject</label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" style={{ display: 'block', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you need help with..."
                    className="input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}
                >
                  <Send size={16} />
                  <span>{status === 'sending' ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
