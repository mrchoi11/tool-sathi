import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import { usePageSeo } from '../hooks/usePageSeo';
import './BlogPage.css';

const POSTS_PER_PAGE = 8;

/* ─── 3D Perspective Tilt Hook ────────────────────────────────────────── */
function useTilt(strength = 8) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateY(-5px) scale(1.015)`;
    el.style.transition = 'transform 0.08s linear';
  }, [strength]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/* ─── Intersection Observer Reveal Hook ──────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          obs.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const CAT_COLORS: Record<string, string> = {
  Video: '#6366f1',
  PDF: '#8b5cf6',
  Tech: '#0ea5e9',
  SEO: '#10b981',
  Productivity: '#f59e0b',
};

/* ─── SVG Connectors & Circuit Components ────────────────────────────── */
function CircuitVLine({ height = 48, className = '' }: { height?: number; className?: string }) {
  return (
    <svg
      className={`circuit-line circuit-line--v ${className}`}
      width="2"
      height={height}
      viewBox={`0 0 2 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="1" y1="0" x2="1" y2={height} stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}

function CircuitBranchSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`circuit-branch-svg ${className}`}
      viewBox="0 0 600 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Central trunk to left and right branches */}
      <path d="M 300 0 L 300 24 Q 300 36 288 36 L 140 36 Q 128 36 128 48 L 128 64" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M 300 24 Q 300 36 312 36 L 460 36 Q 472 36 472 48 L 472 64" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M 300 24 L 300 64" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Node Dots */}
      <circle cx="300" cy="24" r="3.5" fill="#6366f1" />
      <circle cx="128" cy="36" r="3" fill="#8b5cf6" />
      <circle cx="472" cy="36" r="3" fill="#0ea5e9" />
    </svg>
  );
}

