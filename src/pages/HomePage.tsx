import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Upload, Cpu, Download, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { categories, getFeaturedTools, getActiveTools } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import NewsletterSignup from '../components/NewsletterSignup';
import './HomePage.css';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const featuredTools = getFeaturedTools();
  const activeTools = getActiveTools();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tools?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const faqs = [
    { q: 'Is ToolSathi free to use?', a: 'Yes, all core tools are free to use. We plan to offer optional premium features for advanced workflows like batch processing and larger file limits.' },
    { q: 'Are my files safe?', a: 'Most tools process files directly in your browser. Your files are not uploaded to our servers unless explicitly stated. We never store your files after processing.' },
    { q: 'What file formats are supported?', a: 'We support a wide range of formats including PDF, JPG, PNG, WebP, MP4, WebM, MP3, SRT, VTT, CSV, JSON, and many more. Check individual tool pages for specific format support.' },
    { q: 'Do I need to create an account?', a: 'No account is needed to use any of the free tools. Premium features may require an account in the future.' },
    { q: 'What if my file is too large?', a: 'Browser-based tools have memory limits that vary by device. For very large files (100MB+), processing may be slow or unavailable. We display file size limits on each tool page.' },
    { q: 'Can I use ToolSathi on mobile?', a: 'Yes, the entire platform is designed to work on mobile devices. Some tools like video processing may work better on desktop due to processing requirements.' },
  ];

  return (
    <div className="home">
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-grid-overlay" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge badge-accent">{activeTools.length}+ Tools Available</span>
          </div>
          <h1 className="hero-title">
            Every tool you need,<br />
            <span className="hero-title-accent">right in your browser.</span>
          </h1>
          <p className="hero-subtitle">
            Convert files, edit PDFs, compress images, play videos, generate QR codes,
            and more — fast, free, and private. No uploads to unknown servers.
          </p>

          <form className="hero-search glass" onSubmit={handleSearch}>
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="What do you want to do? (e.g., compress PDF, resize image...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search for a tool"
            />
            <button type="submit" className="btn btn-primary hero-search-btn">
              Search
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="hero-suggestions">
            <span className="hero-suggestions-label">Popular:</span>
            {['PDF Merger', 'Image Compressor', 'Video Player', 'QR Code', 'JSON Formatter'].map(s => (
              <Link
                key={s}
                to={`/tools?q=${encodeURIComponent(s)}`}
                className="hero-suggestion-tag"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Featured Tools ===== */}
      <section className="section" id="popular-tools">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-label">Popular Tools</p>
              <h2 className="section-title">Most used tools</h2>
              <p className="section-description">Jump straight into the tools that thousands of people use every day.</p>
            </div>
            <Link to="/tools" className="btn btn-secondary">
              View all tools <ArrowRight size={14} />
            </Link>
          </div>

          <div className="tools-grid">
            {featuredTools.map(tool => {
              const Icon = getIconComponent(tool.icon);
              const categoryObj = categories.find(c => c.id === tool.category);
              return (
                <Link key={tool.id} to={`/tools/${tool.slug}`} className="tool-card card card-interactive">
                  <div className="tool-card-icon">
                    <Icon size={22} style={{ color: '#ff2a44' }} />
                  </div>
                  <div className="tool-card-info">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                      <h3 className="tool-card-name">{tool.name}</h3>
                      {tool.isNew ? (
                        <span className="badge badge-new">New</span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#ff4d63', background: 'rgba(229, 9, 20, 0.1)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
                          {categoryObj?.name || 'Tool'}
                        </span>
                      )}
                    </div>
                    <p className="tool-card-desc">{tool.description}</p>
                  </div>
                  <ArrowRight size={14} className="tool-card-arrow" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Categories ===== */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-label">Categories</p>
              <h2 className="section-title">Browse by category</h2>
              <p className="section-description">Find the right tool organized by what you need to do.</p>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map(cat => {
              const Icon = getIconComponent(cat.icon);
              const count = activeTools.filter(t => t.category === cat.id).length;
              return (
                <Link key={cat.id} to={`/category/${cat.id}`} className="category-card card card-interactive">
                  <div className="category-card-icon" style={{ background: `${cat.color}18` }}>
                    <Icon size={24} style={{ color: cat.color }} />
                  </div>
                  <h3 className="category-card-name">{cat.name}</h3>
                  <p className="category-card-desc">{cat.description}</p>
                  <span className="category-card-count">{count} tool{count !== 1 ? 's' : ''}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header section-header-center">
            <p className="section-label">How it works</p>
            <h2 className="section-title">Simple, fast, and private</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Most tools work entirely in your browser — no file uploads to external servers required.
            </p>
          </div>

          <div className="steps-grid">
            {[
              { icon: Upload, title: 'Upload or paste', desc: 'Drop a file, paste text, or enter a URL. We accept a wide range of formats.' },
              { icon: Cpu, title: 'Process locally', desc: 'Your browser handles the work. Files stay on your device whenever possible.' },
              { icon: Download, title: 'Download result', desc: 'Preview the output, then download or copy it. No account required.' },
            ].map((step, i) => (
              <div key={i} className="step-card glass">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon-wrap">
                  <step.icon size={24} />
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Privacy ===== */}
      <section className="section" id="privacy">
        <div className="container">
          <div className="privacy-banner glass">
            <Shield size={32} className="privacy-icon" />
            <div className="privacy-content">
              <h2 className="privacy-title">Your files stay with you</h2>
              <p className="privacy-text">
                Most conversions, compressions, and edits run in your browser using JavaScript APIs.
                Files are not uploaded to any external server unless explicitly required for a specific operation.
                When server processing is needed, we clearly indicate it before you proceed.
              </p>
              <Link to="/privacy" className="btn btn-secondary btn-sm">
                Read our Privacy Policy <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-header section-header-center">
            <p className="section-label">FAQ</p>
            <h2 className="section-title">Frequently asked questions</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  aria-expanded={faqOpen === i}
                >
                  <span>{faq.q}</span>
                  {faqOpen === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {faqOpen === i && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <NewsletterSignup />
    </div>
  );
}
