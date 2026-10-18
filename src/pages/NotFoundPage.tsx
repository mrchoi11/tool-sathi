import { Link } from 'react-router-dom';
import { HelpCircle, Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-4xl) var(--space-md)', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: 'var(--space-lg)' }}>
        <HelpCircle size={36} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 var(--space-xs)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 var(--space-md)', color: 'var(--color-text)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 0 var(--space-2xl)', lineHeight: 1.6 }}>
        The tool or page you are looking for doesn't exist, has been relocated, or is undergoing enhancement.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <Home size={16} /> Return to Home
        </Link>
        <Link to="/tools" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <Compass size={16} /> Explore All Tools
        </Link>
      </div>
    </div>
  );
}
