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
    const handleScroll = () => setScrolled(window.scrollY > 15);
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
        <div className="navbar-container">
          <div className="navbar-pill glass">
            {/* Logo */}
            <Link to="/" className="navbar-brand" aria-label="ToolSathi Home">
              <div className="navbar-logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="9" fill="url(#toolsathi-logo-grad)" />
                  <path d="M10 11h12M10 16h8M10 21h12" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="toolsathi-logo-grad" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#3b82f6" />
                      <stop offset="0.5" stopColor="#6366f1" />
                      <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="navbar-brand-text">ToolSathi</span>
            </Link>

            {/* Desktop Navigation Links */}
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
                      <span>{link.label}</span>
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

            {/* Actions: Glass Search Pill + Mobile Toggle */}
            <div className="navbar-actions">
              <button
                className="navbar-search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search tools (Ctrl+K)"
              >
                <Search size={15} className="navbar-search-icon" />
                <span className="navbar-search-text">Search tools...</span>
                <kbd className="navbar-kbd">⌘K</kbd>
              </button>
              <button
                className="navbar-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
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