/* ─── Media Player Card (Exact replica of Reference Image video cards) ─ */
function MediaPlayerCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const revealRef = useReveal();
  const tilt = useTilt(7);
  const color = CAT_COLORS[post.category] || '#6366f1';

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="node-card node-card--media reveal-node"
      style={{ animationDelay: `${delay}ms`, '--glow-color': color } as React.CSSProperties}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* Top Media Mockup Player Screen */}
      <Link to={`/blog/${post.slug}`} className="media-player-screen" aria-label={`Play ${post.title}`}>
        <div className="player-screen-header">
          <div className="player-badge">
            <span className="player-badge-icon">▶</span>
            <span>TERABOX PLAYER</span>
          </div>
          <span className="player-hd">HD 1080P</span>
        </div>

        {/* Center glowing play button */}
        <div className="player-center-play">
          <div className="player-play-pulse" />
          <div className="player-play-btn">
            <Play size={18} fill="#ffffff" stroke="none" />
          </div>
        </div>

        {/* Mock scrubber controls */}
        <div className="player-controls-bar">
          <div className="player-progress-track">
            <div className="player-progress-fill" style={{ width: '42%' }} />
          </div>
          <div className="player-meta-row">
            <span>04:18 / 14:20</span>
            <span>Cloud Stream</span>
          </div>
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="node-card__body">
        <div className="node-card__meta">
          <span className="node-card__cat-pill" style={{ color, background: `${color}16` }}>
            {post.category}
          </span>
          <span className="meta-divider">·</span>
          <Clock size={11} /> {post.readTime}
          <span className="meta-divider">·</span>
          <Calendar size={11} /> {post.publishedAt}
        </div>

        <h3 className="node-card__title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="node-card__excerpt">{post.excerpt}</p>

        <div className="node-card__footer">
          <div className="node-card__author">
            <img src={post.author.avatar} alt={post.author.name} loading="lazy" />
            <span>{post.author.name}</span>
          </div>
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Watch Guide <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Standard Clean Tech Card ───────────────────────────────────────── */
function ArticleCard({ post, delay = 0, isWide = false }: { post: BlogPost; delay?: number; isWide?: boolean }) {
  const revealRef = useReveal();
  const tilt = useTilt(6);
  const color = CAT_COLORS[post.category] || '#6366f1';

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`node-card node-card--article ${isWide ? 'node-card--wide' : ''} reveal-node`}
      style={{ animationDelay: `${delay}ms`, '--glow-color': color } as React.CSSProperties}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <Link to={`/blog/${post.slug}`} className="node-card__img-link">
        <img src={post.coverImage} alt={post.title} loading="lazy" />
        <span className="node-card__cat-badge" style={{ background: color }}>
          {post.category}
        </span>
      </Link>

      <div className="node-card__body">
        <div className="node-card__meta">
          <Clock size={11} /> {post.readTime}
          <span className="meta-divider">·</span>
          <Calendar size={11} /> {post.publishedAt}
        </div>

        <h3 className="node-card__title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="node-card__excerpt">{post.excerpt}</p>

        <div className="node-card__footer">
          <div className="node-card__author">
            <img src={post.author.avatar} alt={post.author.name} loading="lazy" />
            <span>{post.author.name}</span>
          </div>
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Compact Branch Node Card ───────────────────────────────────────── */
function CompactCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const revealRef = useReveal();
  const tilt = useTilt(5);
  const color = CAT_COLORS[post.category] || '#6366f1';

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="node-card node-card--compact reveal-node"
      style={{ animationDelay: `${delay}ms`, '--glow-color': color } as React.CSSProperties}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="node-card__body">
        <div className="node-card__meta">
          <span className="compact-dot" style={{ background: color }} />
          <span className="compact-cat" style={{ color }}>{post.category}</span>
          <span className="meta-divider">·</span>
          <Clock size={11} /> {post.readTime}
        </div>

        <h4 className="node-card__title node-card__title--compact">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <div className="node-card__footer compact-footer">
          <span className="compact-author">{post.author.name}</span>
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Open <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Organic Branching Tree System ──────────────────────────────────── */
function OrganicTree({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  // Split posts into left and right branches for asymmetric placement
  const leftBranch = posts.filter((_, idx) => idx % 2 === 0);
  const rightBranch = posts.filter((_, idx) => idx % 2 === 1);

  return (
    <div className="organic-tree-container">
      {/* Top Branching SVG connecting into 2 asymmetric paths */}
      <CircuitBranchSvg className="tree-top-branch" />

      <div className="organic-tree-columns">
        {/* Left Column Branch */}
        <div className="tree-branch-col tree-branch-col--left">
          <div className="branch-tag-pill">
            <span className="branch-dot" style={{ background: '#6366f1' }} />
            <span>Streaming & Video Nodes</span>
          </div>

          <div className="branch-cards-stack">
            {leftBranch.map((post, i) => {
              const isMedia = post.category === 'Video' && i % 2 === 1;
              return (
                <div key={post.id} className="tree-card-wrapper">
                  {i > 0 && <CircuitVLine height={32} className="node-connector-line" />}
                  {isMedia ? (
                    <MediaPlayerCard post={post} delay={i * 90} />
                  ) : (
                    <ArticleCard post={post} delay={i * 90} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Circuit Spine */}
        <div className="tree-spine" aria-hidden="true">
          <div className="spine-top-dot" />
          <div className="spine-dash-line" />
          <div className="spine-mid-node">
            <Sparkles size={14} className="spine-node-icon" />
          </div>
          <div className="spine-dash-line" />
          <div className="spine-bot-dot" />
        </div>

        {/* Right Column Branch */}
        <div className="tree-branch-col tree-branch-col--right">
          <div className="branch-tag-pill">
            <span className="branch-dot" style={{ background: '#8b5cf6' }} />
            <span>PDF & Cloud Architecture</span>
          </div>

          <div className="branch-cards-stack">
            {rightBranch.map((post, i) => {
              const isMedia = post.category === 'Video' && i === 0;
              const isCompact = i === rightBranch.length - 1;
              return (
                <div key={post.id} className="tree-card-wrapper">
                  {i > 0 && <CircuitVLine height={32} className="node-connector-line" />}
                  {isMedia ? (
                    <MediaPlayerCard post={post} delay={120 + i * 90} />
                  ) : isCompact ? (
                    <CompactCard post={post} delay={120 + i * 90} />
                  ) : (
                    <ArticleCard post={post} delay={120 + i * 90} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN BLOG PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  usePageSeo(
    'page-blog',
    'ProToolBox Insights, Guides & Tutorials | ProToolBox',
    'Read our expert articles and tutorials on cloud video streaming, client-side PDF architectures, web performance, and modern online developer tools.'
  );

  useEffect(() => {
    getPublishedPosts()
      .then((posts) => {
        setAllPosts(posts);
        setLoadingPosts(false);
      })
      .catch(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(allPosts.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'All' || post.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [allPosts, searchQuery, selectedCategory]);

  const isFiltering = !!(searchQuery || selectedCategory !== 'All');
  const featuredPost = !isFiltering && allPosts.length > 0 ? allPosts[0] : null;
  const gridPosts = isFiltering ? filteredPosts : filteredPosts.slice(1);

  const totalPages = Math.max(1, Math.ceil(gridPosts.length / POSTS_PER_PAGE));
  const pagedPosts = gridPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const sidebarCategories = useMemo(
    () =>
      categories
        .filter((c) => c !== 'All')
        .map((c) => ({
          name: c,
          count: allPosts.filter((p) => p.category === c).length,
        })),
    [categories, allPosts]
  );

  /* Featured dark card tilt */
  const featuredTilt = useTilt(6);
  const featuredReveal = useReveal();

  return (
    <div className="blog-page">
      <div className="container">
        {/* ─── HERO SECTION ─────────────────────────────────────────── */}
        <section className="blog-hero">
          <div className="blog-hero__pill">
            <span className="hero-pill-dot" />
            <span>Knowledge Base &amp; Guides</span>
          </div>

          <h1 className="blog-title">
            ProToolBox <span className="blog-title-gradient">Insights &amp; Tutorials</span>
          </h1>

          <p className="blog-subtitle">
            Expert articles on cloud video streaming, client-side PDF architectures, and modern developer productivity.
          </p>

          {/* Search Bar */}
          <div className="blog-search-wrapper">
            <Search size={18} className="blog-search-icon" />
            <input
              type="text"
              placeholder="Search tutorials, TeraBox tips, PDF tools…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search-input"
              aria-label="Search articles"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="blog-categories" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`blog-cat-btn${selectedCategory === cat ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ─── MAIN BODY LAYOUT (Tree Column + Sidebar) ─────────────── */}
        <div className="blog-body-layout">
          {/* Main Content Column */}
          <div className="blog-main-col">
            {/* Featured Guide Dark Card (Only on default view) */}
            {featuredPost && !isFiltering && (
              <div
                ref={(node) => {
                  (featuredReveal as React.MutableRefObject<HTMLDivElement | null>).current = node;
                  (featuredTilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                }}
                className="featured-dark reveal-node"
                onMouseMove={featuredTilt.onMouseMove}
                onMouseLeave={featuredTilt.onMouseLeave}
              >
                <div className="featured-dark__glow" aria-hidden="true" />
                <div className="featured-dark__glow2" aria-hidden="true" />
                <div className="featured-dark__grid-bg" aria-hidden="true" />

                <div className="featured-dark__inner">
                  <div className="featured-dark__badge-row">
                    <span className="featured-dark__badge">
                      <span className="featured-dark__badge-dot" />
                      FEATURED GUIDE
                    </span>
                    <span className="featured-dark__chip">High-Performance</span>
                  </div>

                  <h2 className="featured-dark__title">
                    <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>

                  <p className="featured-dark__excerpt">{featuredPost.excerpt}</p>

                  <div className="featured-dark__footer">
                    <div className="featured-dark__meta">
                      <span className="featured-dark__cat">{featuredPost.category}</span>
                      <span>
                        <Clock size={12} /> {featuredPost.readTime}
                      </span>
                      <span>
                        <Calendar size={12} /> {featuredPost.publishedAt}
                      </span>
                    </div>

                    <Link to={`/blog/${featuredPost.slug}`} className="featured-dark__cta">
                      Deep Dive <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Tree Branch Junction Line from Featured Card */}
            {featuredPost && !isFiltering && pagedPosts.length > 0 && (
              <div className="spine-junction-wrap" aria-hidden="true">
                <div className="spine-junction-line" />
                <div className="spine-junction-dot" />
              </div>
            )}

            {/* Posts Grid: Loading / Empty / Filtered Flat / Organic Tree */}
            {loadingPosts ? (
              <div className="skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : pagedPosts.length === 0 ? (
              <div className="blog-empty">
                <BookOpen size={44} />
                <h3>No articles found</h3>
                <p>We could not find any guides matching "{searchQuery}". Try a different keyword or reset filters.</p>
                <button
                  type="button"
                  className="blog-empty-reset"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : isFiltering ? (
              /* Flat responsive grid when user searches or filters */
              <div className="flat-grid">
                {pagedPosts.map((post, i) =>
                  post.category === 'Video' ? (
                    <MediaPlayerCard key={post.id} post={post} delay={i * 60} />
                  ) : (
                    <ArticleCard key={post.id} post={post} delay={i * 60} />
                  )
                )}
              </div>
            ) : (
              /* Organic Circuit Tree Layout based on reference screenshot */
              <OrganicTree posts={pagedPosts} />
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-connector-line" aria-hidden="true" />
                <nav className="blog-pagination" aria-label="Blog pagination">
                  <button
                    type="button"
                    className="page-arrow"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`page-num${currentPage === n ? ' active' : ''}`}
                      onClick={() => {
                        setCurrentPage(n);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      aria-current={currentPage === n ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="page-arrow"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* ─── RIGHT SIDEBAR (Explore Categories + Recent Stream) ───── */}
          <aside className="blog-sidebar">
            {/* Category Explorer with Vertical Circuit Line */}
            <div className="sidebar-card sidebar-card--categories">
              <h3 className="sidebar-heading">Explore All Categories</h3>

              <div className="sidebar-cat-wrapper">
                <div className="sidebar-circuit-track" aria-hidden="true" />

                <ul className="sidebar-cat-list">
                  {sidebarCategories.map((cat) => {
                    const c = CAT_COLORS[cat.name] || '#6366f1';
                    const isActive = selectedCategory === cat.name;
                    return (
                      <li key={cat.name} className="sidebar-cat-item">
                        <button
                          type="button"
                          className={`sidebar-cat-btn${isActive ? ' active' : ''}`}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            window.scrollTo({ top: 200, behavior: 'smooth' });
                          }}
                          style={{ '--cat-color': c } as React.CSSProperties}
                        >
                          <span className="sidebar-cat-dot" style={{ background: c }} />
                          <span className="sidebar-cat-label">{cat.name} Tools</span>
                          <span className="sidebar-cat-count">{cat.count}</span>
                        </button>
                      </li>
                    );
                  })}

                  <li className="sidebar-cat-item">
                    <button
                      type="button"
                      className={`sidebar-cat-btn sidebar-cat-all${selectedCategory === 'All' ? ' active' : ''}`}
                      onClick={() => setSelectedCategory('All')}
                    >
                      <span className="sidebar-cat-dot" style={{ background: '#64748b' }} />
                      <span className="sidebar-cat-label">Explore all</span>
                      <ArrowRight size={13} className="sidebar-all-arrow" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Trending Insights Feed */}
            {allPosts.length > 1 && (
              <div className="sidebar-card sidebar-feed">
                <h3 className="sidebar-heading">Recent Posts</h3>
                <div className="sidebar-feed-list">
                  {allPosts.slice(0, 5).map((post) => {
                    const c = CAT_COLORS[post.category] || '#6366f1';
                    return (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="feed-item">
                        <span className="feed-item__badge" style={{ background: c }}>
                          {post.category}
                        </span>
                        <span className="feed-item__title">{post.title}</span>
                        <span className="feed-item__meta">
                          <Clock size={11} /> {post.readTime}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
