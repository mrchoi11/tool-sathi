import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-2xl) var(--space-md) var(--space-4xl)', maxWidth: '800px' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
        <ChevronRight size={14} style={{ color: 'var(--color-text-dim)' }} />
        <span style={{ color: 'var(--color-text)' }}>Terms of Service</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
          <FileText size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Terms of Service</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>Effective date: October 2026</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using ToolSathi, you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue using the platform.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>2. Permissible Use</h2>
          <p>
            ToolSathi provides browser-based utilities for lawful personal and commercial tasks. You agree not to use the service to process harmful, unlawful, infringing, or malicious content, or attempt to circumvent security and rate limits.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>3. Intellectual Property Rights</h2>
          <p>
            You retain all rights, title, and ownership of any media, text, or files processed using ToolSathi. We do not claim ownership or rights over your outputs or data.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>4. Disclaimer of Warranties</h2>
          <p>
            The software and utilities are provided "as is" and "as available" without warranty of any kind. ToolSathi does not guarantee uninterrupted operation or zero data conversion anomalies. Always maintain backups of critical files.
          </p>
        </section>
      </div>
    </div>
  );
}
