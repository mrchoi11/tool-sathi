import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import { usePageSeo } from '../hooks/usePageSeo';
import './BlogPage.css';

/* ─── 3D Perspective Tilt Hook (Preserved Exactly) ──────────────────────── */
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

/* ─── Intersection Observer Reveal Hook (Preserved Exactly) ─────────────── */
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
  Video: '#06b6d4',
  PDF: '#8b5cf6',
  Tech: '#0ea5e9',
  SEO: '#10b981',
  Productivity: '#f59e0b',
};

/* ─── Background Technical Wave Mesh (Inspired by Reference Image 1) ──── */
function BlogMeshWaves() {
  return (
    <div className="blog-mesh-bg" aria-hidden="true">
      <svg className="blog-mesh-svg" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
        <path d="M-100,120 C240,40 480,240 820,110 C1160,-20 1340,160 1600,80" stroke="rgba(6, 182, 212, 0.14)" strokeWidth="1.5" />
        <path d="M-80,180 C260,100 500,300 840,170 C1180,40 1360,220 1620,140" stroke="rgba(6, 182, 212, 0.09)" strokeWidth="1.2" strokeDasharray="6 4" />
        <path d="M-100,560 C320,440 600,680 940,510 C1280,340 1440,580 1600,480" stroke="rgba(14, 165, 233, 0.12)" strokeWidth="1.5" />
        <path d="M-60,620 C360,500 640,740 980,570 C1320,400 1480,640 1640,540" stroke="rgba(99, 102, 241, 0.08)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

/* ─── TeraBox Media Player Mockup Card (Exact Reference Replica) ──────── */
function TeraBoxPlayerCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const revealRef = useReveal();
  const tilt = useTilt(7);
  const color = CAT_COLORS[post.category] || '#06b6d4';

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
      <Link to={`/blog/${post.slug}`} className="player-mockup-screen" aria-label={`Open ${post.title}`}>
        <div className="player-screen-bar">
          <div className="player-brand-tag">
            <span className="player-brand-dot">▶</span>
            <span>TERABOX PLAYER</span>
          </div>
          <span className="player-res-tag">1080P HD</span>
        </div>

        <div className="player-center-action">
          <div className="player-ring-pulse" />
          <div className="player-play-disc">
            <Play size={16} fill="#ffffff" stroke="none" />
          </div>
        </div>

        <div className="player-bottom-hud">
          <div className="player-scrubber-track">
            <div className="player-scrubber-fill" style={{ width: '48%' }} />
          </div>
          <div className="player-hud-row">
            <span>04:18 / 14:20</span>
            <span>Cloud Stream</span>
          </div>
        </div>
      </Link>

      <div className="node-card__body">
        <div className="node-card__meta">
          <span className="node-card__cat-pill" style={{ color, background: `${color}15` }}>
            {post.category}
          </span>
          <span className="meta-sep">·</span>
          <Clock size={11} /> {post.readTime}
          <span className="meta-sep">·</span>
          <Calendar size={11} /> {post.publishedAt}
        </div>

        <h4 className="node-card__title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p className="node-card__excerpt">{post.excerpt}</p>

        <div className="node-card__footer">
          <div className="node-card__author">
            <img src={post.author.avatar} alt={post.author.name} loading="lazy" />
            <span>{post.author.name}</span>
          </div>
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Compact Editorial Card (for 3-Col Left Cluster) ─────────────────── */
function CompactEditorialCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const revealRef = useReveal();
  const tilt = useTilt(5);
  const color = CAT_COLORS[post.category] || '#06b6d4';

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="node-card node-card--editorial reveal-node"
      style={{ animationDelay: `${delay}ms`, '--glow-color': color } as React.CSSProperties}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="node-card__body">
        <div className="node-card__meta">
          <span className="editorial-dot" style={{ background: color }} />
          <span className="editorial-cat" style={{ color }}>{post.category}</span>
          <span className="meta-sep">·</span>
          <Clock size={11} /> {post.readTime}
          <span className="meta-sep">·</span>
          <Calendar size={11} /> {post.publishedAt}
        </div>

        <h4 className="node-card__title node-card__title--editorial">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p className="node-card__excerpt node-card__excerpt--editorial">{post.excerpt}</p>

        <div className="node-card__footer editorial-footer">
          <span className="editorial-author">{post.author.name}</span>
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Standard Thumbnail Card (for Right Discovery Cluster) ───────────── */
function StandardThumbCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const revealRef = useReveal();
  const tilt = useTilt(6);
  const color = CAT_COLORS[post.category] || '#06b6d4';

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="node-card node-card--thumb reveal-node"
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
          <span className="meta-sep">·</span>
          <Calendar size={11} /> {post.publishedAt}
        </div>

        <h4 className="node-card__title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p className="node-card__excerpt">{post.excerpt}</p>

        <div className="node-card__footer">
          <div className="node-card__author">
            <img src={post.author.avatar} alt={post.author.name} loading="lazy" />
            <span>{post.author.name}</span>
          </div>
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
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
    'ProToolBox Insights & Tutorials | ProToolBox',
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

  /* Featured dark card tilt */
  const featuredTilt = useTilt(6);
  const featuredReveal = useReveal();

  /* Distribute posts for Editorial Layout (Reference Image 1) */
  const featuredPost = allPosts.length > 0 ? allPosts[0] : null;
  const topStackedPost1 = allPosts.length > 1 ? allPosts[1] : null;
  const topStackedPost2 = allPosts.length > 2 ? allPosts[2] : null;

  // Left Cluster 3x3 (up to 9 posts)
  const leftClusterPosts = useMemo(() => {
    const pool = allPosts.slice(3);
    if (pool.length < 9) {
      // Loop or pad pool so all 9 slots in the 3x3 cluster are populated
      const padded = [...pool];
      while (padded.length < 9 && allPosts.length > 0) {
        padded.push(...allPosts);
      }
      return padded.slice(0, 9);
    }
    return pool.slice(0, 9);
  }, [allPosts]);

  // Right Discovery Cluster (4 posts)
  const rightClusterPosts = useMemo(() => {
    const pool = allPosts.slice(4);
    if (pool.length < 4) {
      return allPosts.slice(0, 4);
    }
    return pool.slice(0, 4);
  }, [allPosts]);

  // Sidebar Categories with count
  const sidebarCategories = useMemo(
    () => [
      { name: 'Video Tools', cat: 'Video', count: allPosts.filter((p) => p.category === 'Video').length + 4 },
      { name: 'PDF Tools', cat: 'PDF', count: allPosts.filter((p) => p.category === 'PDF').length + 2 },
      { name: 'Video Processing', cat: 'Video', count: 5 },
      { name: 'Image Tools', cat: 'Tech', count: allPosts.filter((p) => p.category === 'Tech').length + 3 },
      { name: 'Productivity', cat: 'Productivity', count: allPosts.filter((p) => p.category === 'Productivity').length },
      { name: 'SEO Tools', cat: 'SEO', count: allPosts.filter((p) => p.category === 'SEO').length },
    ],
    [allPosts]
  );

  return (
    <div className="blog-page">
      {/* Background Subtle Tech Wave Mesh */}
      <BlogMeshWaves />

      <div className="container blog-container">
        {/* ─── HERO SECTION (Clean & Spacious as per Reference 1) ──── */}
        <section className="blog-hero">
          <h1 className="blog-title">
            ProToolBox Insights &amp; Tutorials &amp; <br className="hero-br" />
            <span className="blog-title-gradient">Design Explorations</span>
          </h1>

          <p className="blog-subtitle">
            Expert articles on cloud streaming, client-side PDF architectures, and modern developer productivity.
          </p>

          {/* Compact Search Bar */}
          <div className="blog-search-wrapper">
            <Search size={16} className="blog-search-icon" />
            <input
              type="text"
              placeholder="Search tutorials, TeraBox tips, PDF tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search-input"
              aria-label="Search articles"
            />
          </div>

          {/* Small Category Filter Pills */}
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
                {cat === 'All' ? 'All' : cat}
              </button>
            ))}
          </div>
        </section>

        {/* ─── MAIN EDITORIAL DISCOVERY LAYOUT ──────────────────────── */}
        <div className="blog-editorial-layout">
          {/* Main Area (75% Width) */}
          <main className="blog-main-area">
            {loadingPosts ? (
              <div className="skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : isFiltering ? (
              /* Filtered / Search State: Flat Responsive Grid */
              <div className="filtered-results-wrap">
                <div className="filtered-header">
                  <h3>
                    Showing {filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'}
                    {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                    {searchQuery ? ` matching "${searchQuery}"` : ''}
                  </h3>
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                  >
                    Clear Filter
                  </button>
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="blog-empty">
                    <BookOpen size={44} />
                    <h3>No articles found</h3>
                    <p>Try searching with another keyword or pick another category.</p>
                  </div>
                ) : (
                  <div className="flat-grid">
                    {filteredPosts.map((post, i) =>
                      post.category === 'Video' ? (
                        <TeraBoxPlayerCard key={post.id} post={post} delay={i * 50} />
                      ) : (
                        <StandardThumbCard key={post.id} post={post} delay={i * 50} />
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Reference Image 1: Editorial Discovery Layout */
              <div className="discovery-tree-flow">
                {/* ─── ROW 1: Featured Card (Left) + 2 Stacked Cards (Right) ─ */}
                <div className="discovery-top-row">
                  {/* Left: Large Featured Article Card */}
                  {featuredPost && (
                    <div
                      ref={(node) => {
                        (featuredReveal as React.MutableRefObject<HTMLDivElement | null>).current = node;
                        (featuredTilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                      }}
                      className="featured-guide-card reveal-node"
                      onMouseMove={featuredTilt.onMouseMove}
                      onMouseLeave={featuredTilt.onMouseLeave}
                    >
                      <div className="featured-guide-glow" aria-hidden="true" />
                      <div className="featured-guide-blueprint" aria-hidden="true" />

                      <div className="featured-guide-content">
                        <div className="featured-guide-badge">
                          <span className="featured-badge-dot" />
                          FEATURED GUIDE
                        </div>

                        <h2 className="featured-guide-title">
                          <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                        </h2>

                        <p className="featured-guide-excerpt">{featuredPost.excerpt}</p>

                        <div className="featured-guide-footer">
                          <div className="featured-guide-meta">
                            <span className="featured-cat-tag">{featuredPost.category}</span>
                            <span>
                              <Clock size={12} /> {featuredPost.readTime}
                            </span>
                            <span>
                              <Calendar size={12} /> {featuredPost.publishedAt}
                            </span>
                          </div>

                          <Link to={`/blog/${featuredPost.slug}`} className="featured-guide-cta">
                            Deep Dive <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right: 2 Stacked Discovery Cards */}
                  <div className="discovery-top-stacked">
                    {topStackedPost1 && (
                      <div className="stacked-card-item">
                        <StandardThumbCard post={topStackedPost1} delay={100} />
                      </div>
                    )}
                    {topStackedPost2 && (
                      <div className="stacked-card-item">
                        <CompactEditorialCard post={topStackedPost2} delay={160} />
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── TIMELINE CIRCUIT CONNECTORS (SVG Branching) ──── */}
                <div className="discovery-timeline-divider" aria-hidden="true">
                  <svg
                    className="timeline-circuit-svg"
                    viewBox="0 0 960 72"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    {/* Central vertical trunk */}
                    <path
                      d="M 480 0 L 480 32"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    {/* Left curved branch */}
                    <path
                      d="M 480 32 Q 480 50 460 50 L 160 50 Q 140 50 140 72"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    {/* Right curved branch */}
                    <path
                      d="M 480 32 Q 480 50 500 50 L 800 50 Q 820 50 820 72"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    {/* Trunk continuation */}
                    <path
                      d="M 480 32 L 480 72"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    {/* Connection Dots */}
                    <circle cx="480" cy="32" r="4" fill="#06b6d4" />
                    <circle cx="140" cy="50" r="3.5" fill="#3b82f6" />
                    <circle cx="820" cy="50" r="3.5" fill="#8b5cf6" />
                  </svg>

                  {/* Small Route Tags along the Branch */}
                  <div className="timeline-route-capsules">
                    <span className="route-tag route-tag--video">Video</span>
                    <span className="route-tag route-tag--center">Stream</span>
                    <span className="route-tag route-tag--pdf">PDF Tools</span>
                  </div>
                </div>

                {/* ─── ROW 2: Asymmetric Discovery Clusters ─────────── */}
                <div className="discovery-clusters-row">
                  {/* Left Cluster: Dense 3-Column Grid */}
                  <div className="cluster-left-3col">
                    <div className="cluster-header-pill">
                      <span className="cluster-dot" style={{ background: '#06b6d4' }} />
                      <span>Video &amp; Architecture Nodes</span>
                    </div>

                    <div className="grid-3col">
                      {/* Row 1: Compact editorial cards */}
                      {leftClusterPosts.slice(0, 3).map((post, idx) => (
                        <CompactEditorialCard key={`l1-${post.id}-${idx}`} post={post} delay={idx * 60} />
                      ))}

                      {/* Row 2: Dark TeraBox Player cards */}
                      {leftClusterPosts.slice(3, 6).map((post, idx) => (
                        <TeraBoxPlayerCard key={`l2-${post.id}-${idx}`} post={post} delay={180 + idx * 60} />
                      ))}

                      {/* Row 3: Compact editorial cards */}
                      {leftClusterPosts.slice(6, 9).map((post, idx) => (
                        <CompactEditorialCard key={`l3-${post.id}-${idx}`} post={post} delay={360 + idx * 60} />
                      ))}
                    </div>
                  </div>

                  {/* Center Timeline Spine */}
                  <div className="cluster-spine-divider" aria-hidden="true">
                    <div className="spine-dot-node" />
                    <div className="spine-trace-line" />
                    <div className="spine-dot-node" />
                  </div>

                  {/* Right Cluster: Media & Showcase Cards */}
                  <div className="cluster-right-showcase">
                    <div className="cluster-header-pill">
                      <span className="cluster-dot" style={{ background: '#8b5cf6' }} />
                      <span>PDF &amp; Cloud Tools</span>
                    </div>

                    <div className="grid-2col-media">
                      {rightClusterPosts.slice(0, 2).map((post, idx) => (
                        <TeraBoxPlayerCard key={`r1-${post.id}-${idx}`} post={post} delay={120 + idx * 70} />
                      ))}
                      {rightClusterPosts.slice(2, 4).map((post, idx) => (
                        <StandardThumbCard key={`r2-${post.id}-${idx}`} post={post} delay={260 + idx * 70} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── PAGINATION (Connected to timeline trunk) ─────── */}
                <div className="timeline-pagination-section">
                  <div className="pagination-trunk-line" aria-hidden="true" />
                  <div className="pagination-node-cluster">
                    <button
                      type="button"
                      className="page-node-arrow"
                      onClick={() => window.scrollTo({ top: 350, behavior: 'smooth' })}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <button
                      type="button"
                      className={`page-node-btn${currentPage === 1 ? ' active' : ''}`}
                      onClick={() => {
                        setCurrentPage(1);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                    >
                      1
                    </button>

                    <button
                      type="button"
                      className={`page-node-btn${currentPage === 2 ? ' active' : ''}`}
                      onClick={() => {
                        setCurrentPage(2);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                    >
                      2
                    </button>

                    <button
                      type="button"
                      className={`page-node-btn${currentPage === 3 ? ' active' : ''}`}
                      onClick={() => {
                        setCurrentPage(3);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                    >
                      3
                    </button>

                    <button
                      type="button"
                      className="page-node-arrow"
                      onClick={() => window.scrollTo({ top: 350, behavior: 'smooth' })}
                      aria-label="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ─── RIGHT SIDEBAR (25% Width - Exact Reference Replica) ──── */}
          <aside className="blog-editorial-sidebar">
            {/* Explore All Categories with Vertical Timeline */}
            <div className="sidebar-timeline-card">
              <h3 className="sidebar-section-title">Explore All Categories</h3>

              <div className="sidebar-timeline-track-wrap">
                <div className="sidebar-vertical-timeline-line" aria-hidden="true" />

                <ul className="sidebar-timeline-list">
                  {sidebarCategories.map((cat, idx) => {
                    const c = CAT_COLORS[cat.cat] || '#06b6d4';
                    const isActive = selectedCategory === cat.cat;
                    return (
                      <li key={cat.name} className="sidebar-timeline-item">
                        <button
                          type="button"
                          className={`sidebar-timeline-btn${isActive ? ' active' : ''}`}
                          onClick={() => {
                            setSelectedCategory(cat.cat);
                            window.scrollTo({ top: 250, behavior: 'smooth' });
                          }}
                        >
                          <span
                            className="sidebar-timeline-dot"
                            style={{ background: c, borderColor: '#ffffff' }}
                          />
                          <span className="sidebar-timeline-name">{cat.name}</span>
                          <span className="sidebar-timeline-badge">{cat.count}</span>
                        </button>
                      </li>
                    );
                  })}

                  <li className="sidebar-timeline-item">
                    <button
                      type="button"
                      className={`sidebar-timeline-btn sidebar-timeline-all${selectedCategory === 'All' ? ' active' : ''}`}
                      onClick={() => setSelectedCategory('All')}
                    >
                      <span className="sidebar-timeline-dot" style={{ background: '#64748b' }} />
                      <span className="sidebar-timeline-name">Explore all</span>
                      <ArrowRight size={13} className="sidebar-arrow" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Recent Posts Stream with Connected Nodes */}
            {allPosts.length > 0 && (
              <div className="sidebar-timeline-card sidebar-stream-card">
                <h3 className="sidebar-section-title">Recent Posts</h3>

                <div className="sidebar-stream-list">
                  {allPosts.slice(0, 5).map((post, idx) => {
                    const c = CAT_COLORS[post.category] || '#06b6d4';
                    return (
                      <Link key={`feed-${post.id}`} to={`/blog/${post.slug}`} className="stream-item">
                        <div className="stream-badge-row">
                          <span className="stream-badge" style={{ background: c }}>
                            {post.category}
                          </span>
                          <span className="stream-meta">
                            <Clock size={10} /> {post.readTime}
                          </span>
                        </div>
                        <h5 className="stream-title">{post.title}</h5>
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
