import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { getActiveTools, searchTools, categories } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import './AllToolsPage.css';

export default function AllToolsPage() {
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
        <div className="all-tools-header">
          <h1 className="section-title">All Tools</h1>
          <p className="section-description">Browse {allTools.length} free online tools. Search or filter by category.</p>
        </div>

        <div className="all-tools-controls">
          <div className="all-tools-search">
            <Search size={16} />
            <input
              type="text"
              className="input"
              placeholder="Search tools..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search tools"
            />
          </div>
          <div className="all-tools-filters">
            <button
              className={`btn btn-sm ${!activeCategory ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div className="all-tools-empty">
            <p>No tools found{query ? ` for "${query}"` : ''}.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => { setQuery(''); setActiveCategory(null); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="all-tools-grid">
            {filteredTools.map(tool => {
              const Icon = getIconComponent(tool.icon);
              const cat = categories.find(c => c.id === tool.category);
              return (
                <Link key={tool.id} to={`/tools/${tool.slug}`} className="card card-interactive tool-card">
                  <div className="tool-card-icon" style={{ background: `${cat?.color || '#6366f1'}18` }}>
                    <Icon size={20} style={{ color: cat?.color }} />
                  </div>
                  <div className="tool-card-info">
                    <h3 className="tool-card-name">{tool.name}</h3>
                    <p className="tool-card-desc">{tool.description}</p>
                  </div>
                  <ArrowRight size={14} className="tool-card-arrow" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
