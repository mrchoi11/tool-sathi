import { Link } from 'react-router-dom';
import { HelpCircle, Home, Compass } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export default function NotFoundPage() {
  usePageSeo(
    'page-404',
    '404 — Page Not Found | ProToolBox',
    'The page or tool you were looking for could not be found on ProToolBox.'
  );

  return (
    <div className="container" style={{ padding: 'var(--space-4xl) var(--space-md)', textAlign: 'center', minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4f46e5',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)'
      }}>
        <HelpCircle size={40} />
      </div>
      <h1 style={{ fontSize: '3.75rem', fontWeight: 850, margin: '0 0 var(--space-xs)', color: '#0f172a', letterSpacing: '-0.04em' }}>404</h1>
      <h2 style={{ fontSize: '1.65rem', fontWeight: 700, margin: '0 0 var(--space-md)', color: '#1e293b' }}>Page Not Found</h2>
      <p style={{ color: '#64748b', maxWidth: '460px', margin: '0 0 var(--space-2xl)', lineHeight: 1.6, fontSize: '1.05rem' }}>
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
