import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Clock, Calendar, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Play, Shield } from 'lucide-react';
import { getPublishedPosts, formatBlogDate } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import { usePageSeo } from '../hooks/usePageSeo';
import WireBundle, { resolveCategoryStyle } from '../components/blog/WireBundle';
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

/* ─── Branded Abstract Cover Placeholder (No broken images!) ────────────── */
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
          {category.toLowerCase().includes('pdf') ? (
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

/* ─── Large Featured Article Card (Dedicated Unobstructed Image + Slim Footer) ─── */
function FeaturedGuideCard({
  post,
  tilt,
}: {
  post: BlogPost;
  tilt: {
    ref: React.RefObject<HTMLDivElement | null>;
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave: () => void;
  };
}) {
  const authorName = post.author?.name?.trim() || 'Admin';
  const authorAvatar = post.author?.avatar?.trim();
  const initial = authorName.charAt(0).toUpperCase() || 'A';
  const [avatarErr, setAvatarErr] = useState(!authorAvatar);
  const dateStr = formatBlogDate(post.publishedAt, post.updatedAt);
  const catStyle = resolveCategoryStyle(post.category);

  return (
    <div
      ref={tilt.ref}
      className="featured-guide-card reveal-node"
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {/* 1. Dedicated Unobstructed Top Cover Image Frame (16:9 / 1200x630) */}
      <Link
        to={`/blog/${post.slug}`}
        className="featured-visual-frame"
        aria-label={post.title}
      >
        {post.coverImage && post.coverImage.trim() !== '' ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="featured-visual-img"
            width="1200"
            height="630"
            loading="eager"
          />
        ) : (
          <BrandedCoverPlaceholder category={post.category} title={post.title} />
        )}

        {/* Sleek Floating Badges on Top Corners */}
        <div className="featured-visual-badge-row">
          <div className="featured-guide-badge">
            <span className="featured-badge-dot" />
            FEATURED HERO
          </div>
          <span
            className="featured-cat-pill"
            style={{
              background: catStyle.bg,
              color: catStyle.text,
              borderColor: catStyle.border,
            }}
          >
            {catStyle.label || post.category}
          </span>
        </div>
      </Link>

      {/* 2. Sleek Slim Bottom Editorial Content Area */}
      <div className="featured-guide-content">
        <h2 className="featured-guide-title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        <div className="featured-guide-footer">
          <div className="card-author-line card-author-line--dark">
            <div className="author-avatar-circle" title={authorName}>
              {!avatarErr && authorAvatar ? (
                <img src={authorAvatar} alt={authorName} onError={() => setAvatarErr(true)} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <span className="card-author-name">{authorName}</span>
            {dateStr && (
              <>
                <span className="meta-dot">·</span>
                <span className="card-meta-date">{dateStr}</span>
              </>
            )}
            <span className="meta-dot">·</span>
            <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          </div>

          <Link to={`/blog/${post.slug}`} className="featured-guide-cta">
            Deep Dive <ArrowRight size={13} className="cta-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Top Row Compact Stacked Card (Aspect Ratio 16:9, No Crop, Dynamic Author) ─── */
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
  const catStyle = resolveCategoryStyle(post.category);
  const [imgFailed, setImgFailed] = useState(!post.coverImage || post.coverImage.trim() === '');
  const authorName = post.author?.name?.trim() || 'Admin';
  const authorAvatar = post.author?.avatar?.trim();
  const initial = authorName.charAt(0).toUpperCase() || 'A';
  const [avatarErr, setAvatarErr] = useState(!authorAvatar);
  const dateStr = formatBlogDate(post.publishedAt, post.updatedAt);

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
          <img
            src={post.coverImage}
            alt={post.title}
            width="1200"
            height="630"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <BrandedCoverPlaceholder category={post.category} title={post.title} isCompact={true} />
        )}
        <span
          className="top-compact-badge"
          style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
        >
          {catStyle.label || post.category}
        </span>
      </Link>

      <div className="top-compact-body">
        <h4 className="top-compact-title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        {/* Dynamic Author Avatar in Circle + Name + Date */}
        <div className="card-author-line">
          <div className="author-avatar-circle" title={authorName}>
            {!avatarErr && authorAvatar ? (
              <img src={authorAvatar} alt={authorName} onError={() => setAvatarErr(true)} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <span className="card-author-name">{authorName}</span>
          {dateStr && (
            <>
              <span className="meta-dot">·</span>
              <span className="card-meta-date">{dateStr}</span>
            </>
          )}
        </div>

        <div className="top-compact-footer">
          <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          <Link to={`/blog/${post.slug}`} className="top-compact-read">
            Read <ArrowRight size={11} className="read-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── TeraBox Player Mockup Card (Aspect Ratio 16:9, 3-Column Grid) ─── */
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
  const catStyle = resolveCategoryStyle(post.category);
  const authorName = post.author?.name?.trim() || 'Admin';
  const authorAvatar = post.author?.avatar?.trim();
  const initial = authorName.charAt(0).toUpperCase() || 'A';
  const [avatarErr, setAvatarErr] = useState(!authorAvatar);
  const dateStr = formatBlogDate(post.publishedAt, post.updatedAt);

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
      {/* Stacked Pile Under-Layers */}
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
              style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
            >
              {catStyle.label || post.category}
            </span>
            <span className="meta-sep">·</span>
            <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          </div>

          <h4 className="node-card__title">
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h4>

          {/* Dynamic Author Avatar in Circle + Name + Date */}
          <div className="card-author-line">
            <div className="author-avatar-circle" title={authorName}>
              {!avatarErr && authorAvatar ? (
                <img src={authorAvatar} alt={authorName} onError={() => setAvatarErr(true)} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <span className="card-author-name">{authorName}</span>
            {dateStr && (
              <>
                <span className="meta-dot">·</span>
                <span className="card-meta-date">{dateStr}</span>
              </>
            )}
          </div>

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

/* ─── Standard Thumbnail Card (Aspect Ratio 16:9, Contain & No Crop) ─────── */
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
  const catStyle = resolveCategoryStyle(post.category);
  const [imgFailed, setImgFailed] = useState(!post.coverImage || post.coverImage.trim() === '');
  const authorName = post.author?.name?.trim() || 'Admin';
  const authorAvatar = post.author?.avatar?.trim();
  const initial = authorName.charAt(0).toUpperCase() || 'A';
  const [avatarErr, setAvatarErr] = useState(!authorAvatar);
  const dateStr = formatBlogDate(post.publishedAt, post.updatedAt);

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
      {/* Stacked Pile Under-Layers */}
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
              width="1200"
              height="630"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <BrandedCoverPlaceholder category={post.category} title={post.title} />
          )}
          <span
            className="node-card__cat-badge"
            style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
          >
            {catStyle.label || post.category}
          </span>
        </Link>

        <div className="node-card__body">
          <div className="node-card__meta-line">
            <span
              className="node-card__cat-pill"
              style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
            >
              {catStyle.label || post.category}
            </span>
            <span className="meta-sep">·</span>
            <span className="meta-time"><Clock size={11} /> {post.readTime}</span>
          </div>

          <h4 className="node-card__title">
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h4>

          {/* Dynamic Author Avatar in Circle + Name + Date */}
          <div className="card-author-line">
            <div className="author-avatar-circle" title={authorName}>
              {!avatarErr && authorAvatar ? (
                <img src={authorAvatar} alt={authorName} onError={() => setAvatarErr(true)} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <span className="card-author-name">{authorName}</span>
            {dateStr && (
              <>
                <span className="meta-dot">·</span>
                <span className="card-meta-date">{dateStr}</span>
              </>
            )}
          </div>

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

  const urlCat = searchParams.get('category');
  const activeCategoryFromUrl = (!urlCat || urlCat.toLowerCase() === 'all') ? 'All' : urlCat;
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const activePageFromUrl = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const activeSearchFromUrl = searchParams.get('q') || searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(activeSearchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(activeSearchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategoryFromUrl);
  const [currentPage, setCurrentPage] = useState<number>(activePageFromUrl);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Refs for WireBundle — left column wrapper + card grid + sidebar
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const cardGridRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  usePageSeo(
    'page-blog',
    'ProToolBox Insights & Tutorials | ProToolBox',
    'Read our expert articles and tutorials on cloud video streaming, client-side PDF architectures, web performance, and modern online developer tools.'
  );

  // Sync with URL params
  useEffect(() => {
    const rawCat = searchParams.get('category');
    const normCat = (!rawCat || rawCat.toLowerCase() === 'all') ? 'All' : rawCat;
    setSelectedCategory(normCat);
    const q = searchParams.get('q') || searchParams.get('search') || '';
    if (q !== searchQuery) {
      setSearchQuery(q);
      setDebouncedSearch(q);
    }
  }, [searchParams]);

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
    const isAll = !cat || cat.toLowerCase() === 'all';
    const targetCat = isAll ? 'All' : cat;
    setSelectedCategory(targetCat);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (isAll) p.delete('category');
      else p.set('category', targetCat);
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

    const el = document.querySelector('.blog-editorial-layout');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  // Dynamic Categories Set from published posts
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    allPosts.forEach((p) => {
      if (p.category && p.status === 'published') {
        cats.add(p.category.trim());
      }
    });
    return ['All', ...Array.from(cats)];
  }, [allPosts]);

  // Sidebar Categories with real post counts
  const sidebarCategories = useMemo(() => {
    const counts = new Map<string, number>();
    allPosts.filter((p) => p.status === 'published').forEach((p) => {
      const cat = p.category?.trim() || 'General';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([cat, count]) => ({
      name: cat.endsWith('Tools') ? cat : `${cat} Tools`,
      rawCat: cat,
      count,
    }));
  }, [allPosts]);

  const isFiltering = !!(debouncedSearch.trim() || (selectedCategory && selectedCategory.toLowerCase() !== 'all'));

  /* Featured dark card tilt */
  const featuredTilt = useTilt(5);

  /* ─── 1. Featured Flagship Article & Top 2 Selection ─────────────────── */
  const featuredPost = useMemo(() => {
    // 1. Post explicitly marked as featured in Firestore / registry
    const explicit = allPosts.find((p) => p.featured && p.status === 'published');
    if (explicit) return explicit;
    // 2. Fallback to latest published article
    return allPosts.length > 0 ? allPosts[0] : null;
  }, [allPosts]);

  const topStackedPosts = useMemo(() => {
    if (!featuredPost) return [];
    const nonFeatured = allPosts.filter((p) => p.id !== featuredPost.id && p.status === 'published');

    // Check if any posts have topHighlight === true
    const highlighted = nonFeatured.filter((p) => p.topHighlight);
    if (highlighted.length >= 2) {
      return highlighted.slice(0, 2);
    }
    if (highlighted.length === 1) {
      const filler = nonFeatured.find((p) => p.id !== highlighted[0].id);
      return filler ? [highlighted[0], filler] : [highlighted[0]];
    }
    // Fallback: latest 2 non-featured
    return nonFeatured.slice(0, 2);
  }, [allPosts, featuredPost]);

  const topStackedPost1 = topStackedPosts.length > 0 ? topStackedPosts[0] : null;
  const topStackedPost2 = topStackedPosts.length > 1 ? topStackedPosts[1] : null;

  /* ─── 2. Search & Category Filter Pool ───────────────────────────────── */
  const filteredPool = useMemo(() => {
    return allPosts.filter((post) => {
      if (post.status !== 'published') return false;
      const matchSearch =
        debouncedSearch === '' ||
        post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchCat =
        !selectedCategory ||
        selectedCategory.toLowerCase() === 'all' ||
        post.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
      return matchSearch && matchCat;
    });
  }, [allPosts, debouncedSearch, selectedCategory]);

  /* ─── 3. All matching articles in the cards grid ─────────────────────── */
  const paginatedBasePosts = useMemo(() => {
    return filteredPool;
  }, [filteredPool]);

  const totalPages = Math.max(1, Math.ceil(paginatedBasePosts.length / 9));

  // Reset to page 1 if current page is out of range (only after posts have loaded)
  useEffect(() => {
    if (!loadingPosts && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages, loadingPosts]);

  // 9 cards for the current active page
  const currentGridPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * 9;
    return paginatedBasePosts.slice(startIndex, startIndex + 9);
  }, [paginatedBasePosts, currentPage]);

  // Dynamic Pagination Items with Ellipsis (1 ... 4 5 6 ... 12)
  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [totalPages, currentPage]);

  // Show top row strictly on Page 1 when 'All' category is active and no search query
  const showTopRow =
    !debouncedSearch.trim() &&
    (!selectedCategory || selectedCategory.toLowerCase() === 'all') &&
    currentPage === 1 &&
    !!featuredPost;

  return (
    <div className="blog-page">
      {/* Background Flowing Sine-Wave Mesh in Corners */}
      <CornerWaveMesh />

      <div className="container blog-container">
        {/* ─── HERO SECTION ────────────────────────────────────────────── */}
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

          {/* Dynamic Category Filter Pills */}
          <div className="hero-quick-toggles" role="tablist">
            {dynamicCategories.slice(0, 5).map((cat) => {
              const isActive =
                (!selectedCategory && cat.toLowerCase() === 'all') ||
                (selectedCategory && selectedCategory.toLowerCase() === cat.toLowerCase());
              const style = resolveCategoryStyle(cat);
              return (
                <button
                  key={`hero-pill-${cat}`}
                  type="button"
                  className={`hero-toggle-btn${isActive ? ' active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                  aria-label={`Filter ${cat}`}
                >
                  <span
                    className="toggle-dot"
                    style={{ background: cat.toLowerCase() === 'all' ? '#14B8A6' : style.border }}
                  />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── MAIN EDITORIAL LAYOUT (Desktop 3-Col+Sidebar, Tablet 2-Col, Mobile 1-Col) ─── */}
        <div className="blog-editorial-layout">
          {/* Left Column = Main Content (Top Row + Wires + 3-Col Cards + Pagination) */}
          <main className="blog-main-area" ref={mainAreaRef}>
            {/* Dynamic Wire Bundle SVG (recomputes on cards / page / filter change) */}
            {!loadingPosts && currentGridPosts.length > 0 && (
              <WireBundle
                containerRef={mainAreaRef}
                cardGridRef={cardGridRef}
                sidebarRef={sidebarRef}
                posts={currentGridPosts}
                currentPage={currentPage}
                selectedCategory={selectedCategory}
                searchQuery={debouncedSearch}
                showTopRow={showTopRow}
              />
            )}

            {loadingPosts ? (
              <div className="skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : filteredPool.length === 0 ? (
              /* Empty Search / Filter State */
              <div className="blog-empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <BookOpen size={48} color="#14B8A6" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#0F172A', marginBottom: 8 }}>No articles found</h3>
                <p style={{ color: '#64748B', maxWidth: 420, margin: '0 auto 20px' }}>
                  {debouncedSearch
                    ? `No articles match "${debouncedSearch}". Try another keyword.`
                    : `No articles in ${selectedCategory} category yet.`}
                </p>
                <button
                  type="button"
                  className="featured-guide-cta"
                  onClick={() => {
                    setSearchQuery('');
                    handleCategoryChange('All');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="discovery-tree-flow">
                {/* ─── a) TOP ROW: Featured Card (Left) + 2 Compact Cards (Right) (Page 1 Only) ─ */}
                {showTopRow && featuredPost && (
                  <div className={`discovery-top-row ${topStackedPosts.length === 0 ? 'discovery-top-row--solo' : ''}`}>
                    {/* Left: Large Featured Article Card with Unobstructed Cover & Slim Footer */}
                    <FeaturedGuideCard post={featuredPost} tilt={featuredTilt} />

                    {/* Right: 2 Compact Stacked Cards (~178px height, matching featured card height) */}
                    {topStackedPosts.length > 0 && (
                      <div className="discovery-top-stacked">
                        {topStackedPost1 && (
                          <TopRowCompactCard post={topStackedPost1} delay={80} isRotated={true} />
                        )}
                        {topStackedPost2 && (
                          <TopRowCompactCard post={topStackedPost2} delay={140} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Section Header Pill */}
                <div className="cluster-header-pill">
                  <span className="cluster-dot" style={{ background: '#14B8A6' }} />
                  <span>
                    {isFiltering
                      ? `Articles in ${selectedCategory} (${paginatedBasePosts.length})`
                      : currentPage > 1
                      ? `Page ${currentPage} of ${totalPages} · Article Nodes`
                      : `All Articles (${paginatedBasePosts.length})`}
                  </span>
                </div>

                {/* ─── b) CARDS GRID: 3 COLUMNS, DYNAMIC WIRES & CARDS ──────── */}
                <div
                  className={`discovery-cards-grid ${currentGridPosts.length === 1 ? 'discovery-cards-grid--single' : ''}`}
                  ref={cardGridRef}
                >
                  {currentGridPosts.map((post, idx) => {
                    const isStacked = idx === 1 || idx === 6;
                    const isAlternate = idx % 3 === 1;
                    const isVideoPlayer = post.category.toLowerCase().includes('video') && (post.slug.includes('terabox-video-player') || idx === 0);

                    return isVideoPlayer ? (
                      <TeraBoxPlayerCard
                        key={`grid-${post.id}-${idx}`}
                        post={post}
                        delay={idx * 30}
                        staggerY={isAlternate ? 10 : 0}
                        isStacked={isStacked}
                      />
                    ) : (
                      <StandardThumbCard
                        key={`grid-${post.id}-${idx}`}
                        post={post}
                        delay={idx * 30}
                        staggerY={isAlternate ? 10 : 0}
                        isStacked={isStacked}
                      />
                    );
                  })}
                </div>

                {/* ─── c) DYNAMIC RADIAL PAGINATION (1 ... 4 5 6 ... N) ─────── */}
                {totalPages > 1 && (
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

                      {paginationItems.map((item, idx) =>
                        item === '...' ? (
                          <span key={`ellipsis-${idx}`} className="page-arc-ellipsis">
                            •••
                          </span>
                        ) : (
                          <button
                            key={`page-${item}`}
                            type="button"
                            className={`page-arc-btn page-arc-btn--${item}${currentPage === item ? ' page-arc-btn--active' : ''}`}
                            onClick={() => handlePageChange(Number(item))}
                          >
                            {item}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="page-arc-arrow"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ─── RIGHT SIDEBAR (300px, Sticky on Desktop, Below on Tablet/Mobile) ─── */}
          <aside className="blog-editorial-sidebar" ref={sidebarRef}>
            {/* 1. Explore All Categories Card */}
            <div className="sidebar-card sidebar-categories-card">
              <h3 className="sidebar-section-title">Explore All Categories</h3>

              <div className="sidebar-timeline-wrap">
                <div className="sidebar-mini-wire" aria-hidden="true" />

                <ul className="sidebar-cat-list">
                  {sidebarCategories.map((cat) => {
                    const isActive = selectedCategory.toLowerCase() === cat.rawCat.toLowerCase();
                    return (
                      <li key={cat.name} className="sidebar-cat-item">
                        <button
                          type="button"
                          className={`sidebar-cat-btn${isActive ? ' active' : ''}`}
                          onClick={() => handleCategoryChange(cat.rawCat)}
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
                      className={`sidebar-cat-btn sidebar-cat-all${(!selectedCategory || selectedCategory.toLowerCase() === 'all') ? ' active' : ''}`}
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
                    {allPosts.filter((p) => p.status === 'published').slice(0, 5).map((post) => {
                      const catStyle = resolveCategoryStyle(post.category);
                      return (
                        <Link key={`feed-${post.id}`} to={`/blog/${post.slug}`} className="stream-item">
                          <div className="stream-badge-row">
                            <span
                              className="stream-badge"
                              style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
                            >
                              {catStyle.label || post.category}
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
