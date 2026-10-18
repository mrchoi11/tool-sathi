import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, Tag, BookOpen } from 'lucide-react';
import { getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import './BlogPage.css';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const allPosts = useMemo(() => getPublishedPosts(), []);

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

  const featuredPost = allPosts[0];
  const regularPosts = searchQuery || selectedCategory !== 'All' 
    ? filteredPosts 
    : filteredPosts.slice(1);

  return (
    <div className="blog-page">
      <div className="container">
        {/* Hero Section */}
        <div className="blog-hero">
          <div className="section-label">Knowledge Base & Guides</div>
          <h1 className="blog-title">ToolSathi Insights & Tutorials</h1>
          <p className="blog-subtitle">
            Expert articles on cloud video streaming, client-side PDF architectures, web performance, and modern developer productivity.
          </p>

          {/* Search Bar */}
          <div className="blog-search-wrapper">
            <Search size={20} className="blog-search-icon" />
            <input
              type="text"
              placeholder="Search tutorials, TeraBox tips, PDF tools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="blog-search-input"
            />
          </div>

          {/* Categories */}
          <div className="blog-categories">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`blog-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post Card (Only shown when not filtering) */}
        {!searchQuery && selectedCategory === 'All' && featuredPost && (
          <div className="blog-featured-card card glass">
            <div className="featured-img-col">
              <img src={featuredPost.coverImage} alt={featuredPost.title} />
              <span className="featured-badge">Featured Guide</span>
            </div>
            <div className="featured-content-col">
              <div className="post-meta-row">
                <span className="post-category-tag">{featuredPost.category}</span>
                <span className="post-meta-item"><Clock size={13} /> {featuredPost.readTime}</span>
                <span className="post-meta-item"><Calendar size={13} /> {featuredPost.publishedAt}</span>
              </div>

              <h2 className="featured-title">
                <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h2>
              <p className="featured-excerpt">{featuredPost.excerpt}</p>

              <div className="featured-footer">
                <div className="author-box">
                  <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="author-avatar" />
                  <div>
                    <span className="author-name">{featuredPost.author.name}</span>
                    <span className="author-role">{featuredPost.author.role}</span>
                  </div>
                </div>

                <Link to={`/blog/${featuredPost.slug}`} className="btn btn-primary btn-sm read-btn">
                  Read Article <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div className="blog-grid-header">
          <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
            {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginLeft: '10px', fontWeight: 400 }}>
              ({filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''})
            </span>
          </h2>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="card glass" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
            <h3>No articles found</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              No posts matched your search criteria. Try a different query or select another category.
            </p>
          </div>
        ) : (
          <div className="blog-posts-grid">
            {regularPosts.map(post => (
              <article key={post.id} className="card card-interactive blog-card">
                <Link to={`/blog/${post.slug}`} className="blog-card-media">
                  <img src={post.coverImage} alt={post.title} loading="lazy" />
                  <span className="blog-card-category">{post.category}</span>
                </Link>

                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span><Calendar size={12} /> {post.publishedAt}</span>
                    <span>•</span>
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
                      Read <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
