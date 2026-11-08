import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { getActiveTools, searchTools, categories } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import { usePageSeo } from '../hooks/usePageSeo';
import './AllToolsPage.css';

export default function AllToolsPage() {
  usePageSeo(
    'page-tools',
    'All Tools — Complete Online Utility Directory | ToolSathi',
    'Browse all 75+ free in-browser online tools on ToolSathi: Video players, PDF converters, image tools, QR code generators, and developer utilities.'
  );

  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allTools = getActiveTools();

  const filteredTools = useMemo(() => {
    let result = query.trim() ? searchTools(query) : allTools;
    if (activeCategory) {
      result = result.filter(t => t.category === activeCategory);
    }
    return result;
  }, [query, activeCategory, allTools]);

  return (
    <div className="all-tools-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>All Tools</span>
        </nav>

        <div className="all-tools-header">
          <h1 className="section-title">All Tools</h1>
          <p className="section-description">Browse {allTools.length} free online tools. Search or filter by category.</p>
        </div>

        <div className="all-tools-controls">
          <div className="all-tools-search">
            <Search size={18} />
            <input
              type="text"
              className="input"
              placeholder="Search tools (e.g. PDF, Image, Video, QR)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search tools"
            />
          </div>
          <div className="all-tools-filters">
            <button
              className={`filter-btn ${!activeCategory ? 'filter-btn-active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All Tools ({allTools.length})
            </button>
            {categories.map(cat => {
              const count = allTools.filter(t => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`filter-btn ${activeCategory === cat.id ? 'filter-btn-active' : ''}`}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div className="all-tools-empty">
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
              No tools found{query ? ` for "${query}"` : ''}.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Try searching for something else or clearing your filters.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => { setQuery(''); setActiveCategory(null); }}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="all-tools-grid">
            {filteredTools.map(tool => {
              const Icon = getIconComponent(tool.icon);
              const cat = categories.find(c => c.id === tool.category);
              const catColor = cat?.color || '#4f46e5';

              return (
                <Link key={tool.id} to={`/tools/${tool.slug}`} className="tool-card">
                  <div className="tool-card-icon-wrap" style={{ background: `${catColor}15` }}>
                    <Icon size={24} style={{ color: catColor }} />
                  </div>
                  <div className="tool-card-body">
                    <div className="tool-card-head">
                      <h3 className="tool-card-name">{tool.name}</h3>
                      {tool.isNew && (
                        <span className="badge badge-new">New</span>
                      )}
                    </div>
                    <p className="tool-card-desc">{tool.description}</p>
                  </div>
                  <ChevronRight size={18} className="tool-card-arrow" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
