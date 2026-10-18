import { Link } from 'react-router-dom';
import { categories, tools } from '../data/toolRegistry';
import { Map, ExternalLink } from 'lucide-react';

export default function SitemapPage() {
  const activeTools = tools.filter(t => t.status === 'active');

  const staticPages = [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
  ];

  return (
    <div style={{ padding: '3rem 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            marginBottom: '1rem',
          }}>
            <Map size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sitemap</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            Complete directory of all pages and tools on ToolSathi.
          </p>
        </div>

        {/* Static Pages */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            Pages
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {staticPages.map(page => (
              <Link
                key={page.path}
                to={page.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem',
                  transition: 'border-color 0.2s',
                }}
              >
                <ExternalLink size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                {page.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            Categories
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Tools by Category */}
        {categories.map(cat => {
          const catTools = activeTools.filter(t => t.category === cat.id);
          if (catTools.length === 0) return null;
          return (
            <section key={cat.id} style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                {cat.name}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({catTools.length})
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.4rem' }}>
                {catTools.map(tool => (
                  <Link
                    key={tool.slug}
                    to={`/tools/${tool.slug}`}
                    style={{
                      display: 'block',
                      padding: '0.55rem 0.85rem', borderRadius: '0.4rem',
                      color: 'var(--text)', textDecoration: 'none', fontSize: '0.88rem',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {tool.name}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
