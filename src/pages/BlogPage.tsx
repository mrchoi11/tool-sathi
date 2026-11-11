import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import { usePageSeo } from '../hooks/usePageSeo';
import './BlogPage.css';

const POSTS_PER_PAGE = 6;

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  usePageSeo(
    'page-blog',
    'ProToolBox Insights, Guides & Tutorials | ProToolBox',
    'Read the latest guides, tutorials, and tips on video streaming, PDF editing, image optimization, and web productivity.'
  );

  useEffect(() => {
    getPublishedPosts().then((posts) => { setAllPosts(posts); setLoadingPosts(false); }).catch(() => setLoadingPosts(false));
  }, []);

  // Reset page on filter/search change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(allPosts.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allPosts, searchQuery, selectedCategory]);

  const isFiltering = searchQuery || selectedCategory !== 'All';
  const featuredPost = !isFiltering ? allPosts[0] : null;
  const gridPosts = isFiltering ? filteredPosts : filteredPosts.slice(1);

  const totalPages = Math.ceil(gridPosts.length / POSTS_PER_PAGE);
  const pagedPosts = gridPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  // Sidebar: group categories with counts
  const sidebarCategories = useMemo(() => {
    return categories.filter(c => c !== 'All').map(c => ({
      name: c,
      count: allPosts.filter(p => p.category === c).length,
    }));
  }, [categories, allPosts]);

  return (
    <div className="blog-page">
      <div className="container">

        {/* ── HERO ── */}
        <div className="blog-hero">
          <div className="section-label">Knowledge Base &amp; Guides</div>
          <h1 className="blog-title">ProToolBox Insights &amp; Tutorials</h1>
          <p className="blog-subtitle">
            Expert articles on cloud video streaming, client-side PDF architectures, web performance, and modern developer productivity.
          </p>

          <div className="blog-search-wrapper">
            <Search size={20} className="blog-search-icon" />
            <input
              type="text"
              placeholder="Search tutorials, TeraBox tips, PDF tools…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="blog-search-input"
              aria-label="Search blog"
            />
          </div>

          <div className="blog-categories">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`blog-cat-btn${selectedCategory === cat ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN LAYOUT: content + sidebar ── */}
        <div className="blog-layout">

          {/* LEFT: featured + grid */}
          <div className="blog-main">

            {/* Featured Card (dark, full-bleed gradient) */}
            {featuredPost && (
              <div className="blog-featured-dark">
                <div className="featured-dark-glow" aria-hidden="true" />
                <div className="featured-dark-body">
                  <span className="featured-dark-badge">Featured Guide</span>
                  <h2 className="featured-dark-title">
                    <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className="featured-dark-excerpt">{featuredPost.excerpt}</p>
                  <div className="featured-dark-footer">
                    <div className="featured-dark-meta">
                      <span className="featured-dark-cat">{featuredPost.category}</span>
                      <span><Clock size={13} /> {featuredPost.readTime}</span>
                      <span><Calendar size={13} /> {featuredPost.publishedAt}</span>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`} className="featured-dark-cta">
                      Deep Dive <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Grid header */}
            <div className="blog-grid-header">
              <h2 className="blog-grid-title">
                {isFiltering ? `${selectedCategory !== 'All' ? selectedCategory : 'Search'} Results` : 'Latest Articles'}
                <span className="blog-grid-count">({gridPosts.length})</span>
              </h2>
            </div>

            {/* Posts */}
            {loadingPosts ? (
              <div className="blog-loading">
                {[1, 2, 3, 4].map(i => <div key={i} className="blog-skeleton" />)}
              </div>
            ) : pagedPosts.length === 0 ? (
              <div className="blog-empty">
                <BookOpen size={44} />
                <p>No articles found. Try a different search or category.</p>
              </div>
            ) : (
              <div className="blog-posts-grid">
                {pagedPosts.map(post => (
                  <article key={post.id} className="blog-node-card">
                    <Link to={`/blog/${post.slug}`} className="blog-card-img-link">
                      <img src={post.coverImage} alt={post.title} loading="lazy" />
                      <span className="blog-card-category-badge">{post.category}</span>
                    </Link>
                    <div className="blog-card-body">
                      <div className="blog-card-meta">
                        <span><Calendar size={12} /> {post.publishedAt}</span>
                        <span>·</span>
                        <span><Clock size={12} /> {post.readTime}</span>
                      </div>
                      <h3 className="blog-card-title">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="blog-card-excerpt">{post.excerpt}</p>
                      <div className="blog-card-footer">
                        <div className="blog-card-author">
                          <img src={post.author.avatar} alt={post.author.name} />
                          <span>{post.author.name}</span>
                        </div>
                        <Link to={`/blog/${post.slug}`} className="read-more-link">
                          Read <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="blog-pagination">
                <button
                  className="page-arrow"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    className={`page-num${currentPage === n ? ' active' : ''}`}
                    onClick={() => setCurrentPage(n)}
                    aria-label={`Page ${n}`}
                    aria-current={currentPage === n ? 'page' : undefined}
                  >
                    {n}
                  </button>
                ))}

                <button
                  className="page-arrow"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="blog-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-heading">Explore All Categories</h3>
              <ul className="sidebar-cat-list">
                {sidebarCategories.map(cat => (
                  <li key={cat.name}>
                    <button
                      type="button"
                      className={`sidebar-cat-btn${selectedCategory === cat.name ? ' active' : ''}`}
                      onClick={() => { setSelectedCategory(cat.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      <span>{cat.name}</span>
                      <span className="sidebar-cat-count">{cat.count}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className={`sidebar-cat-btn${selectedCategory === 'All' ? ' active' : ''}`}
                    onClick={() => setSelectedCategory('All')}
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </button>
                </li>
              </ul>
            </div>

            {/* Recent posts vertical feed */}
            {allPosts.length > 1 && (
              <div className="sidebar-card sidebar-recent">
                <h3 className="sidebar-heading">Recent Posts</h3>
                <ul className="sidebar-recent-list">
                  {allPosts.slice(0, 5).map(post => (
                    <li key={post.id}>
                      <Link to={`/blog/${post.slug}`} className="sidebar-recent-item">
                        <span className="sidebar-recent-title">{post.title}</span>
                        <span className="sidebar-recent-meta"><Clock size={11} /> {post.readTime}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

      </div>
    </div>
  );
}
