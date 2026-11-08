import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Globe, ChevronRight, ArrowRight } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export default function AboutPage() {
  usePageSeo(
    'page-about',
    'About Us — ToolSathi',
    'Learn more about ToolSathi: the private, browser-based utility platform designed to deliver speed, privacy, and seamless creative workflows.'
  );

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) var(--space-md) var(--space-4xl)', maxWidth: '920px', position: 'relative', zIndex: 1 }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>About Us</span>
      </nav>

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <span className="section-label">Empowering Everyday Productivity</span>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 850, margin: 'var(--space-sm) 0', color: '#0f172a', letterSpacing: '-0.03em' }}>
          About <span className="gradient-text">ToolSathi</span>
        </h1>
        <p style={{ color: '#475569', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.65 }}>
          The all-in-one browser utility platform engineered for speed, privacy, and seamless workflows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)' }}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', marginBottom: 'var(--space-md)' }}>
            <Shield size={22} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 'var(--space-xs)' }}>Zero-Upload Privacy</h3>
          <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Most tools process files directly inside your browser. No cloud queues, no storage leaks, no waiting for server downloads.
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2', marginBottom: 'var(--space-md)' }}>
            <Zap size={22} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 'var(--space-xs)' }}>Blazing Fast WebAssembly</h3>
          <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Utilizing modern browser capabilities to convert, compress, and render with near-native desktop speeds.
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', marginBottom: 'var(--space-md)' }}>
            <Globe size={22} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 'var(--space-xs)' }}>100% Free & Accessible</h3>
          <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}>
            No sign-ups, no hidden paywalls, and clean responsive interfaces tested across all mobile and desktop devices.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.85)' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 'var(--space-sm)' }}>Explore 75+ Everyday Digital Utilities</h2>
        <p style={{ color: '#64748b', marginBottom: 'var(--space-xl)', maxWidth: '520px', margin: '0 auto var(--space-xl)', lineHeight: 1.6 }}>
          From video players to PDF converters, QR generators to developer formatters.
        </p>
        <Link to="/tools" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          Browse All Tools <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
