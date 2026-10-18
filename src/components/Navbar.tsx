import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { categories } from '../data/toolRegistry';
import SearchOverlay from './SearchOverlay';
import './Navbar.css';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'All Tools', path: '/tools' },
  {
    label: 'Categories', path: '#', children: categories.map(c => ({
      label: c.name, path: `/category/${c.id}`
    }))
  },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
  { label: 'About', path: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="navbar-inner container">
          <Link to="/" className="navbar-brand" aria-label="ToolSathi Home">
            <div className="navbar-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="url(#logo-grad)" />
                <path d="M8 10h12M8 14h8M8 18h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="navbar-brand-text">ToolSathi</span>
          </Link>

          <div className={`navbar-links ${mobileOpen ? 'navbar-links-open' : ''}`}>
            {navLinks.map(link => (
              link.children ? (
                <div key={link.label} className="navbar-dropdown">
                  <button
                    className="navbar-link navbar-dropdown-trigger"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown size={14} className={`dropdown-arrow ${dropdownOpen ? 'dropdown-arrow-open' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="navbar-dropdown-menu glass-strong" role="menu">
                      {link.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="navbar-dropdown-item"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${location.pathname === link.path ? 'navbar-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          <div className="navbar-actions">
            <button
              className="navbar-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search tools (Ctrl+K)"
            >
              <Search size={16} />
              <span className="navbar-search-text">Search tools...</span>
              <kbd className="navbar-kbd">⌘K</kbd>
            </button>
            <button
              className="navbar-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
    </>
  );
}
