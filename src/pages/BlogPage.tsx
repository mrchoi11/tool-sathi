import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import { usePageSeo } from '../hooks/usePageSeo';
import WireBundle from '../components/blog/WireBundle';
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
    el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateY(-6px) scale(1.015)`;
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

/* Category Pill Tint Styles (Reference specification) */
const CAT_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Video: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', border: 'rgba(139, 92, 246, 0.25)' },
  PDF: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)' },
  Tech: { bg: 'rgba(34, 211, 238, 0.14)', color: '#0891b2', border: 'rgba(34, 211, 238, 0.3)' },
  SEO: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)' },
  Productivity: { bg: 'rgba(245, 158, 11, 0.14)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)' },
};

/* ─── Corner Sine-Wave Mesh Pattern (12-14 lines slow wave) ───────────── */
function CornerWaveMesh() {
  return (
    <div className="corner-mesh-container" aria-hidden="true">
      {/* Top Left Wave Mesh */}
      <svg className="corner-mesh corner-mesh--top-left" viewBox="0 0 620 420" fill="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={`top-mesh-${i}`}
            d={`M -80 ${30 + i * 22} C 140 ${-20 + i * 18}, 280 ${120 + i * 16}, 640 ${40 + i * 24}`}
            stroke="#14B8A6"
            strokeWidth="1.2"
            strokeOpacity={0.09 + (i % 3) * 0.05}
          />
        ))}
      </svg>
      {/* Bottom Right Wave Mesh */}
      <svg className="corner-mesh corner-mesh--bottom-right" viewBox="0 0 620 460" fill="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={`bot-mesh-${i}`}
            d={`M -40 ${180 + i * 18} C 220 ${80 + i * 16}, 380 ${260 + i * 14}, 640 ${140 + i * 20}`}
            stroke="#22D3EE"
            strokeWidth="1.2"
            strokeOpacity={0.08 + (i % 3) * 0.05}
          />
        ))}
      </svg>
    </div>
  );
}

/* ─── TeraBox Player Mockup Card ────────────────────────────────────────── */
function TeraBoxPlayerCard({
  post,
  delay = 0,
  isStacked = false,
}: {
  post: BlogPost;
  delay?: number;
  isStacked?: boolean;
}) {
  const revealRef = useReveal();
  const tilt = useTilt(7);
  const catStyle = CAT_STYLES[post.category] || CAT_STYLES.Video;

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`node-card node-card--media ${isStacked ? 'node-card--stacked' : ''} reveal-node`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* Stacked Pile Under-Layers */}
      {isStacked && (
        <div className="card-stack-shadows" aria-hidden="true">
          <div className="stack-card-layer stack-card-layer--under-1" />
          <div className="stack-card-layer stack-card-layer--under-2" />
        </div>
      )}

      <Link to={`/blog/${post.slug}`} className="player-mockup-screen" aria-label={`Open ${post.title}`}>
        <div className="player-screen-bar">
          <div className="player-brand-tag">
            <span className="player-brand-dot">▶</span>
            <span>TERABOX PLAYER</span>
          </div>
          <span className="player-res-tag">HD 1080P</span>
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
        <div className="node-card__meta-line">
          <span
            className="node-card__cat-pill"
            style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
          >
            {post.category}
          </span>
          <span className="meta-sep">·</span>
          <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          <span className="meta-sep">·</span>
          <span className="meta-date"><Calendar size={11} /> {post.publishedAt}</span>
        </div>

        <h4 className="node-card__title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p className="node-card__excerpt">{post.excerpt}</p>

        <div className="node-card__footer">
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={12} className="read-arrow" />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Compact Editorial Card (for 3-Col Left Cluster) ─────────────────── */
function CompactEditorialCard({
  post,
  delay = 0,
  staggerY = 0,
  isStacked = false,
}: {
  post: BlogPost;
  delay?: number;
  staggerY?: number;
  isStacked?: boolean;
}) {
  const revealRef = useReveal();
  const tilt = useTilt(5);
  const catStyle = CAT_STYLES[post.category] || CAT_STYLES.Tech;

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`node-card node-card--editorial ${isStacked ? 'node-card--stacked' : ''} reveal-node`}
      style={{
        animationDelay: `${delay}ms`,
        transform: staggerY ? `translateY(${staggerY}px)` : undefined,
      }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* Stacked Pile Under-Layers */}
      {isStacked && (
        <div className="card-stack-shadows" aria-hidden="true">
          <div className="stack-card-layer stack-card-layer--under-1" />
          <div className="stack-card-layer stack-card-layer--under-2" />
        </div>
      )}

      <div className="node-card__body">
        <div className="node-card__meta-line">
          <span
            className="node-card__cat-pill"
            style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
          >
            {post.category}
          </span>
          <span className="meta-sep">·</span>
          <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          <span className="meta-sep">·</span>
          <span className="meta-date"><Calendar size={11} /> {post.publishedAt}</span>
        </div>

        <h4 className="node-card__title node-card__title--editorial">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p className="node-card__excerpt node-card__excerpt--editorial">{post.excerpt}</p>

        <div className="node-card__footer editorial-footer">
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={11} className="read-arrow" />
          </Link>
        </div>
      </div>

      <div className="node-card__glow" />
    </div>
  );
}

/* ─── Standard Thumbnail Card (for Right Discovery Cluster) ───────────── */
function StandardThumbCard({
  post,
  delay = 0,
  isRotated = false,
  hasGlowBorder = false,
}: {
  post: BlogPost;
  delay?: number;
  isRotated?: boolean;
  hasGlowBorder?: boolean;
}) {
  const revealRef = useReveal();
  const tilt = useTilt(6);
  const catStyle = CAT_STYLES[post.category] || CAT_STYLES.PDF;

  return (
    <div
      ref={(node) => {
        (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`node-card node-card--thumb ${isRotated ? 'node-card--rotated' : ''} ${hasGlowBorder ? 'node-card--glow-highlight' : ''} reveal-node`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <Link to={`/blog/${post.slug}`} className="node-card__img-link">
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          onError={(e) => {
            // Branded teal-gradient placeholder fallback
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('img-fallback-active');
          }}
        />
        <div className="img-fallback-placeholder">
          <span>{post.category} Guide</span>
        </div>
        <span
          className="node-card__cat-badge"
          style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
        >
          {post.category}
        </span>
      </Link>

      <div className="node-card__body">
        <div className="node-card__meta-line">
          <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          <span className="meta-sep">·</span>
          <span className="meta-date"><Calendar size={11} /> {post.publishedAt}</span>
        </div>

        <h4 className="node-card__title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p className="node-card__excerpt">{post.excerpt}</p>

        <div className="node-card__footer">
          <Link to={`/blog/${post.slug}`} className="node-card__read">
            Read <ArrowRight size={12} className="read-arrow" />
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
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategoryFromUrl = searchParams.get('category') || 'All';
  const activePageFromUrl = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategoryFromUrl);
  const [currentPage, setCurrentPage] = useState<number>(activePageFromUrl);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Refs for dynamic wire bundle calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const leftClusterRef = useRef<HTMLDivElement>(null);
  const rightClusterRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  usePageSeo(
    'page-blog',
    'ProToolBox Insights & Tutorials | ProToolBox',
    'Read our expert articles and tutorials on cloud video streaming, client-side PDF architectures, web performance, and modern online developer tools.'
  );

  // Sync with URL params
  useEffect(() => {
    setSelectedCategory(activeCategoryFromUrl);
  }, [activeCategoryFromUrl]);

  useEffect(() => {
    setCurrentPage(activePageFromUrl);
  }, [activePageFromUrl]);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getPublishedPosts()
      .then((posts) => {
        setAllPosts(posts);
        setLoadingPosts(false);
      })
      .catch(() => setLoadingPosts(false));
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (cat === 'All') p.delete('category');
      else p.set('category', cat);
      p.delete('page');
      return p;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (page <= 1) p.delete('page');
      else p.set('page', String(page));
      return p;
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const categories = useMemo(() => {
    const cats = new Set(allPosts.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchSearch =
        debouncedSearch === '' ||
        post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchCat = selectedCategory === 'All' || post.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [allPosts, debouncedSearch, selectedCategory]);

  const isFiltering = !!(debouncedSearch || selectedCategory !== 'All');

  /* Featured dark card tilt */
  const featuredTilt = useTilt(6);
  const featuredReveal = useReveal();

  /* Distribute posts for Editorial Layout */
  const featuredPost = allPosts.length > 0 ? allPosts[0] : null;
  const topStackedPost1 = allPosts.length > 1 ? allPosts[1] : null;
  const topStackedPost2 = allPosts.length > 2 ? allPosts[2] : null;

  // Left Cluster 3x3 (up to 9 posts with staggered offsets)
  const leftClusterPosts = useMemo(() => {
    const pool = allPosts.slice(3);
    const padded = [...pool];
    while (padded.length < 9 && allPosts.length > 0) {
      padded.push(...allPosts);
    }
    return padded.slice(0, 9);
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
      {/* Background Flowing Sine-Wave Mesh in Corners */}
      <CornerWaveMesh />

      <div className="container blog-container">
        {/* ─── HERO SECTION (H1 strictly 2-line "ProToolBox Insights & Tutorials") ─ */}
        <section className="blog-hero">
          <h1 className="blog-title">
            ProToolBox <br className="hero-br" />
            <span className="blog-title-gradient">Insights &amp; Tutorials</span>
          </h1>

          <p className="blog-subtitle">
            Expert articles on cloud video streaming, client-side PDF architectures, and modern developer productivity.
          </p>

          {/* Rounded Search Bar */}
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

          {/* 2 Quick Circular Toggle Icons (All, Video) */}
          <div className="hero-quick-toggles" role="tablist">
            <button
              type="button"
              className={`hero-toggle-btn${selectedCategory === 'All' ? ' active' : ''}`}
              onClick={() => handleCategoryChange('All')}
              aria-label="Filter All"
            >
              <span className="toggle-dot" />
              <span>All</span>
            </button>
            <button
              type="button"
              className={`hero-toggle-btn${selectedCategory === 'Video' ? ' active' : ''}`}
              onClick={() => handleCategoryChange('Video')}
              aria-label="Filter Video"
            >
              <span className="toggle-dot toggle-dot--video" />
              <span>Video</span>
            </button>
          </div>
        </section>

        {/* ─── MAIN GRID (Left Content ~76%, Right Sticky Sidebar ~24%) ─── */}
        <div className="blog-editorial-layout" ref={containerRef}>
          {/* Central Wire Bundle SVG Layer */}
          {!isFiltering && (
            <WireBundle
              containerRef={containerRef}
              featuredRef={featuredRef}
              leftClusterRef={leftClusterRef}
              rightClusterRef={rightClusterRef}
              paginationRef={paginationRef}
            />
          )}

          {/* Left Content Area (~76%) */}
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
                    {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
                  </h3>
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => {
                      setSearchQuery('');
                      handleCategoryChange('All');
                    }}
                  >
                    Clear Filters
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
              /* Reference Image 1 Editorial Discovery Layout */
              <div className="discovery-tree-flow">
                {/* ─── a) TOP ROW: Featured Card (Left ~60%) + 2 Stacked Cards (Right ~40%) ─ */}
                <div className="discovery-top-row">
                  {/* Left: Large Featured Article Card */}
                  {featuredPost && (
                    <div
                      ref={(node) => {
                        (featuredReveal as React.MutableRefObject<HTMLDivElement | null>).current = node;
                        (featuredTilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                        (featuredRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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
                          FEATURED
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
                            Deep Dive <ArrowRight size={13} className="cta-arrow" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right: 2 Stacked Cards with ~1.5deg rotation */}
                  <div className="discovery-top-stacked">
                    {topStackedPost1 && (
                      <div className="stacked-card-item">
                        <StandardThumbCard post={topStackedPost1} delay={90} isRotated={true} />
                      </div>
                    )}
                    {topStackedPost2 && (
                      <div className="stacked-card-item">
                        <CompactEditorialCard post={topStackedPost2} delay={150} />
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Spacer for Wire Bundle branches ─────────────── */}
                <div className="wire-branches-spacer" />

                {/* ─── c) CARDS BELOW: 3-Col Left Grid + Right Stacked/Showcase ─ */}
                <div className="discovery-clusters-row">
                  {/* Left: 3-Column Regular Grid (3 rows) with staggered translateY */}
                  <div className="cluster-left-3col" ref={leftClusterRef}>
                    <div className="cluster-header-pill">
                      <span className="cluster-dot" style={{ background: '#14B8A6' }} />
                      <span>Video &amp; Architecture Nodes</span>
                    </div>

                    <div className="grid-3col">
                      {/* Row 1: Staggered compact cards */}
                      {leftClusterPosts.slice(0, 3).map((post, idx) => (
                        <CompactEditorialCard
                          key={`l1-${post.id}-${idx}`}
                          post={post}
                          delay={idx * 60}
                          staggerY={idx === 1 ? -16 : idx === 2 ? 14 : 0}
                          isStacked={idx === 2}
                        />
                      ))}

                      {/* Row 2: TeraBox Player cards */}
                      {leftClusterPosts.slice(3, 6).map((post, idx) => (
                        <TeraBoxPlayerCard
                          key={`l2-${post.id}-${idx}`}
                          post={post}
                          delay={160 + idx * 60}
                          isStacked={idx === 0}
                        />
                      ))}

                      {/* Row 3: Staggered compact cards */}
                      {leftClusterPosts.slice(6, 9).map((post, idx) => (
                        <CompactEditorialCard
                          key={`l3-${post.id}-${idx}`}
                          post={post}
                          delay={320 + idx * 60}
                          staggerY={idx === 0 ? 12 : idx === 2 ? -10 : 0}
                          isStacked={idx === 1}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: Stacked-pile cards + highlighted teal glow card */}
                  <div className="cluster-right-showcase" ref={rightClusterRef}>
                    <div className="cluster-header-pill">
                      <span className="cluster-dot" style={{ background: '#22D3EE' }} />
                      <span>PDF &amp; Cloud Tools</span>
                    </div>

                    <div className="grid-2col-media">
                      {rightClusterPosts.slice(0, 2).map((post, idx) => (
                        <TeraBoxPlayerCard
                          key={`r1-${post.id}-${idx}`}
                          post={post}
                          delay={120 + idx * 70}
                          isStacked={true}
                        />
                      ))}
                      {rightClusterPosts.slice(2, 4).map((post, idx) => (
                        <StandardThumbCard
                          key={`r2-${post.id}-${idx}`}
                          post={post}
                          delay={260 + idx * 70}
                          hasGlowBorder={idx === 0}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── f) PAGINATION (Radial Arc Style) ─────────────── */}
                <div className="timeline-pagination-section" ref={paginationRef}>
                  <nav className="radial-pagination" aria-label="Blog pagination">
                    <button
                      type="button"
                      className="page-arc-arrow"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      type="button"
                      className={`page-arc-btn page-arc-btn--1${currentPage === 1 ? ' page-arc-btn--active' : ''}`}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>

                    <button
                      type="button"
                      className={`page-arc-btn page-arc-btn--2${currentPage === 2 ? ' page-arc-btn--active' : ''}`}
                      onClick={() => handlePageChange(2)}
                    >
                      2
                    </button>

                    <button
                      type="button"
                      className={`page-arc-btn page-arc-btn--3${currentPage === 3 ? ' page-arc-btn--active' : ''}`}
                      onClick={() => handlePageChange(3)}
                    >
                      3
                    </button>

                    <button
                      type="button"
                      className="page-arc-arrow"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= 3}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </main>

          {/* ─── RIGHT SIDEBAR (~24% Width, Sticky top: 96px) ─────────── */}
          <aside className="blog-editorial-sidebar">
            {/* 1. Explore All Categories Card */}
            <div className="sidebar-card sidebar-categories-card">
              <h3 className="sidebar-section-title">Explore All Categories</h3>

              <div className="sidebar-timeline-wrap">
                <div className="sidebar-mini-wire" aria-hidden="true" />

                <ul className="sidebar-cat-list">
                  {sidebarCategories.map((cat) => {
                    const isActive = selectedCategory === cat.cat;
                    return (
                      <li key={cat.name} className="sidebar-cat-item">
                        <button
                          type="button"
                          className={`sidebar-cat-btn${isActive ? ' active' : ''}`}
                          onClick={() => handleCategoryChange(cat.cat)}
                        >
                          <span className="sidebar-cat-node-dot" />
                          <span className="sidebar-cat-label">{cat.name}</span>
                          <span className="sidebar-cat-badge">{cat.count}</span>
                        </button>
                      </li>
                    );
                  })}

                  <li className="sidebar-cat-item">
                    <button
                      type="button"
                      className={`sidebar-cat-btn sidebar-cat-all${selectedCategory === 'All' ? ' active' : ''}`}
                      onClick={() => handleCategoryChange('All')}
                    >
                      <span className="sidebar-cat-node-dot" style={{ background: '#94A3B8' }} />
                      <span className="sidebar-cat-label">Explore all</span>
                      <ArrowRight size={13} className="sidebar-all-arrow" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. Recent Posts Mini-Timeline Stream */}
            {allPosts.length > 0 && (
              <div className="sidebar-card sidebar-stream-card">
                <h3 className="sidebar-section-title">Recent Posts</h3>

                <div className="sidebar-timeline-wrap">
                  <div className="sidebar-mini-wire" aria-hidden="true" />

                  <div className="sidebar-stream-list">
                    {allPosts.slice(0, 5).map((post) => {
                      const catStyle = CAT_STYLES[post.category] || CAT_STYLES.Tech;
                      return (
                        <Link key={`feed-${post.id}`} to={`/blog/${post.slug}`} className="stream-item">
                          <div className="stream-badge-row">
                            <span
                              className="stream-badge"
                              style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
                            >
                              {post.category}
                            </span>
                            <span className="stream-meta">
                              <Clock size={10} /> {post.readTime}
                            </span>
                          </div>
                          <h5 className="stream-title">{post.title}</h5>
                          <p className="stream-excerpt">{post.excerpt}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
