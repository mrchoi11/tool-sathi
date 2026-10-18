import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { searchTools, getFeaturedTools } from '../data/toolRegistry';
import type { Tool } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import './SearchOverlay.css';

interface SearchOverlayProps {
  onClose: () => void;
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Tool[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchTools(query).slice(0, 8));
      setSelectedIndex(0);
    } else {
      setResults(getFeaturedTools().slice(0, 6));
      setSelectedIndex(0);
    }
  }, [query]);

  const handleNavigate = (tool: Tool) => {
    navigate(`/tools/${tool.slug}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleNavigate(results[selectedIndex]);
    }
  };

  return (
    <div className="search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search tools">
      <div className="search-modal glass-strong" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search tools, file formats, or tasks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search tools"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
          <button className="search-close-btn" onClick={onClose} aria-label="Close search">
            <kbd>Esc</kbd>
          </button>
        </div>

        <div className="search-results">
          {!query.trim() && <div className="search-section-label">Popular tools</div>}
          {query.trim() && results.length === 0 && (
            <div className="search-empty">
              <p>No tools found for "{query}"</p>
              <p className="search-empty-hint">Try different keywords or browse all tools</p>
            </div>
          )}
          {results.map((tool, index) => {
            const Icon = getIconComponent(tool.icon);
            return (
              <button
                key={tool.id}
                className={`search-result-item ${index === selectedIndex ? 'search-result-selected' : ''}`}
                onClick={() => handleNavigate(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="search-result-icon">
                  <Icon size={18} />
                </div>
                <div className="search-result-info">
                  <span className="search-result-name">{tool.name}</span>
                  <span className="search-result-desc">{tool.description}</span>
                </div>
                <ArrowRight size={14} className="search-result-arrow" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
