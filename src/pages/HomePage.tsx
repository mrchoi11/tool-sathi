import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Star, Shield, Zap,
  CheckCircle2, Rocket
} from 'lucide-react';
import { categories, getFeaturedTools, getActiveTools } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import { usePageSeo } from '../hooks/usePageSeo';
import NewsletterSignup from '../components/NewsletterSignup';
import './HomePage.css';

/* ── Testimonials data ── */
const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Freelancer',
    avatar: 'PS',
    text: '"Super easy to use and saves so much time! ProToolBox has everything I need in one place."',
    stars: 5,
    color: '#6366f1',
  },
  {
    name: 'Rohit Mehta',
    role: 'Developer',
    avatar: 'RM',
    text: '"A must-have toolkit for professionals. Fast, reliable, and completely free — incredible value."',
    stars: 5,
    color: '#8b5cf6',
  },
  {
    name: 'Anjel Verma',
    role: 'Marketer',
    avatar: 'AV',
    text: '"Clean, fast and incredibly useful. I use the PDF and Image tools daily for my content work."',
    stars: 5,
    color: '#06b6d4',
  },
  {
    name: 'Sneha Rao',
    role: 'Designer',
    avatar: 'SR',
    text: '"The background remover and image compressor are game-changers. No other site does it this well."',
    stars: 5,
    color: '#ec4899',
  },
];

/* ══════════════════════════════════════════════
   3D CAROUSEL HOOK
══════════════════════════════════════════════ */
function use3DCarousel(total: number, autoPlayMs = 0) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    setActive(((idx % total) + total) % total);
  }, [total]);

  const prev = useCallback(() => setActive(a => ((a - 1) % total + total) % total), [total]);
  const next = useCallback(() => setActive(a => (a + 1) % total), [total]);

  const startTimer = useCallback(() => {
    if (autoPlayMs <= 0) return;
    timerRef.current = window.setInterval(() => {
      setActive(a => (a + 1) % total);
    }, autoPlayMs);
  }, [autoPlayMs, total]);

  const pause = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resume = useCallback(() => {
    pause();
    startTimer();
  }, [pause, startTimer]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  return { active, goTo, prev, next, pause, resume };
}

