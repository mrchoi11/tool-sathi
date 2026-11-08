import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Upload, Cpu, Download, Shield, ChevronDown, ChevronUp, ChevronRight, Sparkles } from 'lucide-react';
import { categories, getFeaturedTools, getActiveTools } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import { usePageSeo } from '../hooks/usePageSeo';
import NewsletterSignup from '../components/NewsletterSignup';
import './HomePage.css';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  usePageSeo(
    'page-home',
    'ToolSathi — Free Online Tools for Video, PDF, Image & More',
    '75+ free browser-based online tools: play videos, merge PDFs, compress images, generate QR codes, convert formats, and more. Fast, private, no file uploads needed.'
  );
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
    { q: 'Is ToolSathi completely free to use?', a: 'Yes, all core tools are 100% free to use. Most processing happens right inside your browser without subscription fees or forced registration.' },
    { q: 'Are my files safe and private?', a: 'Yes! Most tools process your files directly inside your browser using client-side JavaScript and WebAssembly. Your files are not uploaded to external servers.' },
    { q: 'What file formats are supported?', a: 'We support a comprehensive range of formats including PDF, JPG, PNG, WebP, SVG, MP4, WebM, MP3, WAV, SRT, VTT, CSV, JSON, and many more.' },
    { q: 'Do I need to create an account?', a: 'No account is needed. You can start using any tool instantly without entering passwords or sign-up information.' },
    { q: 'Can I use ToolSathi on mobile devices?', a: 'Yes, ToolSathi is fully responsive and designed to work smoothly on mobile phones, tablets, and desktop computers.' },
  ];

  return (
    <div className="home">
      {/* ===== Hero Section ===== */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-badge-wrap animate-fade-in">
            <span className="hero-badge-pill">
              <span className="hero-badge-icon">⚡</span>
              <span className="hero-badge-text">100% Free Tools</span>
            </span>
          </div>

          <h1 className="hero-title animate-fade-in">
            Every tool you need,<br />
            <span className="hero-title-accent">right in your browser.</span>
          </h1>

          <p className="hero-subtitle animate-fade-in-up">
            Convert files, edit PDFs, compress images, play videos, generate QR codes,
            and more — fast, free, and private. No uploads to unknown servers.
          </p>

          <form className="hero-search-form animate-fade-in-up" onSubmit={handleSearch}>
            <div className="hero-search-inner">
              <Search size={20} className="hero-search-icon" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="What do you want to do? (e.g. Compress PDF, resize image...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search for a tool"
              />
              <button type="submit" className="hero-search-btn">
                <span>Search</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="hero-suggestions animate-fade-in-up">
            <span className="hero-suggestions-label">Popular:</span>
            {['PDF Merge', 'Image Compressor', 'Video Player', 'QR Code', 'JSON Formatter'].map(s => (
              <Link
                key={s}
                to={`/tools?q=${encodeURIComponent(s)}`}
                className="hero-suggestion-pill"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Popular Tools Section ===== */}
      <section className="section" id="popular-tools">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Popular Tools</h2>
              <p className="section-description">Most used tools by our community</p>
            </div>
            <Link to="/tools" className="view-all-pill">
              <span>View All Tools</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="tools-grid">
            {featuredTools.map(tool => {
              const Icon = getIconComponent(tool.icon);
              const categoryObj = categories.find(c => c.id === tool.category);
              const catColor = categoryObj?.color || '#6366f1';

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
        </div>
      </section>

      {/* ===== Browse by Category ===== */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-description">Find the right tool or explore by what you need to do.</p>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map(cat => {
              const Icon = getIconComponent(cat.icon);
              const count = activeTools.filter(t => t.category === cat.id).length;

              return (
                <Link key={cat.id} to={`/category/${cat.id}`} className="category-card">
                  <div className="category-card-icon-wrap" style={{ background: `${cat.color}15` }}>
                    <Icon size={24} style={{ color: cat.color }} />
                  </div>
                  <div className="category-card-body">
                    <h3 className="category-card-name">{cat.name}</h3>
                    <p className="category-card-desc">{cat.description}</p>
                    <span className="category-card-count">{count} tool{count !== 1 ? 's' : ''}</span>
                  </div>
                  <ChevronRight size={18} className="category-card-arrow" />
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
            <div className="how-it-works-badge">
              <span className="badge badge-accent">✦ How It Works</span>
            </div>
            <h2 className="section-title">Simple, fast, and private</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Most tools work entirely in your browser — no file uploads to external servers required.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon-wrap">
                <Upload size={24} />
              </div>
              <h3 className="step-title">Upload or paste</h3>
              <p className="step-desc">Drop a file, paste text, or use our tool instantly.</p>
            </div>

            <div className="step-connector" aria-hidden="true">
              <ArrowRight size={20} />
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon-wrap">
                <Cpu size={24} />
              </div>
              <h3 className="step-title">Process locally</h3>
              <p className="step-desc">Your data stays on your device for maximum privacy.</p>
            </div>

            <div className="step-connector" aria-hidden="true">
              <ArrowRight size={20} />
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon-wrap">
                <Download size={24} />
              </div>
              <h3 className="step-title">Download result</h3>
              <p className="step-desc">Get your result in seconds. Clean, fast, and secure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Privacy Banner ===== */}
      <section className="section" id="privacy">
        <div className="container">
          <div className="privacy-card glass">
            <div className="privacy-icon-wrap">
              <Shield size={32} />
            </div>
            <div className="privacy-body">
              <h2 className="privacy-title">Your files stay with you</h2>
              <p className="privacy-text">
                Most conversions, compressions, and edits run in your browser using JavaScript APIs.
                Files are not uploaded to any external server unless explicitly required for a specific operation.
              </p>
              <Link to="/privacy" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
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
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Everything you need to know about ToolSathi and browser-based tools.
            </p>
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

      {/* ===== Stay Updated / Newsletter ===== */}
      <NewsletterSignup />
    </div>
  );
}
