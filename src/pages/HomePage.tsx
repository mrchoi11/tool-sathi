import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import lottie from 'lottie-web/build/player/lottie_light.js';
import {
  Search, ArrowRight, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Star, Shield, Zap,
  CheckCircle2, Rocket, Sparkles, Users
} from 'lucide-react';
import { categories, getFeaturedTools, getActiveTools } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import { usePageSeo } from '../hooks/usePageSeo';
import NewsletterSignup from '../components/NewsletterSignup';
import './HomePage.css';

/* Testimonials data: Clean, professional, zero em dashes */
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
    text: '"A must-have toolkit for professionals. Fast, reliable, and completely free with incredible value."',
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

/* 3D Carousel Hook */
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

/* 3D Tools Carousel with engaging modern card design */
function ToolsCarousel3D() {
  const featured = getFeaturedTools().slice(0, 8);
  const total = featured.length;
  const { active, goTo, prev, next, pause, resume } = use3DCarousel(total, 3800);
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
    if (Math.abs(diff) > 35 && dt < 450) { diff > 0 ? next() : prev(); }
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
                style={{ '--card-color': color } as React.CSSProperties}
              >
                {/* Top accent line */}
                <div className="carousel3d-accent-bar" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

                {/* Top row: Icon and category badge */}
                <div className="carousel3d-top-row">
                  <div className="carousel3d-icon-wrap" style={{ background: `${color}15`, borderColor: `${color}30` }}>
                    <Icon size={26} style={{ color }} />
                  </div>
                  <span className="carousel3d-category-badge" style={{ color, background: `${color}12`, borderColor: `${color}25` }}>
                    {cat?.name || 'Tool'}
                  </span>
                </div>

                {/* Body info */}
                <div className="carousel3d-body">
                  <span className="carousel3d-name">{tool.name}</span>
                  <p className="carousel3d-desc">{tool.description}</p>
                </div>

                {/* Bottom CTA pill */}
                <div className="carousel3d-footer">
                  <span className="carousel3d-cta" style={{ color }}>
                    Open Tool <ArrowRight size={14} />
                  </span>
                </div>
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

/* 3D Category Carousel with engaging modern card design */
function CategoryCarousel3D() {
  const activeTools = getActiveTools();
  const total = categories.length;
  const { active, goTo, prev, next, pause, resume } = use3DCarousel(total, 4200);
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
    if (Math.abs(diff) > 35 && dt < 450) { diff > 0 ? next() : prev(); }
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
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <div className="cat3d-accent-bar" style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}55)` }} />
                <div className="cat3d-icon-wrap" style={{ background: `${cat.color}15`, borderColor: `${cat.color}35`, boxShadow: `0 8px 20px ${cat.color}25` }}>
                  <Icon size={28} style={{ color: cat.color }} />
                </div>
                <span className="cat3d-name">{cat.name}</span>
                <span className="cat3d-pill-badge" style={{ color: cat.color, background: `${cat.color}12`, borderColor: `${cat.color}30` }}>
                  {count} Tools
                </span>
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

/* Testimonials Carousel */
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
    if (Math.abs(diff) > 35 && dt < 450) { diff > 0 ? next() : prev(); }
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

/* SEO Content Section: Scroll-animated, humanized, zero em dashes, zero emojis */
function SeoContentSection() {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const highlights = [
    {
      title: 'In-Browser Processing',
      desc: 'Sensitive tasks like PDF merging, image compression, and format conversion execute directly in your browser. Files remain strictly on your device.',
      accent: '#4f46e5',
    },
    {
      title: 'Zero Latency Performance',
      desc: 'Built with optimized client scripts and WebAssembly to eliminate server round-trips. Conversions and edits finish in milliseconds.',
      accent: '#0284c7',
    },
    {
      title: 'Over 75 Practical Tools',
      desc: 'A comprehensive collection spanning PDF handling, graphic optimization, video tools, developer utilities, and daily calculation needs.',
      accent: '#059669',
    },
    {
      title: 'Accessible on Every Screen',
      desc: 'Engineered with responsive fluid layouts to deliver a clean, fast experience on smartphones, tablets, laptops, and ultra-wide desktop monitors.',
      accent: '#d97706',
    },
  ];

  return (
    <section
      className={`section seo-content-section${visible ? ' seo-visible' : ''}`}
      id="about-protoolbox"
      ref={sectionRef}
    >
      <div className="container">
        <div className="seo-content-card">

          {/* Header */}
          <div className="seo-header seo-anim seo-anim-0">
            <span className="seo-eyebrow">ABOUT PROTOOLBOX</span>
            <h2 className="seo-content-title">
              Built for People Who Just Need Tools That Work
            </h2>
          </div>

          {/* Intro paragraph: always visible */}
          <p className="seo-lead seo-anim seo-anim-1">
            ProToolBox provides a free, secure suite of digital tools designed for creators, developers, students, and professionals. Whether you need to compress high-resolution images, combine multiple PDF documents, convert multimedia files, or format structured data, every utility is built to deliver immediate results without mandatory sign-ups or subscription barriers.
          </p>

          {/* Highlight grid: always visible */}
          <div className="seo-highlights-grid seo-anim seo-anim-2">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="seo-highlight-card"
                style={{ borderTop: `3px solid ${h.accent}` }}
              >
                <h3 style={{ color: h.accent }}>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>

          {/* Expandable content via Read More button */}
          <div className={`seo-expanded-content${expanded ? ' open' : ''}`}>
            <h3>Client-Side Security and File Privacy</h3>
            <p>
              Traditional online conversion sites often upload sensitive files to unknown remote servers for processing, creating privacy concerns and bandwidth bottlenecks. ProToolBox approaches productivity differently by running compute-heavy tasks locally inside your browser using modern WebAssembly and JavaScript APIs. Your documents, photos, and personal data never leave your computer or smartphone, ensuring complete privacy and immediate turnaround times.
            </p>

            <h3>Comprehensive Utility Categories</h3>
            <p>
              Our platform organizes utilities into practical categories to help you solve everyday workflow challenges. Video tools allow convenient playback, format conversion, and media inspection. Image tools feature background removal, image resizing, lossless compression, and multi-format conversion between JPG, PNG, and WebP. Document utilities enable seamless merging, page splitting, compression, and text extraction for PDF workflows. For technical users, our developer section includes JSON formatters, Base64 encoders, URL decoders, and CSS generators.
            </p>

            <h3>Built for Daily Productivity Without Friction</h3>
            <p>
              We believe essential digital utilities should be open and accessible to all users. There are no daily usage caps, no forced registration forms, and no watermarks added to your finished files. With lightweight code and responsive architecture, ProToolBox loads quickly on mobile devices and desktop computers alike, helping you finish tasks and move forward with your day.
            </p>
          </div>

          {/* Read More button and navigation links */}
          <div className="seo-footer-row seo-anim seo-anim-3">
            <button
              type="button"
              className="seo-read-more-btn"
              onClick={() => setExpanded(prev => !prev)}
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Show Less' : 'Read More About ProToolBox'}</span>
              <ChevronDown size={16} className={`seo-read-more-icon${expanded ? ' flipped' : ''}`} />
            </button>
            <div className="seo-cta-row">
              <Link to="/tools" className="seo-cta-btn primary">
                Explore All Tools <ArrowRight size={14} />
              </Link>
              <Link to="/about" className="seo-cta-btn secondary">
                About Our Platform
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* Hero Lottie Animation Component */
function HeroLottie() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/hero-lottie.json',
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div className="hero-lottie-container" ref={containerRef} aria-label="ProToolBox workspace animation" />
  );
}

/* Main Home Page Component */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  usePageSeo(
    'page-home',
    'ProToolBox: Free Online Tools for Video, PDF, Image and More',
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

  return (
    <div className="home">

      {/* Hero Section: Centered Modern Layout with Lottie Animation under H1 */}
      <section className="hero">
        <div className="container hero-center-inner animate-fade-in">

          {/* Badge Pill */}
          <div className="hero-badge-wrap">
            <span className="hero-badge-pill">
              <span className="hero-badge-text">Free Online Tools</span>
            </span>
          </div>

          {/* Engaging Heading */}
          <h1 className="hero-title">
            Every Tool You Need to<br />
            <span className="hero-title-accent">Create, Convert &amp; Edit.</span>
          </h1>

          {/* Lottie Animation: Placed directly under H1 with tight margins */}
          <div className="hero-lottie-center-wrap">
            <div className="hero-lottie-backdrop" />
            <HeroLottie />
          </div>

          {/* Search Form */}
          <form className="hero-search-form" onSubmit={handleSearch}>
            <div className="hero-search-inner">
              <Search size={20} className="hero-search-icon" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search for tools (e.g. PDF, image, video, QR...)"
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

          {/* Trust Badges */}
          <div className="hero-trust-row">
            <span className="hero-trust-badge"><CheckCircle2 size={14} /> 100% Free</span>
            <span className="hero-trust-badge"><CheckCircle2 size={14} /> No Signup</span>
            <span className="hero-trust-badge"><CheckCircle2 size={14} /> Fast &amp; Secure</span>
          </div>

          {/* Popular Tool Pills */}
          <div className="hero-suggestions">
            <span className="hero-suggestions-label">Popular:</span>
            {['PDF Merge', 'Image Compressor', 'Video Player', 'QR Code', 'JSON Formatter'].map(s => (
              <Link key={s} to={`/tools?q=${encodeURIComponent(s)}`} className="hero-suggestion-pill">{s}</Link>
            ))}
          </div>

        </div>
      </section>

      {/* Popular Tools 3D Carousel */}
      <section className="section" id="popular-tools">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Explore Our Top Tools</h2>
              <p className="section-description">Handpicked utilities built for speed, privacy, and precision.</p>
            </div>
            <Link to="/tools" className="view-all-pill">
              <span>View All Tools</span>
              <ArrowRight size={15} />
            </Link>
          </div>
          <ToolsCarousel3D />
        </div>
      </section>

      {/* Browse by Category 3D Carousel */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-description">Find the right utility organized by your daily workflows.</p>
            </div>
            <Link to="/tools" className="view-all-pill">
              View All Categories <ArrowRight size={15} />
            </Link>
          </div>
          <CategoryCarousel3D />
        </div>
      </section>

      {/* SEO Content Section */}
      <SeoContentSection />

      {/* Why Choose Section */}
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

      {/* Testimonials */}
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

      {/* Promo Banner */}
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

      {/* How it works */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header section-header-center">
            <h2 className="section-title">Simple, Fast, and Private</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Most tools work entirely in your browser without requiring file uploads to external servers.
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

      {/* Frequently Asked Questions */}
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

      {/* Newsletter */}
      <NewsletterSignup />
    </div>
  );
}
