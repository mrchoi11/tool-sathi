import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ChevronRight, Calendar, Clock, ArrowLeft, Share2, Check, Bookmark, Heart } from 'lucide-react';
import { getPostBySlug, getPublishedPosts } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import NewsletterSignup from '../components/NewsletterSignup';
import AdPlaceholder from '../components/AdPlaceholder';
import './BlogPostPage.css';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(48);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!slug) { setPost(null); return; }
    getPostBySlug(slug).then((p) => {
      setPost(p || null);
      if (p) {
        getPublishedPosts().then((all) => setRelatedPosts(all.filter((x) => x.id !== p.id).slice(0, 3)));
      }
    }).catch(() => setPost(null));
  }, [slug]);

  if (post === undefined) return <div style={{ padding: 64, textAlign: 'center', color: '#8b92a9' }}>Loading...</div>;
  if (!post) return <Navigate to="/blog" replace />;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    }
  };

  return (
    <div className="blog-post-page">
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/blog">Blog</Link>
          <ChevronRight size={14} />
          <span>{post.category}</span>
        </nav>

        {/* Back link */}
        <Link to="/blog" className="btn btn-ghost btn-sm back-to-blog">
          <ArrowLeft size={16} /> Back to all articles
        </Link>

        {/* Article Header */}
        <header className="article-header">
          <span className="post-category-tag">{post.category}</span>
          <h1 className="article-title">{post.title}</h1>
          <p className="article-excerpt">{post.excerpt}</p>

          <div className="article-author-meta">
            <div className="author-box">
              <img src={post.author.avatar} alt={post.author.name} className="author-avatar" />
              <div>
                <span className="author-name">{post.author.name}</span>
                <span className="author-role">{post.author.role}</span>
              </div>
            </div>

            <div className="article-date-row">
              <span className="meta-badge"><Calendar size={13} /> {post.publishedAt}</span>
              <span className="meta-badge"><Clock size={13} /> {post.readTime}</span>
              <button type="button" onClick={handleShare} className="btn btn-ghost btn-sm share-btn" title="Copy share link">
                {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />} {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="article-cover">
          <img src={post.coverImage} alt={post.title} />
        </div>

        {/* Article Body */}
        <article className="article-content card glass">
          <div className="article-markdown-body" dangerouslySetInnerHTML={{
            __html: post.content
              .replace(/### (.*$)/gim, '<h3>$1</h3>')
              .replace(/## (.*$)/gim, '<h2>$1</h2>')
              .replace(/# (.*$)/gim, '<h1>$1</h1>')
              .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/gim, '<em>$1</em>')
              .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
              .replace(/`([^`]+)`/gim, '<code>$1</code>')
              .replace(/^\- (.*$)/gim, '<li>$1</li>')
              .replace(/\n\n/g, '<p></p>')
          }} />

          {/* Tags */}
          <div className="article-tags">
            {post.tags.map(tag => (
              <span key={tag} className="tag-pill">#{tag}</span>
            ))}
          </div>

          {/* Action Bar */}
          <div className="article-actions-bar">
            <button
              type="button"
              onClick={handleLike}
              className={`btn btn-sm ${hasLiked ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
              <span>{likes} Helpful</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />} Share Article
            </button>
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="related-articles-section">
            <h3 className="section-title" style={{ fontSize: '1.35rem', marginBottom: 'var(--space-lg)' }}>
              Related Guides & Articles
            </h3>
            <div className="related-articles-grid">
              {relatedPosts.map(rel => (
                <Link key={rel.id} to={`/blog/${rel.slug}`} className="card card-interactive related-card">
                  <img src={rel.coverImage} alt={rel.title} />
                  <div className="related-card-content">
                    <span className="related-category">{rel.category}</span>
                    <h4 className="related-title">{rel.title}</h4>
                    <span className="related-date"><Clock size={12} /> {rel.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ad placement */}
        <AdPlaceholder slot="blog-post-bottom" format="banner" />

        {/* Newsletter */}
        <NewsletterSignup />
      </div>
    </div>
  );
}
