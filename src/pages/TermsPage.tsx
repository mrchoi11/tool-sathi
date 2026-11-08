import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export default function TermsPage() {
  usePageSeo(
    'page-terms',
    'Terms of Service — ToolSathi',
    'ToolSathi terms of service: terms and conditions governing use of our free browser-based online tools and services.'
  );

  return (
    <div className="container" style={{ padding: 'var(--space-xl) var(--space-md) var(--space-4xl)', maxWidth: '840px', position: 'relative', zIndex: 1 }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>Terms of Service</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(79, 70, 229, 0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.15)' }}>
          <FileText size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 850, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Terms of Service</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Effective date: 2026</p>
        </div>
      </div>

      <div className="card" style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xl)',
        lineHeight: 1.7,
        color: '#334155'
      }}>
        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using ToolSathi, you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue using the platform.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>2. Permissible Use</h2>
          <p>
            ToolSathi provides browser-based utilities for lawful personal and commercial tasks. You agree not to use the service to process harmful, unlawful, infringing, or malicious content, or attempt to circumvent security and rate limits.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>3. Intellectual Property Rights</h2>
          <p>
            You retain all rights, title, and ownership of any media, text, or files processed using ToolSathi. We do not claim ownership or rights over your outputs or data.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>4. Disclaimer of Warranties</h2>
          <p>
            The software and utilities are provided "as is" and "as available" without warranty of any kind. ToolSathi does not guarantee uninterrupted operation or zero data conversion anomalies. Always maintain backups of critical files.
          </p>
        </section>
      </div>
    </div>
  );
}
