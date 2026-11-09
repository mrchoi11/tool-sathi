import React, { useState } from 'react';
import { Mail, Send, MapPin, MessageCircle, CheckCircle, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';
import './ContactPage.css';

export default function ContactPage() {
  usePageSeo(
    'page-contact',
    'Contact Us — ProToolBox Support',
    'Get in touch with the ProToolBox team. Have a question, suggestion, or tool request? Send us a message.'
  );

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setFeedbackMsg('');

    try {
      const response = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setStatus('success');
        setFeedbackMsg(data.message || 'Your inquiry has been sent to policyian@gmail.com.');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        // Fallback: if server-side mail failed or API returned an error, give user helpful message
        const err = data?.error || 'Unable to deliver message right now. Please email directly to policyian@gmail.com.';
        setStatus('error');
        setFeedbackMsg(err);
      }
    } catch {
      // Network error or local dev environment without PHP
      setStatus('error');
      setFeedbackMsg('Could not connect to contact gateway. You can also email us directly at policyian@gmail.com.');
    }
  };

  return (
    <div className="contact-page">
      <div className="container" style={{ maxWidth: '980px' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>Contact Us</span>
        </nav>

        <div className="contact-header">
          <span className="section-label">Get in Touch</span>
          <h1 className="contact-title">
            Contact <span className="gradient-text">ProToolBox</span>
          </h1>
          <p className="contact-subtitle">
            Have a question, suggestion, or tool request? We'd love to hear from you.
          </p>
        </div>

        <div className="contact-grid">
          {/* Info sidebar */}
          <div className="contact-info-card">
            <div>
              <h2 className="contact-info-title">Contact Information</h2>

              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <div className="contact-info-label">Email Support</div>
                    <a href="mailto:policyian@gmail.com" className="contact-info-value">policyian@gmail.com</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <div className="contact-info-label">Location</div>
                    <span className="contact-info-text">Remote — Global</span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#0891b2' }}>
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <div className="contact-info-label">Response Time</div>
                    <span className="contact-info-text">Within 24–48 hours</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-privacy-box">
              <p className="contact-privacy-text">
                🛡️ All inquiries are sent securely to <strong>policyian@gmail.com</strong>. We respect your privacy and never share your details.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="contact-form-card">
            {status === 'success' ? (
              <div className="contact-success-state">
                <div className="contact-success-icon">
                  <CheckCircle size={36} />
                </div>
                <h3 className="contact-success-title">Message Sent!</h3>
                <p className="contact-success-msg">
                  {feedbackMsg || 'Thank you for reaching out! Your inquiry has been sent to our inbox at policyian@gmail.com.'}
                </p>
                <button
                  type="button"
                  onClick={() => { setStatus('idle'); setFeedbackMsg(''); }}
                  className="contact-submit-btn"
                  style={{ marginTop: '1.75rem', alignSelf: 'center' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {status === 'error' && (
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#b91c1c',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span>{feedbackMsg}</span>
                  </div>
                )}

                <div className="contact-form-row">
                  <div className="contact-field-group">
                    <label htmlFor="contact-name" className="contact-label">Name *</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="contact-input"
                    />
                  </div>
                  <div className="contact-field-group">
                    <label htmlFor="contact-email" className="contact-label">Email *</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="contact-input"
                    />
                  </div>
                </div>

                <div className="contact-field-group">
                  <label htmlFor="contact-subject" className="contact-label">Subject *</label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    className="contact-input"
                  />
                </div>

                <div className="contact-field-group">
                  <label htmlFor="contact-message" className="contact-label">Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you need help with..."
                    className="contact-textarea"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="contact-submit-btn"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending to policyian@gmail.com...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
