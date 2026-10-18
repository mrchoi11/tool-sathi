import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Globe, ChevronRight, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-2xl) var(--space-md) var(--space-4xl)', maxWidth: '880px' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
        <ChevronRight size={14} style={{ color: 'var(--color-text-dim)' }} />
        <span style={{ color: 'var(--color-text)' }}>About Us</span>
      </nav>

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <span className="section-label">Empowering Productivity</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 'var(--space-sm) 0', background: 'linear-gradient(135deg, var(--color-text), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About ToolSathi
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          The all-in-one browser utility platform engineered for speed, privacy, and seamless creative workflows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)' }}>
        <div className="card glass" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>
            <Shield size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-xs)' }}>Zero-Upload Privacy</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Most tools process files directly inside your browser. No cloud queues, no storage leaks, no waiting for server downloads.
          </p>
        </div>

        <div className="card glass" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', marginBottom: 'var(--space-md)' }}>
            <Zap size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-xs)' }}>Blazing Fast WebAssembly</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Utilizing modern browser capabilities to convert, compress, and render with near-native desktop speeds.
          </p>
        </div>

        <div className="card glass" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', marginBottom: 'var(--space-md)' }}>
            <Globe size={20} />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-xs)' }}>100% Free & Accessible</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            No sign-ups, no hidden paywalls, and clean responsive interfaces tested on mobile and desktop displays.
          </p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 'var(--space-2xl)', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.08))' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Explore 60+ Everyday Digital Utilities</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
          From video players to PDF converters, QR generators to developer formatters.
        </p>
        <Link to="/tools" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          Browse All Tools <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
