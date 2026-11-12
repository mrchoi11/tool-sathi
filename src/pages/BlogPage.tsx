import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Clock, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Play, Shield } from 'lucide-react';
import { getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import { usePageSeo } from '../hooks/usePageSeo';
import WireBundle from '../components/blog/WireBundle';
import './BlogPage.css';

/* ─── 3D Perspective Tilt Hook ──────────────────────────────────────────── */
function useTilt(strength = 7) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateY(-4px) scale(1.008)`;
    el.style.transition = 'transform 0.08s linear';
  }, [strength]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/* Category Pill Tint Styles (Reference specification) */
const CAT_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Video: { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', border: 'rgba(139, 92, 246, 0.25)' },
  PDF: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)' },
  Tech: { bg: 'rgba(34, 211, 238, 0.14)', color: '#0891b2', border: 'rgba(34, 211, 238, 0.3)' },
  SEO: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)' },
  Productivity: { bg: 'rgba(245, 158, 11, 0.14)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)' },
};

/* ─── Corner Sine-Wave Mesh Pattern (Teal & Cyan wave strands) ──────────── */
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

/* ─── Branded Abstract Cover Placeholder (FIX 5: No broken images!) ─────── */
function BrandedCoverPlaceholder({
  category,
  title,
  isCompact = false,
}: {
  category: string;
  title: string;
  isCompact?: boolean;
}) {
  return (
    <div className={`branded-img-placeholder ${isCompact ? 'branded-img-placeholder--compact' : ''}`} aria-label={title}>
      <div className="placeholder-blueprint-grid" />
      <div className="placeholder-content">
        <div className="placeholder-icon-ring">
          {category === 'PDF' ? (
            <Shield size={isCompact ? 16 : 20} color="#14B8A6" />
          ) : (
            <BookOpen size={isCompact ? 16 : 20} color="#14B8A6" />
          )}
        </div>
        <span className="placeholder-pill">{category} Hub</span>
      </div>
    </div>
  );
}

/* ─── Top Row Compact Stacked Card (Height ~178px, No Excerpt) ──────────── */
function TopRowCompactCard({
  post,
  delay = 0,
  isRotated = false,
}: {
  post: BlogPost;
  delay?: number;
  isRotated?: boolean;
}) {
  const tilt = useTilt(4);
  const catStyle = CAT_STYLES[post.category] || CAT_STYLES.Tech;
  const [imgFailed, setImgFailed] = useState(!post.coverImage || post.coverImage.trim() === '');

  return (
    <div
      ref={tilt.ref}
      className={`top-compact-card ${isRotated ? 'top-compact-card--rotated' : ''} reveal-node`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <Link to={`/blog/${post.slug}`} className="top-compact-thumb" aria-label={post.title}>
        {!imgFailed && post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <BrandedCoverPlaceholder category={post.category} title={post.title} isCompact={true} />
        )}
        <span
          className="top-compact-badge"
          style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
        >
          {post.category}
        </span>
      </Link>

      <div className="top-compact-body">
        <div className="top-compact-meta">
          <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
        </div>
        <h4 className="top-compact-title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>
        <Link to={`/blog/${post.slug}`} className="top-compact-read">
          Read <ArrowRight size={11} className="read-arrow" />
        </Link>
      </div>
    </div>
  );
}

/* ─── TeraBox Player Mockup Card (3-Column Grid) ────────────────────────── */
function TeraBoxPlayerCard({
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
  const tilt = useTilt(5);
  const catStyle = CAT_STYLES[post.category] || CAT_STYLES.Video;

  return (
    <div
      ref={tilt.ref}
      className={`node-card node-card--media ${isStacked ? 'node-card--stacked' : ''} reveal-node`}
      data-category={post.category}
      style={{
        animationDelay: `${delay}ms`,
        transform: staggerY ? `translateY(${staggerY}px)` : undefined,
      }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* Stacked Pile Under-Layers (FIX 2: Subtle translate(6px,6px) and (12px,12px)) */}
      {isStacked && (
        <div className="card-stack-shadows" aria-hidden="true">
          <div className="stack-card-layer stack-card-layer--under-1" />
          <div className="stack-card-layer stack-card-layer--under-2" />
        </div>
      )}

      <div className="node-card__inner">
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
          </div>

          <h4 className="node-card__title">
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h4>

          <div className="node-card__footer">
            <Link to={`/blog/${post.slug}`} className="node-card__read">
              Read <ArrowRight size={12} className="read-arrow" />
            </Link>
          </div>
        </div>

        <div className="node-card__glow" />
      </div>
    </div>
  );
}

/* ─── Standard Thumbnail Card (3-Column Grid) ──────────────────────────── */
function StandardThumbCard({
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
  const tilt = useTilt(5);
  const catStyle = CAT_STYLES[post.category] || CAT_STYLES.PDF;
  const [imgFailed, setImgFailed] = useState(!post.coverImage || post.coverImage.trim() === '');

  return (
    <div
      ref={tilt.ref}
      className={`node-card node-card--thumb ${isStacked ? 'node-card--stacked' : ''} reveal-node`}
      data-category={post.category}
      style={{
        animationDelay: `${delay}ms`,
        transform: staggerY ? `translateY(${staggerY}px)` : undefined,
      }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* Stacked Pile Under-Layers (FIX 2: Subtle translate(6px,6px) and (12px,12px)) */}
      {isStacked && (
        <div className="card-stack-shadows" aria-hidden="true">
          <div className="stack-card-layer stack-card-layer--under-1" />
          <div className="stack-card-layer stack-card-layer--under-2" />
        </div>
      )}

      <div className="node-card__inner">
        <Link to={`/blog/${post.slug}`} className="node-card__img-link">
          {!imgFailed && post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <BrandedCoverPlaceholder category={post.category} title={post.title} />
          )}
          <span
            className="node-card__cat-badge"
            style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
          >
            {post.category}
          </span>
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
          </div>

          <h4 className="node-card__title">
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h4>

          <div className="node-card__footer">
            <Link to={`/blog/${post.slug}`} className="node-card__read">
              Read <ArrowRight size={12} className="read-arrow" />
            </Link>
          </div>
        </div>

        <div className="node-card__glow" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN BLOG PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategoryFromUrl = searchParams.get('category') || 'All';
  // Strictly default to page 1 if not present in URL
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const activePageFromUrl = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategoryFromUrl);
  const [currentPage, setCurrentPage] = useState<number>(activePageFromUrl);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Refs for WireBundle — left column wrapper + card grid
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const cardGridRef = useRef<HTMLDivElement>(null);

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
    const p = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
  }, [searchParams]);

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
    const targetPage = Math.max(1, page);
    setCurrentPage(targetPage);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (targetPage <= 1) p.delete('page');
      else p.set('page', String(targetPage));
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
  const featuredTilt = useTilt(5);

  /* Distinct Featured Flagship Post & Discovery Allocation */
  const featuredPost = useMemo(() => {
    const flagship = allPosts.find((p) => p.slug === 'building-high-performance-video-apps');
    if (flagship) return flagship;
    return allPosts.length > 0 ? allPosts[0] : null;
  }, [allPosts]);

  const otherPosts = useMemo(() => {
    if (!featuredPost) return allPosts;
    return allPosts.filter((p) => p.id !== featuredPost.id);
  }, [allPosts, featuredPost]);

  // Top stacked right cards (2 cards)
  const topStackedPost1 = otherPosts.length > 0 ? otherPosts[0] : null;
  const topStackedPost2 = otherPosts.length > 1 ? otherPosts[1] : null;

  // Single 3-Column Grid Cards (9 posts below top row)
  // Ensure the 5 key categories (Video, PDF, Tech, Productivity, SEO) are distinctively present
  const gridPosts = useMemo(() => {
    const topIds = new Set([featuredPost?.id, topStackedPost1?.id, topStackedPost2?.id].filter(Boolean));
    const available = otherPosts.filter((p) => !topIds.has(p.id));

    // Desired order for clear category distribution:
    // Row 1: Video (Col 1), PDF (Col 2), Tech (Col 3)
    // Row 2: Productivity (Col 1), SEO (Col 2), Video (Col 3)
    // Row 3: Video (Col 1), Video (Col 2), Video (Col 3)
    const videoPosts = available.filter((p) => p.category === 'Video');
    const pdfPost = available.find((p) => p.category === 'PDF') || allPosts.find((p) => p.category === 'PDF');
    const techPost = available.find((p) => p.category === 'Tech') || allPosts.find((p) => p.category === 'Tech');
    const prodPost = available.find((p) => p.category === 'Productivity') || allPosts.find((p) => p.category === 'Productivity');
    const seoPost = available.find((p) => p.category === 'SEO') || allPosts.find((p) => p.category === 'SEO');

    const result: BlogPost[] = [];
    if (videoPosts[0]) result.push(videoPosts[0]);
    if (pdfPost) result.push(pdfPost);
    if (techPost) result.push(techPost);
    if (prodPost) result.push(prodPost);
    if (seoPost) result.push(seoPost);
    if (videoPosts[1]) result.push(videoPosts[1]);
    if (videoPosts[2]) result.push(videoPosts[2]);
    if (videoPosts[3]) result.push(videoPosts[3]);
    if (videoPosts[4]) result.push(videoPosts[4]);

    while (result.length < 9 && available.length > 0) {
      result.push(available[result.length % available.length]);
    }
    return result.slice(0, 9);
  }, [allPosts, featuredPost, topStackedPost1, topStackedPost2, otherPosts]);

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

        {/* ─── MAIN GRID: Left Content Column (minmax(0, 1fr)) + Right Sidebar (300px) (FIX 1) ─── */}
        <div className="blog-editorial-layout">
          {/* Left Column = Everything (Top Row + Wires + 3-Col Cards + Pagination) */}
          <main className="blog-main-area" ref={mainAreaRef}>
            {!loadingPosts && !isFiltering && (
              <WireBundle containerRef={mainAreaRef} cardGridRef={cardGridRef} />
            )}

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
                      post.slug.includes('terabox-video-player') ? (
                        <TeraBoxPlayerCard key={post.id} post={post} delay={i * 45} />
                      ) : (
                        <StandardThumbCard key={post.id} post={post} delay={i * 45} />
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Reference Image 1 Editorial Discovery Flow */
              <div className="discovery-tree-flow">
                {/* ─── a) TOP ROW: Featured Card (Left) + 2 Compact Cards (Right) (PRESERVED EXACTLY) ─ */}
                <div className="discovery-top-row">
                  {/* Left: Large Dark Featured Article Card */}
                  {featuredPost && (
                    <div
                      ref={featuredTilt.ref}
                      className="featured-guide-card reveal-node"
                      onMouseMove={featuredTilt.onMouseMove}
                      onMouseLeave={featuredTilt.onMouseLeave}
                    >
                      <img
                        src={featuredPost.coverImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'}
                        alt={featuredPost.title}
                        className="featured-guide-bg-img"
                      />
                      <div className="featured-guide-overlay" />
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
                          <Link to={`/blog/${featuredPost.slug}`} className="featured-guide-cta">
                            Deep Dive <ArrowRight size={13} className="cta-arrow" />
                          </Link>

                          <div className="featured-guide-meta">
                            <span className="featured-cat-tag">{featuredPost.category}</span>
                            <span>
                              <Clock size={12} /> {featuredPost.readTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right: 2 Compact Stacked Cards (~178px height, matching featured card height) */}
                  <div className="discovery-top-stacked">
                    {topStackedPost1 && (
                      <TopRowCompactCard post={topStackedPost1} delay={80} isRotated={true} />
                    )}
                    {topStackedPost2 && (
                      <TopRowCompactCard post={topStackedPost2} delay={140} />
                    )}
                  </div>
                </div>

                {/* Section Header Pill */}
                <div className="cluster-header-pill">
                  <span className="cluster-dot" style={{ background: '#14B8A6' }} />
                  <span>Video, PDF &amp; Architecture Nodes</span>
                </div>

                {/* ─── b) CARDS GRID: EXACTLY 3 COLUMNS, NO 4th/5th COLUMN (FIX 1 & 2) ─ */}
                <div className="discovery-cards-grid" ref={cardGridRef}>
                  {gridPosts.map((post, idx) => {
                    const isStacked = idx === 1 || idx === 6; // Stacked piles strictly on 2nd and 7th card
                    const isAlternate = idx % 3 === 1; // Center column staggered slightly (10px)
                    const isVideoPlayer = post.category === 'Video' && (post.slug.includes('terabox-video-player') || idx === 3);

                    return isVideoPlayer ? (
                      <TeraBoxPlayerCard
                        key={`grid-${post.id}-${idx}`}
                        post={post}
                        delay={idx * 35}
                        staggerY={isAlternate ? 10 : 0}
                        isStacked={isStacked}
                      />
                    ) : (
                      <StandardThumbCard
                        key={`grid-${post.id}-${idx}`}
                        post={post}
                        delay={idx * 35}
                        staggerY={isAlternate ? 10 : 0}
                        isStacked={isStacked}
                      />
                    );
                  })}
                </div>

                {/* ─── c) PAGINATION (Radial Arc Style - Default strictly Page 1) ─ */}
                <div className="timeline-pagination-section">
                  <nav className="radial-pagination" aria-label="Blog pagination">
                    <button
                      type="button"
                      className="page-arc-arrow"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {[1, 2, 3].map((pageNo) => (
                      <button
                        key={pageNo}
                        type="button"
                        className={`page-arc-btn page-arc-btn--${pageNo}${currentPage === pageNo ? ' page-arc-btn--active' : ''}`}
                        onClick={() => handlePageChange(pageNo)}
                      >
                        {pageNo}
                      </button>
                    ))}

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

          {/* ─── RIGHT SIDEBAR (300px Width, Sticky top: 96px, Scrollable) (FIX 1) ─── */}
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