/* ══════════════════════════════════════════════
   3D TOOLS CAROUSEL
══════════════════════════════════════════════ */
function ToolsCarousel3D() {
  const featured = getFeaturedTools().slice(0, 8);
  const total = featured.length;
  const { active, goTo, prev, next, pause, resume } = use3DCarousel(total, 3500);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    pause();
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const dt = Date.now() - touchStartTime.current;
    if (Math.abs(diff) > 40 && dt < 400) { diff > 0 ? next() : prev(); }
    resume();
  };

  const getPos = (i: number) => {
    const rel = ((i - active) % total + total) % total;
    if (rel === 0) return 'center';
    if (rel === 1) return 'right1';
    if (rel === total - 1) return 'left1';
    if (rel === 2) return 'right2';
    if (rel === total - 2) return 'left2';
    return 'hidden';
  };

  return (
    <div
      className="carousel3d-wrapper"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <button className="carousel3d-arrow carousel3d-arrow-left" onClick={prev} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>

      <div className="carousel3d-stage">
        {featured.map((tool, i) => {
          const pos = getPos(i);
          const Icon = getIconComponent(tool.icon);
          const cat = categories.find(c => c.id === tool.category);
          const color = cat?.color || '#6366f1';
          return (
            <div
              key={tool.id}
              className={`carousel3d-card carousel3d-pos-${pos}`}
              onClick={() => { if (pos !== 'center') goTo(i); }}
            >
              <Link
                to={`/tools/${tool.slug}`}
                className="carousel3d-card-inner"
                tabIndex={pos === 'center' ? 0 : -1}
                onClick={e => { if (pos !== 'center') e.preventDefault(); }}
              >
                <div className="carousel3d-icon-wrap" style={{ background: `${color}18` }}>
                  <Icon size={32} style={{ color }} />
                </div>
                <div className="carousel3d-body">
                  <span className="carousel3d-name">{tool.name}</span>
                  <p className="carousel3d-desc">{tool.description}</p>
                </div>
                <span className="carousel3d-cta">Open Tool <ArrowRight size={13} /></span>
              </Link>
            </div>
          );
        })}
      </div>

      <button className="carousel3d-arrow carousel3d-arrow-right" onClick={next} aria-label="Next">
        <ChevronRight size={20} />
      </button>

      <div className="carousel3d-dots">
        {featured.map((_, i) => (
          <button
            key={i}
            className={`carousel3d-dot${i === active ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   3D CATEGORY CAROUSEL
══════════════════════════════════════════════ */
function CategoryCarousel3D() {
  const activeTools = getActiveTools();
  const total = categories.length;
  const { active, goTo, prev, next, pause, resume } = use3DCarousel(total, 4000);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    pause();
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const dt = Date.now() - touchStartTime.current;
    if (Math.abs(diff) > 40 && dt < 400) { diff > 0 ? next() : prev(); }
    resume();
  };

  const getPos = (i: number) => {
    const rel = ((i - active) % total + total) % total;
    if (rel === 0) return 'center';
    if (rel === 1) return 'right1';
    if (rel === total - 1) return 'left1';
    if (rel === 2) return 'right2';
    if (rel === total - 2) return 'left2';
    return 'hidden';
  };

  return (
    <div
      className="carousel3d-wrapper cat3d-wrapper"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <button className="carousel3d-arrow carousel3d-arrow-left" onClick={prev} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>

      <div className="carousel3d-stage cat3d-stage">
        {categories.map((cat, i) => {
          const pos = getPos(i);
          const Icon = getIconComponent(cat.icon);
          const count = activeTools.filter(t => t.category === cat.id).length;
          return (
            <div
              key={cat.id}
              className={`carousel3d-card cat3d-card carousel3d-pos-${pos}`}
              onClick={() => { if (pos !== 'center') goTo(i); }}
            >
              <Link
                to={`/category/${cat.id}`}
                className="cat3d-inner"
                tabIndex={pos === 'center' ? 0 : -1}
                onClick={e => { if (pos !== 'center') e.preventDefault(); }}
              >
                <div className="cat3d-icon-wrap" style={{ background: `${cat.color}18`, borderColor: `${cat.color}30` }}>
                  <Icon size={28} style={{ color: cat.color }} />
                </div>
                <span className="cat3d-name">{cat.name}</span>
                <span className="cat3d-count">{count} tools</span>
              </Link>
            </div>
          );
        })}
      </div>

      <button className="carousel3d-arrow carousel3d-arrow-right" onClick={next} aria-label="Next">
        <ChevronRight size={20} />
      </button>

      <div className="carousel3d-dots">
        {categories.map((_, i) => (
          <button
            key={i}
            className={`carousel3d-dot${i === active ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Category ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Testimonials Carousel ── */
function TestimonialsCarousel() {
  const total = testimonials.length;
  const { active, goTo, prev, next, pause, resume } = use3DCarousel(total, 5000);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    pause();
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const dt = Date.now() - touchStartTime.current;
    if (Math.abs(diff) > 40 && dt < 400) { diff > 0 ? next() : prev(); }
    resume();
  };

  const getVisible = (i: number) => {
    const rel = ((i - active) % total + total) % total;
    if (rel === 0) return 'tc-center';
    if (rel === 1) return 'tc-right';
    if (rel === total - 1) return 'tc-left';
    return 'tc-hidden';
  };

  return (
    <div
      className="tc-wrapper"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <button className="carousel3d-arrow tc-arrow-left" onClick={prev} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>

      <div className="tc-stage">
        {testimonials.map((t, i) => {
          const cls = getVisible(i);
          return (
            <div key={i} className={`tc-card ${cls}`}>
              <div className="testimonial-stars">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}>
                  {t.avatar}
                </div>
                <div>
                  <span className="testimonial-name">{t.name}</span>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="carousel3d-arrow tc-arrow-right" onClick={next} aria-label="Next">
        <ChevronRight size={20} />
      </button>

      <div className="carousel3d-dots tc-dots">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`carousel3d-dot${i === active ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Review ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  usePageSeo(
    'page-home',
    'ProToolBox — Free Online Tools for Video, PDF, Image & More',
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
    { q: 'Is ProToolBox completely free to use?', a: 'Yes, all core tools are 100% free to use. Most processing happens right inside your browser without subscription fees or forced registration.' },
    { q: 'Are my files safe and private?', a: 'Yes! Most tools process your files directly inside your browser using client-side JavaScript and WebAssembly. Your files are not uploaded to external servers.' },
    { q: 'What file formats are supported?', a: 'We support a comprehensive range of formats including PDF, JPG, PNG, WebP, SVG, MP4, WebM, MP3, WAV, SRT, VTT, CSV, JSON, and many more.' },
    { q: 'Do I need to create an account?', a: 'No account is needed. You can start using any tool instantly without entering passwords or sign-up information.' },
    { q: 'Can I use ProToolBox on mobile devices?', a: 'Yes, ProToolBox is fully responsive and designed to work smoothly on mobile phones, tablets, and desktop computers.' },
  ];

  const floaters = [
    { label: 'PDF', emoji: '📄', delay: '0s',   top: '15%', right: '12%',  size: 56 },
    { label: 'IMG', emoji: '🖼️', delay: '0.6s',  top: '55%', right: '5%',   size: 50 },
    { label: 'VID', emoji: '🎬', delay: '1.2s',  top: '30%', right: '48%',  size: 46 },
    { label: 'QR',  emoji: '📲', delay: '0.3s',  top: '70%', right: '32%',  size: 44 },
    { label: 'TXT', emoji: '✍️', delay: '0.9s',  top: '8%',  right: '36%',  size: 48 },
    { label: 'ZIP', emoji: '📦', delay: '1.5s',  top: '80%', right: '14%',  size: 42 },
  ];

  return (
    <div className="home">

      {/* ═══ HERO ═══ */}
      <section className="hero hero-split">
        <div className="container hero-split-inner">

          {/* LEFT */}
          <div className="hero-left animate-fade-in">
            <div className="hero-badge-wrap">
              <span className="hero-badge-pill">
                <span className="hero-badge-text">Free Online Tools</span>
              </span>
            </div>

            <h1 className="hero-title">
              Work Smarter,<br />
              <span className="hero-title-accent">Not Harder</span>
            </h1>

            <p className="hero-subtitle">
              Discover powerful, easy-to-use online tools to simplify your work,
              boost productivity and save time. Free, fast &amp; private.
            </p>

            <form className="hero-search-form" onSubmit={handleSearch}>
              <div className="hero-search-inner">
                <Search size={20} className="hero-search-icon" />
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Search for tools (e.g. PDF, image, SEO…)"
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

            <div className="hero-trust-row">
              <span className="hero-trust-badge"><CheckCircle2 size={14} /> 100% Free</span>
              <span className="hero-trust-badge"><CheckCircle2 size={14} /> No Signup</span>
              <span className="hero-trust-badge"><CheckCircle2 size={14} /> Fast &amp; Secure</span>
            </div>

            <div className="hero-suggestions">
              <span className="hero-suggestions-label">Popular:</span>
              {['PDF Merge', 'Image Compressor', 'Video Player', 'QR Code', 'JSON Formatter'].map(s => (
                <Link key={s} to={`/tools?q=${encodeURIComponent(s)}`} className="hero-suggestion-pill">{s}</Link>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-right animate-fade-in-right">
            <div className="hero-visual">
              <div className="hero-browser-frame">
                <div className="hero-browser-bar">
                  <span className="hero-browser-dot red" />
                  <span className="hero-browser-dot yellow" />
                  <span className="hero-browser-dot green" />
                  <div className="hero-browser-url">protoolbox.in</div>
                </div>
                <div className="hero-browser-body">
                  <div className="hero-browser-grid">
                    {featuredTools.slice(0, 6).map(tool => {
                      const Icon = getIconComponent(tool.icon);
                      const cat = categories.find(c => c.id === tool.category);
                      const color = cat?.color || '#6366f1';
                      return (
                        <div key={tool.id} className="hero-mini-tool-card">
                          <div className="hero-mini-icon" style={{ background: `${color}20` }}>
                            <Icon size={18} style={{ color }} />
                          </div>
                          <span>{tool.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {floaters.map((f, i) => (
                <div
                  key={i}
                  className="hero-floater"
                  style={{
                    top: f.top,
                    right: f.right,
                    animationDelay: f.delay,
                    width: f.size,
                    height: f.size,
                    fontSize: f.size * 0.45,
                  }}
                >
                  {f.emoji}
                </div>
              ))}
              <div className="hero-orbital-ring" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ POPULAR TOOLS 3D CAROUSEL ═══ */}
      <section className="section" id="popular-tools">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Explore Our Top Tools</h2>
              <p className="section-description">Powerful tools at your fingertips.</p>
            </div>
            <Link to="/tools" className="view-all-pill">
              <span>View All Tools</span>
              <ArrowRight size={15} />
            </Link>
          </div>
          <ToolsCarousel3D />
        </div>
      </section>

      {/* ═══ BROWSE BY CATEGORY ═══ */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by Category</h2>
            </div>
            <Link to="/tools" className="view-all-pill">
              View All Categories <ArrowRight size={15} />
            </Link>
          </div>
          <CategoryCarousel3D />
        </div>
      </section>

      {/* ═══ SEO CONTENT SECTION ═══ */}
      <section className="section seo-content-section" id="about-protoolbox">
        <div className="container">
          <div className="seo-content-card">
            <div className="seo-content-top">
              <span className="seo-eyebrow">✦ Why ProToolBox?</span>
              <h2 className="seo-content-title">Your All-in-One Digital Workspace — Free, Fast &amp; Private</h2>
            </div>
            <div className="seo-content-body">
              <p>
                Imagine having a <strong>Swiss Army knife for the digital world</strong> — except it lives in your browser, costs nothing, and never asks for your data. That's ProToolBox in a nutshell. Whether you're a student racing to meet a deadline, a designer polishing visuals at midnight, or a developer debugging on the go, we've built tools that actually fit the way real people work.
              </p>
              <p>
                Every tool on ProToolBox is built with one philosophy: <em>get out of your way</em>. No sign-up walls. No "free trial" countdowns. No dark patterns nudging you toward a paid plan. Just open, use, done. That's why over <strong>50,000+ users</strong> visit ProToolBox every month — because sometimes you just need something to <em>work right now</em>.
              </p>
              <div className="seo-highlights-grid">
                <div className="seo-highlight-card">
                  <span className="seo-highlight-emoji">🔒</span>
                  <h3>100% Private by Design</h3>
                  <p>Most of our tools — image compressor, PDF merger, background remover — run entirely inside your browser. Your files never leave your device.</p>
                </div>
                <div className="seo-highlight-card">
                  <span className="seo-highlight-emoji">⚡</span>
                  <h3>Built for Speed</h3>
                  <p>No heavy server roundtrips. We use WebAssembly and modern JavaScript APIs so processing happens in milliseconds, not minutes.</p>
                </div>
                <div className="seo-highlight-card">
                  <span className="seo-highlight-emoji">🛠️</span>
                  <h3>75+ Tools, One Place</h3>
                  <p>PDF tools, image converters, video downloaders, SEO utilities, code formatters — if you need it daily, we probably have it.</p>
                </div>
                <div className="seo-highlight-card">
                  <span className="seo-highlight-emoji">📱</span>
                  <h3>Works on Every Device</h3>
                  <p>Fully responsive from 320px mobile screens to 4K desktops. Same clean experience, every time, everywhere.</p>
                </div>
              </div>
              <p>
                From compressing a 5MB JPEG before sending it to a client, to merging dozens of PDFs for a project report, to generating a QR code for your small business flyer — ProToolBox handles the mundane tasks <strong>so you can focus on what actually matters</strong>. We're not trying to replace professional software. We're filling the gap for the moments when you need something simple, fast, and trustworthy.
              </p>
              <p>
                We're constantly adding new tools based on what our community needs. Got a request? Drop us a message on our Contact page. This is a living toolkit, and it grows because <em>you</em> tell us what's missing.
              </p>
              <div className="seo-cta-row">
                <Link to="/tools" className="seo-cta-btn primary">Explore All Tools <ArrowRight size={15} /></Link>
                <Link to="/about" className="seo-cta-btn secondary">Our Story →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY CHOOSE ═══ */}
      <section className="section why-section" id="why">
        <div className="container why-inner">
          <div className="why-left">
            <h2 className="why-title">Powerful. <span className="why-accent">Fast.</span> Free.</h2>
            <p className="why-subtitle">
              Everything you need in one place to get more done, effortlessly.
            </p>
            <ul className="why-features">
              <li><CheckCircle2 size={18} className="why-check" /> 100% Free to use</li>
              <li><CheckCircle2 size={18} className="why-check" /> Lightning Fast Performance</li>
              <li><CheckCircle2 size={18} className="why-check" /> No Signup Required</li>
              <li><CheckCircle2 size={18} className="why-check" /> Secure &amp; Private</li>
            </ul>
            <Link to="/tools" className="btn btn-primary why-cta">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>

          <div className="why-right">
            <div className="laptop-mockup">
              <div className="laptop-screen">
                <div className="laptop-screen-inner">
                  <div className="laptop-preview-grid">
                    {activeTools.slice(0, 9).map(tool => {
                      const Icon = getIconComponent(tool.icon);
                      const cat = categories.find(c => c.id === tool.category);
                      const color = cat?.color || '#6366f1';
                      return (
                        <div key={tool.id} className="laptop-preview-card">
                          <Icon size={16} style={{ color }} />
                          <span>{tool.name.split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="laptop-base" />
              <div className="laptop-stand" />
            </div>
            <div className="why-badge why-badge-1">
              <Zap size={16} />
              <span>Blazing Fast</span>
            </div>
            <div className="why-badge why-badge-2">
              <Shield size={16} />
              <span>100% Secure</span>
            </div>
            <div className="why-badge why-badge-3">
              <Rocket size={16} />
              <span>Boost Productivity</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="section testimonials-section" id="testimonials">
        <div className="container">
          <div className="section-header section-header-center">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Join thousands of happy users who love ProToolBox.
            </p>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ═══ PROMO BANNER ═══ */}
      <section className="section promo-banner-section">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-rocket-wrap" aria-hidden="true">
              <div className="promo-cloud promo-cloud-1" />
              <div className="promo-cloud promo-cloud-2" />
              <span className="promo-rocket-emoji">🚀</span>
            </div>
            <div className="promo-text">
              <h2 className="promo-title">Ready to Get Started?</h2>
              <p className="promo-desc">Explore our tools and make your work easier today.</p>
            </div>
            <Link to="/tools" className="promo-cta-btn">
              Browse All Tools <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header section-header-center">
            <h2 className="section-title">Simple, Fast, and Private</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Most tools work entirely in your browser — no file uploads to external servers required.
            </p>
          </div>
          <div className="steps-container">
            {[
              { n: '1', icon: '📁', title: 'Upload or paste', desc: 'Drop a file, paste text, or use our tool instantly.' },
              { n: '2', icon: '⚙️', title: 'Process locally', desc: 'Your data stays on your device for maximum privacy.' },
              { n: '3', icon: '⬇️', title: 'Download result', desc: 'Get your result in seconds. Clean, fast, and secure.' },
            ].map((step, i) => (
              <div key={i} className="step-card-new">
                <div className="step-emoji">{step.icon}</div>
                <div className="step-number-badge">{step.n}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-header section-header-center">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Everything you need to know about ProToolBox and browser-based tools.
            </p>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item${faqOpen === i ? ' faq-open' : ''}`}>
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

      {/* ═══ NEWSLETTER ═══ */}
      <NewsletterSignup />
    </div>
  );
}
