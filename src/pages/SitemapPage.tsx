import { Link } from 'react-router-dom';
import { categories, tools } from '../data/toolRegistry';
import { Map, ExternalLink, ChevronRight } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export default function SitemapPage() {
  usePageSeo(
    'page-sitemap',
    'HTML Sitemap — ToolSathi',
    'HTML sitemap: browse the full directory of tools, categories, blogs, and static pages available on ToolSathi.'
  );

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
    <div style={{ padding: 'var(--space-xl) 0 var(--space-4xl)', minHeight: '80vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>Sitemap</span>
        </nav>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
          }}>
            <Map size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Website Sitemap</h1>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto', fontSize: '1rem' }}>
            Complete directory of all pages and tools on ToolSathi.
          </p>
        </div>

        {/* Static Pages */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
            Core Pages
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {staticPages.map(page => (
              <Link
                key={page.path}
                to={page.path}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontSize: '0.925rem',
                  color: '#0f172a', fontWeight: 600
                }}
              >
                <ExternalLink size={15} style={{ color: '#4f46e5', flexShrink: 0 }} />
                {page.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
            Tool Categories
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontSize: '0.925rem',
                  color: '#0f172a', fontWeight: 600
                }}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                  {activeTools.filter(t => t.category === cat.id).length}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* All Tools */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
            All Tools ({activeTools.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {activeTools.map(tool => (
              <Link
                key={tool.id}
                to={`/tools/${tool.slug}`}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontSize: '0.875rem',
                  color: '#334155', fontWeight: 500
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
