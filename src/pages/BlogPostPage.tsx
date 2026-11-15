import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowUp,
  Share2,
  Check,
  Heart,
  BookOpen,
  Sparkles,
  HelpCircle,
  Tag,
  Copy,
  ExternalLink,
  MessageCircle,
  Send,
  List,
  CheckCircle2,
  Layers,
  TrendingUp,
  Mail,
  User,
  MessageSquare,
  CornerDownRight,
  AlertCircle
} from 'lucide-react';

const LinkedInIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const TwitterXIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
import { getPostBySlug, getPublishedPosts, calculateReadTime, togglePostLike } from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import {
  getCommentsByPostId,
  addComment,
  toggleCommentLike,
  formatCommentDate
} from '../data/commentsRegistry';
import type { BlogComment } from '../data/commentsRegistry';
import { applyDocumentSeo } from '../data/seoRegistry';
import NewsletterSignup from '../components/NewsletterSignup';
import AdPlaceholder from '../components/AdPlaceholder';
import './BlogPostPage.css';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Parses article HTML to automatically extract H2 and H3 headings for the Table of Contents,
 * injects unique IDs into them, and ensures <table> elements are wrapped in responsive containers.
 */
function processArticleContent(html: string): { processedHtml: string; toc: TocHeading[] } {
  if (!html || typeof window === 'undefined') {
    return { processedHtml: html || '', toc: [] };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const toc: TocHeading[] = [];
    const slugCounts: Record<string, number> = {};

    headings.forEach((heading) => {
      const text = heading.textContent?.trim() || '';
      if (!text) return;

      let slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!slug) slug = 'section';

      if (slugCounts[slug] !== undefined) {
        slugCounts[slug] += 1;
        slug = `${slug}-${slugCounts[slug]}`;
      } else {
        slugCounts[slug] = 0;
      }

      heading.setAttribute('id', slug);
      toc.push({
        id: slug,
        text,
        level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3,
      });
    });

    // Make tables horizontally scrollable without breaking mobile layout
    const tables = doc.querySelectorAll('table');
    tables.forEach((table) => {
      if (table.parentElement?.className !== 'table-responsive-wrapper') {
        const wrapper = doc.createElement('div');
        wrapper.className = 'table-responsive-wrapper';
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    return {
      processedHtml: doc.body.innerHTML,
      toc,
    };
  } catch (e) {
    return { processedHtml: html, toc: [] };
  }
}

/**
 * Truncate bio to 200 characters cleanly on a word boundary
 */
function truncateBio(bio?: string, limit = 200): { preview: string; isLong: boolean } {
  if (!bio) return { preview: '', isLong: false };
  if (bio.length <= limit) return { preview: bio, isLong: false };
  const trimmed = bio.slice(0, limit);
  const lastSpace = trimmed.lastIndexOf(' ');
  const preview = (lastSpace > 120 ? trimmed.slice(0, lastSpace) : trimmed).trim() + '...';
  return { preview, isLong: true };
}

/**
 * Extract 2-letter uppercase initials for avatar fallback
 */
function getInitials(name?: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(48);
  const [hasLiked, setHasLiked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });
  const [bioExpanded, setBioExpanded] = useState(false);
  const [sidebarEmail, setSidebarEmail] = useState('');
  const [sidebarSubscribed, setSidebarSubscribed] = useState(false);

  // Comments & Discussion States
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  // Reply States
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyName, setReplyName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Liked Comments Tracker
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  // Total comment count (top-level + all nested replies)
  const totalCommentsCount = useMemo(() => {
    let count = 0;
    comments.forEach((c) => {
      count += 1;
      if (c.replies) count += c.replies.length;
    });
    return count;
  }, [comments]);

  // Fetch current post and published posts for recommendations
  useEffect(() => {
    if (!slug) {
      setPost(null);
      return;
    }
    getPostBySlug(slug)
      .then((p) => {
        setPost(p || null);
        if (p) {
          const canonical = p.canonicalUrl && p.canonicalUrl.trim()
            ? p.canonicalUrl.trim()
            : `https://protoolbox.in/blog/${p.slug}`;

          applyDocumentSeo(
            p.metaTitle || `${p.title} | ProToolBox`,
            p.metaDescription || p.excerpt,
            p.tags?.join(', '),
            canonical
          );
        }
      })
      .catch(() => setPost(null));

    getPublishedPosts()
      .then((posts) => setAllPosts(posts))
      .catch(() => setAllPosts([]));
  }, [slug]);

  // Load post likes & comments whenever post is resolved
  useEffect(() => {
    if (!post?.id) return;

    // 1. Post Like status & real count
    const postLikeKey = `ptb_post_liked_${post.id}`;
    const userLiked = localStorage.getItem(postLikeKey) === 'true';
    setHasLiked(userLiked);

    const cachedCount = localStorage.getItem(`ptb_post_like_count_${post.id}`);
    if (cachedCount) {
      setLikes(Number(cachedCount) || 0);
    } else if (post.likes !== undefined) {
      setLikes(post.likes);
    } else {
      const initialLikes = Math.max(16, Math.floor((post.views || 240) * 0.08));
      setLikes(initialLikes);
    }

    // 2. Liked Comment IDs
    try {
      const storedLikedComments = localStorage.getItem('ptb_liked_comment_ids');
      if (storedLikedComments) {
        setLikedCommentIds(new Set(JSON.parse(storedLikedComments)));
      }
    } catch {
      // ignore
    }

    // 3. Comments list
    setCommentsLoading(true);
    getCommentsByPostId(post.id)
      .then((data) => {
        setComments(data);
        setCommentsLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading comments:', err);
        setCommentsLoading(false);
      });
  }, [post?.id]);

  // Reading progress and back-to-top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Process HTML content to inject IDs for headings and generate Table of Contents
  const { processedHtml, toc } = useMemo(() => {
    if (!post?.content) return { processedHtml: '', toc: [] };
    return processArticleContent(post.content);
  }, [post?.content]);

  // Scroll-spy observer for headings
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -65% 0px',
        threshold: 0,
      }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  // Related articles (same category first, fallback to other latest)
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const pool = allPosts.filter((p) => p.id !== post.id);
    const sameCat = pool.filter(
      (p) => p.category.toLowerCase().trim() === post.category.toLowerCase().trim()
    );
    const others = pool.filter(
      (p) => p.category.toLowerCase().trim() !== post.category.toLowerCase().trim()
    );
    return [...sameCat, ...others].slice(0, 3);
  }, [allPosts, post]);

  // More Recommendations / Latest blogs (for bottom section)
  const moreRecommendations = useMemo(() => {
    if (!post) return [];
    const relatedIds = new Set(relatedPosts.map((r) => r.id));
    return allPosts
      .filter((p) => p.id !== post.id && !relatedIds.has(p.id))
      .slice(0, 3);
  }, [allPosts, post, relatedPosts]);

  // Trending / Popular posts for sidebar
  const trendingPosts = useMemo(() => {
    if (!post) return [];
    return allPosts
      .filter((p) => p.id !== post.id)
      .slice(0, 4);
  }, [allPosts, post]);

  // Unique categories for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPosts.forEach((p) => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allPosts]);

  if (post === undefined) {
    return (
      <div className="blog-post-loading">
        <div className="loading-spinner-teal" />
        <p>Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://protoolbox.in/blog/${post.slug}`;
  const canonicalUrl = post.canonicalUrl?.trim() || `https://protoolbox.in/blog/${post.slug}`;
  const readTimeEstimated = calculateReadTime(post.content);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const willLike = !hasLiked;
    setHasLiked(willLike);
    const newCount = Math.max(0, likes + (willLike ? 1 : -1));
    setLikes(newCount);

    const storageKey = `ptb_post_liked_${post.id}`;
    if (willLike) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }
    localStorage.setItem(`ptb_post_like_count_${post.id}`, String(newCount));

    try {
      await togglePostLike(post.id, willLike);
    } catch (e) {
      console.warn('Failed to sync like with Firestore:', e);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setCommentError(null);

    const name = commentName.trim();
    const content = commentText.trim();
    if (!name || name.length < 2) {
      setCommentError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!content || content.length < 3) {
      setCommentError('Please write a comment (at least 3 characters).');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(post.id, {
        authorName: name,
        authorEmail: commentEmail.trim(),
        content
      });

      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setCommentSuccess('Your comment has been posted successfully!');
      setTimeout(() => setCommentSuccess(null), 4000);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: string, _parentAuthor: string) => {
    if (!post) return;
    setReplyError(null);

    const name = replyName.trim();
    const content = replyText.trim();
    if (!name || name.length < 2) {
      setReplyError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!content || content.length < 3) {
      setReplyError('Please write a reply (at least 3 characters).');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const newReply = await addComment(post.id, {
        authorName: name,
        authorEmail: replyEmail.trim(),
        content,
        parentId
      });

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply]
            };
          }
          return c;
        })
      );

      setReplyText('');
      setReplyingToId(null);
    } catch (err: any) {
      setReplyError(err.message || 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!post) return;
    const isLiked = likedCommentIds.has(commentId);
    const willLike = !isLiked;

    const updatedLikedSet = new Set(likedCommentIds);
    if (willLike) {
      updatedLikedSet.add(commentId);
    } else {
      updatedLikedSet.delete(commentId);
    }
    setLikedCommentIds(updatedLikedSet);
    localStorage.setItem('ptb_liked_comment_ids', JSON.stringify(Array.from(updatedLikedSet)));

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, likes: Math.max(0, (c.likes || 0) + (willLike ? 1 : -1)) };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? { ...r, likes: Math.max(0, (r.likes || 0) + (willLike ? 1 : -1)) }
                : r
            )
          };
        }
        return c;
      })
    );

    try {
      await toggleCommentLike(post.id, commentId, willLike);
    } catch (err) {
      console.warn('Comment like update error:', err);
    }
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 85; // accounts for sticky site navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveHeading(id);
      setMobileTocOpen(false);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSidebarSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarEmail || !sidebarEmail.includes('@')) return;
    setSidebarSubscribed(true);
    setTimeout(() => {
      setSidebarEmail('');
      setSidebarSubscribed(false);
    }, 4000);
  };

  // Author details
  const authorName = post.author?.name?.trim() || 'ProToolBox Editor';
  const authorRole = post.author?.role?.trim() || 'Tech Specialist & Content Lead';
  const authorAvatar = post.author?.avatar?.trim();
  const authorBio = post.author?.bio?.trim();
  const authorSocial = post.author?.social;
  const { preview: bioPreview, isLong: bioIsLong } = truncateBio(authorBio, 200);

  // Social share intent links
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(currentUrl);
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  return (
    <div className="blog-detail-container">
      {/* ─── 1. FIXED TOP READING PROGRESS BAR ────────────────────────── */}
      <div
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* ─── STRUCTURED DATA: ARTICLE SCHEMA ──────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage ? [post.coverImage] : [],
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: {
              '@type': 'Person',
              name: authorName,
              jobTitle: authorRole,
            },
            publisher: {
              '@type': 'Organization',
              name: 'ProToolBox',
              url: 'https://protoolbox.in',
              logo: {
                '@type': 'ImageObject',
                url: 'https://protoolbox.in/ProToolBox%20Logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
          }),
        }}
      />

      {/* ─── STRUCTURED DATA: BREADCRUMBLIST SCHEMA ───────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://protoolbox.in/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: 'https://protoolbox.in/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: post.category,
                item: `https://protoolbox.in/blog?category=${encodeURIComponent(post.category)}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: post.title,
                item: canonicalUrl,
              },
            ],
          }),
        }}
      />

      {/* ─── STRUCTURED DATA: FAQPAGESCHEMA (IF FAQS EXIST) ────────────── */}
      {post.faqs && post.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: post.faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.answer,
                },
              })),
            }),
          }}
        />
      )}

      <div className="container blog-detail-inner">
        {/* ─── BREADCRUMBS ────────────────────────────────────────────── */}
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="bc-link">Home</Link>
          <ChevronRight size={13} className="bc-sep" />
          <Link to="/blog" className="bc-link">Blog</Link>
          <ChevronRight size={13} className="bc-sep" />
          <Link to={`/blog?category=${encodeURIComponent(post.category)}`} className="bc-link">
            {post.category}
          </Link>
          <ChevronRight size={13} className="bc-sep" />
          <span className="bc-current" title={post.title}>{post.title}</span>
        </nav>

        {/* ─── 2-COLUMN DESKTOP EDITORIAL LAYOUT (70% Main, 30% Sidebar) ── */}
        <div className="detail-editorial-layout">
          {/* ══════════════ LEFT COLUMN: MAIN CONTENT (~70%) ══════════════ */}
          <main className="detail-main-column">
            {/* Category Pill */}
            <div className="detail-category-wrapper">
              <Link
                to={`/blog?category=${encodeURIComponent(post.category)}`}
                className="detail-category-badge"
              >
                {post.category}
              </Link>
            </div>

            {/* H1 Main Title */}
            <h1 className="detail-article-title">{post.title}</h1>

            {/* Short Subtitle / Excerpt */}
            {post.excerpt && (
              <p className="detail-article-excerpt">{post.excerpt}</p>
            )}

            {/* Meta Row: Author, Date, Updated, Read Time, Share */}
            <div className="detail-meta-row">
              <div className="detail-author-box">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="detail-author-avatar-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="detail-author-avatar-fallback">
                    {getInitials(authorName)}
                  </div>
                )}
                <div className="detail-author-info">
                  <span className="detail-author-name">{authorName}</span>
                  {authorRole && <span className="detail-author-role">{authorRole}</span>}
                </div>
              </div>

              <div className="detail-stats-row">
                <span className="detail-meta-item" title="Published date">
                  <Calendar size={13} className="detail-meta-icon" />
                  {post.publishedAt}
                </span>

                {post.updatedAt && (
                  <span className="detail-meta-item detail-meta-updated" title="Last updated">
                    <Clock size={13} className="detail-meta-icon" />
                    Updated: {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}

                <span className="detail-meta-item" title="Estimated reading time">
                  <BookOpen size={13} className="detail-meta-icon" />
                  {readTimeEstimated}
                </span>

                <a
                  href="#comments-section"
                  className="detail-meta-item meta-comment-count-link"
                  title="Jump to discussion"
                >
                  <MessageSquare size={13} className="detail-meta-icon" />
                  <span>{totalCommentsCount} comments</span>
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className={`detail-meta-share-btn ${copied ? 'copied' : ''}`}
                  title="Copy direct link to article"
                  aria-label="Share article"
                >
                  {copied ? <Check size={13} color="#14B8A6" /> : <Share2 size={13} />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* ─── FEATURED IMAGE (CRITICAL: ZERO RESERVED SPACE IF NONE) ── */}
            {post.coverImage && post.coverImage.trim() !== '' && (
              <div className="detail-featured-image-box">
                <img
                  src={post.coverImage}
                  alt={post.coverImageAlt || post.title}
                  className="detail-featured-image"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}

            {/* ─── QUICK ANSWER / SUMMARY BOX (OPTIONAL) ───────────────── */}
            {post.quickAnswer && post.quickAnswer.trim() !== '' && (
              <div className="detail-quick-answer-card">
                <div className="quick-answer-header">
                  <div className="quick-answer-icon-badge">
                    <Sparkles size={16} />
                  </div>
                  <h3>Quick Answer / Summary</h3>
                </div>
                <div className="quick-answer-content">
                  <p>{post.quickAnswer}</p>
                </div>
              </div>
            )}

            {/* ─── MOBILE TABLE OF CONTENTS (COLLAPSIBLE AT TOP) ───────── */}
            {toc.length >= 2 && (
              <div className="detail-mobile-toc-card">
                <button
                  type="button"
                  className="mobile-toc-toggle-btn"
                  onClick={() => setMobileTocOpen((prev) => !prev)}
                  aria-expanded={mobileTocOpen}
                >
                  <div className="mobile-toc-title-wrap">
                    <List size={16} color="#14B8A6" />
                    <span>Table of Contents ({toc.length} sections)</span>
                  </div>
                  {mobileTocOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {mobileTocOpen && (
                  <nav className="mobile-toc-list" aria-label="Mobile table of contents">
                    <ol>
                      {toc.map((item, idx) => (
                        <li
                          key={item.id}
                          className={`mobile-toc-item mobile-toc-level-${item.level} ${activeHeading === item.id ? 'active' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className="mobile-toc-link-btn"
                          >
                            <span className="toc-num">{idx + 1}.</span>
                            <span>{item.text}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
              </div>
            )}

            {/* ─── MAIN ARTICLE BODY TYPOGRAPHY ────────────────────────── */}
            <article className="detail-article-body card glass">
              <div
                className="article-rich-text"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />

              {/* ─── KEY TAKEAWAYS BOX (OPTIONAL) ──────────────────────── */}
              {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                <div className="detail-key-takeaways-card">
                  <div className="key-takeaways-header">
                    <div className="key-takeaways-icon-badge">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3>Key Takeaways</h3>
                  </div>
                  <ul className="key-takeaways-list">
                    {post.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx}>
                        <span className="takeaway-bullet" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ─── FAQ ACCORDION SECTION (OPTIONAL) ──────────────────── */}
              {post.faqs && post.faqs.length > 0 && (
                <section className="detail-faqs-section" aria-labelledby="faqs-heading">
                  <div className="faqs-section-header">
                    <HelpCircle size={20} color="#14B8A6" />
                    <h3 id="faqs-heading">Frequently Asked Questions</h3>
                  </div>
                  <div className="faqs-accordion-list">
                    {post.faqs.map((faq, idx) => {
                      const isOpen = !!openFaqs[idx];
                      return (
                        <div key={idx} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                          <button
                            type="button"
                            className="faq-accordion-trigger"
                            onClick={() => toggleFaq(idx)}
                            aria-expanded={isOpen}
                          >
                            <span className="faq-question-text">{faq.question}</span>
                            <span className="faq-icon-pill">
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="faq-accordion-body">
                              <p>{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ─── TAGS ROW ──────────────────────────────────────────── */}
              {post.tags && post.tags.length > 0 && (
                <div className="detail-tags-row">
                  <div className="tags-label">
                    <Tag size={14} color="#64748B" />
                    <span>Tags:</span>
                  </div>
                  <div className="tags-pills-wrap">
                    {post.tags.map((tag) => (
                      <span key={tag} className="detail-tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── HELPFUL / LIKE BUTTON & SOCIAL SHARE BAR ───────────── */}
              <div className="detail-actions-bar">
                <div className="detail-feedback-group">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`detail-like-btn ${hasLiked ? 'liked' : ''}`}
                    aria-label="Mark article as helpful"
                  >
                    <Heart size={16} fill={hasLiked ? '#14B8A6' : 'none'} color="#14B8A6" />
                    <span>{likes} Helpful</span>
                  </button>

                  <a
                    href="#comments-section"
                    className="detail-action-comment-btn"
                    title="Jump to discussion"
                  >
                    <MessageSquare size={16} color="#14B8A6" />
                    <span>{totalCommentsCount} Comments</span>
                  </a>
                </div>

                <div className="detail-social-shares-row">
                  <span className="social-shares-label">Share:</span>
                  <a
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-icon-btn whatsapp"
                    title="Share on WhatsApp"
                    aria-label="Share on WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </a>
                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-icon-btn facebook"
                    title="Share on Facebook"
                    aria-label="Share on Facebook"
                  >
                    <FacebookIcon size={15} />
                  </a>
                  <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-icon-btn twitter"
                    title="Share on X"
                    aria-label="Share on X"
                  >
                    <TwitterXIcon size={15} />
                  </a>
                  <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-icon-btn linkedin"
                    title="Share on LinkedIn"
                    aria-label="Share on LinkedIn"
                  >
                    <LinkedInIcon size={15} />
                  </a>
                  <a
                    href={shareLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-icon-btn telegram"
                    title="Share on Telegram"
                    aria-label="Share on Telegram"
                  >
                    <Send size={15} />
                  </a>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="share-icon-btn copy"
                    title="Copy Link"
                    aria-label="Copy Link"
                  >
                    {copied ? <Check size={15} color="#14B8A6" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </article>

            {/* ─── ABOUT THE AUTHOR CARD ──────────────────────────────── */}
            {authorName && (
              <section className="detail-author-section card" aria-label="About the Author">
                <div className="author-card-header">
                  <div className="author-avatar-large-wrap">
                    {authorAvatar ? (
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="author-avatar-large"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="author-avatar-large-fallback">
                        {getInitials(authorName)}
                      </div>
                    )}
                  </div>
                  <div className="author-details-meta">
                    <span className="author-written-by">Written by</span>
                    <h3 className="author-card-name">{authorName}</h3>
                    {authorRole && <p className="author-card-role">{authorRole}</p>}
                  </div>
                </div>

                {authorBio && (
                  <div className="author-bio-container">
                    <p className="author-bio-text">
                      {bioIsLong && !bioExpanded ? bioPreview : authorBio}
                    </p>
                    {bioIsLong && (
                      <button
                        type="button"
                        className="author-bio-expand-btn"
                        onClick={() => setBioExpanded((prev) => !prev)}
                      >
                        {bioExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Author Social Profiles */}
                {authorSocial && (authorSocial.linkedin || authorSocial.twitter || authorSocial.website) && (
                  <div className="author-social-links-row">
                    {authorSocial.linkedin && (
                      <a
                        href={authorSocial.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="author-social-chip"
                        title="Author LinkedIn"
                      >
                        <LinkedInIcon size={13} />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {authorSocial.twitter && (
                      <a
                        href={authorSocial.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="author-social-chip"
                        title="Author X (Twitter)"
                      >
                        <TwitterXIcon size={13} />
                        <span>Twitter</span>
                      </a>
                    )}
                    {authorSocial.website && (
                      <a
                        href={authorSocial.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="author-social-chip"
                        title="Author Website"
                      >
                        <ExternalLink size={13} />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ─── COMMENTS & DISCUSSION SECTION ─────────────────────── */}
            <section id="comments-section" className="detail-comments-section" aria-labelledby="comments-heading">
              <div className="comments-section-header">
                <div className="comments-title-wrap">
                  <div className="comments-icon-badge">
                    <MessageSquare size={18} color="#14B8A6" />
                  </div>
                  <div>
                    <h2 id="comments-heading" className="comments-heading-title">
                      Discussion &amp; Comments
                    </h2>
                    <p className="comments-heading-sub">
                      Have a question or insight? Join the conversation below.
                    </p>
                  </div>
                </div>
                <span className="comments-count-pill">
                  {totalCommentsCount} {totalCommentsCount === 1 ? 'Comment' : 'Comments'}
                </span>
              </div>

              {/* LEAVE A COMMENT FORM CARD */}
              <div className="leave-comment-card">
                <div className="leave-comment-header">
                  <div className="leave-avatar-placeholder">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="leave-comment-title">Leave a Comment</h3>
                    <p className="leave-comment-sub">Your email address will not be published.</p>
                  </div>
                </div>

                {commentSuccess && (
                  <div className="comment-alert-success" role="alert">
                    <CheckCircle2 size={16} />
                    <span>{commentSuccess}</span>
                  </div>
                )}

                {commentError && (
                  <div className="comment-alert-error" role="alert">
                    <AlertCircle size={16} />
                    <span>{commentError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitComment} className="comment-form">
                  <div className="comment-form-grid">
                    <div className="comment-input-wrap">
                      <label htmlFor="comment-author-name">Name <span className="required-star">*</span></label>
                      <div className="input-with-icon">
                        <User size={15} className="input-icon" />
                        <input
                          id="comment-author-name"
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          maxLength={50}
                          required
                        />
                      </div>
                    </div>

                    <div className="comment-input-wrap">
                      <label htmlFor="comment-author-email">Email <span className="optional-tag">(Optional, private)</span></label>
                      <div className="input-with-icon">
                        <Mail size={15} className="input-icon" />
                        <input
                          id="comment-author-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={commentEmail}
                          onChange={(e) => setCommentEmail(e.target.value)}
                          maxLength={80}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="comment-input-wrap">
                    <div className="comment-textarea-header">
                      <label htmlFor="comment-body">Comment <span className="required-star">*</span></label>
                      <span className="char-counter">{commentText.length}/1000</span>
                    </div>
                    <textarea
                      id="comment-body"
                      placeholder="Share your thoughts, ask a question, or provide feedback..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value.slice(0, 1000))}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="comment-form-footer">
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentText.trim() || !commentName.trim()}
                      className="comment-submit-btn"
                    >
                      <Send size={15} />
                      <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* COMMENTS LIST */}
              <div className="comments-list">
                {commentsLoading ? (
                  <div className="comments-loading-state">
                    <div className="loading-spinner-teal-sm" />
                    <span>Loading discussion...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="comments-empty-state">
                    <div className="empty-state-icon">
                      <MessageSquare size={28} color="#14B8A6" />
                    </div>
                    <h4>No comments yet</h4>
                    <p>Be the first to share your thoughts or ask a question about this article!</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isAuthor =
                      post.author?.name &&
                      comment.authorName.toLowerCase().trim() === post.author.name.toLowerCase().trim();
                    const isReplying = replyingToId === comment.id;
                    const commentLiked = likedCommentIds.has(comment.id);

                    return (
                      <div key={comment.id} className="comment-item-card">
                        {/* Top row: Avatar, Author, Timestamp */}
                        <div className="comment-header">
                          <div className="comment-avatar-circle">
                            {getInitials(comment.authorName)}
                          </div>
                          <div className="comment-meta">
                            <div className="comment-author-row">
                              <span className="comment-author-name">{comment.authorName}</span>
                              {isAuthor && <span className="author-badge">Author</span>}
                            </div>
                            <span className="comment-timestamp">
                              <Clock size={11} /> {formatCommentDate(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Comment Body */}
                        <p className="comment-text-content">{comment.content}</p>

                        {/* Actions: Like & Reply buttons */}
                        <div className="comment-actions-bar">
                          <button
                            type="button"
                            onClick={() => handleToggleCommentLike(comment.id)}
                            className={`comment-action-btn like-btn ${commentLiked ? 'liked' : ''}`}
                            title="Helpful comment"
                          >
                            <Heart size={14} fill={commentLiked ? '#14B8A6' : 'none'} color="#14B8A6" />
                            <span>{comment.likes || 0}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isReplying) {
                                setReplyingToId(null);
                              } else {
                                setReplyingToId(comment.id);
                                setReplyError(null);
                              }
                            }}
                            className={`comment-action-btn reply-btn ${isReplying ? 'active' : ''}`}
                          >
                            <CornerDownRight size={14} />
                            <span>{isReplying ? 'Cancel' : 'Reply'}</span>
                          </button>
                        </div>

                        {/* INLINE REPLY FORM */}
                        {isReplying && (
                          <div className="inline-reply-container">
                            <div className="reply-target-pill">
                              <span>Replying to <strong>@{comment.authorName}</strong></span>
                              <button
                                type="button"
                                onClick={() => setReplyingToId(null)}
                                className="reply-close-btn"
                                title="Cancel reply"
                              >
                                ×
                              </button>
                            </div>

                            {replyError && (
                              <div className="comment-alert-error" role="alert">
                                <AlertCircle size={14} />
                                <span>{replyError}</span>
                              </div>
                            )}

                            <div className="reply-inputs-row">
                              <input
                                type="text"
                                placeholder="Your Name *"
                                value={replyName}
                                onChange={(e) => setReplyName(e.target.value)}
                                maxLength={50}
                                className="reply-name-input"
                              />
                              <input
                                type="email"
                                placeholder="Email (Optional)"
                                value={replyEmail}
                                onChange={(e) => setReplyEmail(e.target.value)}
                                maxLength={80}
                                className="reply-email-input"
                              />
                            </div>

                            <textarea
                              placeholder={`Write your reply to ${comment.authorName}...`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value.slice(0, 800))}
                              rows={3}
                              className="reply-textarea"
                            />

                            <div className="reply-form-actions">
                              <button
                                type="button"
                                onClick={() => setReplyingToId(null)}
                                className="reply-cancel-btn"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSubmittingReply || !replyText.trim() || !replyName.trim()}
                                onClick={() => handleSubmitReply(comment.id, comment.authorName)}
                                className="reply-submit-btn"
                              >
                                <Send size={13} />
                                <span>{isSubmittingReply ? 'Replying...' : 'Submit Reply'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* NESTED REPLIES THREAD */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="comment-replies-thread">
                            {comment.replies.map((reply) => {
                              const isReplyAuthor =
                                post.author?.name &&
                                reply.authorName.toLowerCase().trim() === post.author.name.toLowerCase().trim();
                              const replyLiked = likedCommentIds.has(reply.id);

                              return (
                                <div key={reply.id} className="nested-reply-card">
                                  <div className="comment-header">
                                    <div className="comment-avatar-circle reply-avatar">
                                      {getInitials(reply.authorName)}
                                    </div>
                                    <div className="comment-meta">
                                      <div className="comment-author-row">
                                        <span className="comment-author-name">{reply.authorName}</span>
                                        {isReplyAuthor && <span className="author-badge">Author</span>}
                                      </div>
                                      <span className="comment-timestamp">
                                        <Clock size={10} /> {formatCommentDate(reply.createdAt)}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="comment-text-content reply-text">{reply.content}</p>

                                  <div className="comment-actions-bar">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCommentLike(reply.id)}
                                      className={`comment-action-btn like-btn ${replyLiked ? 'liked' : ''}`}
                                      title="Helpful reply"
                                    >
                                      <Heart size={13} fill={replyLiked ? '#14B8A6' : 'none'} color="#14B8A6" />
                                      <span>{reply.likes || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* ─── RELATED GUIDES & ARTICLES (3 CARDS) ────────────────── */}
            {relatedPosts.length > 0 && (
              <section className="detail-related-section" aria-labelledby="related-heading">
                <div className="related-section-header">
                  <div className="related-title-wrap">
                    <span className="related-accent-dot" />
                    <h2 id="related-heading" className="related-heading-text">
                      Related Articles &amp; Guides
                    </h2>
                  </div>
                  <Link to="/blog" className="related-view-all-link">
                    Explore All <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="detail-related-grid">
                  {relatedPosts.map((rel) => {
                    const hasCover = rel.coverImage && rel.coverImage.trim() !== '';
                    return (
                      <Link
                        key={rel.id}
                        to={`/blog/${rel.slug}`}
                        className={`related-article-card ${!hasCover ? 'related-card--no-image' : ''}`}
                      >
                        {/* If no image, completely collapse image box with zero blank space */}
                        {hasCover && (
                          <div className="related-card-image-box">
                            <img
                              src={rel.coverImage}
                              alt={rel.title}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}
                        <div className="related-card-content">
                          <span className="related-category-pill">{rel.category}</span>
                          <h3 className="related-card-title">{rel.title}</h3>
                          <div className="related-card-footer">
                            <span className="rel-date"><Calendar size={11} /> {rel.publishedAt}</span>
                            <span className="rel-read-time"><Clock size={11} /> {calculateReadTime(rel.content)}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ─── MORE RECOMMENDATIONS / LATEST ARTICLES ──────────────── */}
            {moreRecommendations.length > 0 && (
              <section className="detail-recommendations-section" aria-labelledby="recs-heading">
                <div className="related-section-header">
                  <div className="related-title-wrap">
                    <TrendingUp size={18} color="#14B8A6" />
                    <h2 id="recs-heading" className="related-heading-text">
                      More Recommended Reads
                    </h2>
                  </div>
                </div>

                <div className="detail-recommendations-list">
                  {moreRecommendations.map((rec) => {
                    const hasCover = rec.coverImage && rec.coverImage.trim() !== '';
                    return (
                      <Link
                        key={rec.id}
                        to={`/blog/${rec.slug}`}
                        className={`recommendation-row-card ${!hasCover ? 'rec--no-img' : ''}`}
                      >
                        {hasCover && (
                          <div className="rec-image-box">
                            <img src={rec.coverImage} alt={rec.title} loading="lazy" />
                          </div>
                        )}
                        <div className="rec-content">
                          <span className="rec-cat">{rec.category}</span>
                          <h4 className="rec-title">{rec.title}</h4>
                          <span className="rec-time"><Clock size={11} /> {calculateReadTime(rec.content)}</span>
                        </div>
                        <ChevronRight size={16} className="rec-arrow" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Bottom Ad Placeholder & Newsletter */}
            <AdPlaceholder slot="blog-post-bottom" format="banner" />
            <NewsletterSignup />
          </main>

          {/* ══════════════ RIGHT COLUMN: STICKY SIDEBAR (~30%) ══════════ */}
          <aside className="detail-sidebar-column">
            <div className="sticky-sidebar-wrapper">
              {/* SIDEBAR CARD 1: TABLE OF CONTENTS (DESKTOP) */}
              {toc.length >= 2 && (
                <div className="sidebar-widget-card sidebar-toc-card">
                  <div className="sidebar-widget-header">
                    <List size={16} color="#14B8A6" />
                    <h3>Table of Contents</h3>
                  </div>
                  <nav className="desktop-toc-nav" aria-label="Table of contents">
                    <ol className="desktop-toc-list">
                      {toc.map((item, idx) => (
                        <li
                          key={item.id}
                          className={`desktop-toc-item level-${item.level} ${activeHeading === item.id ? 'active' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className="desktop-toc-btn"
                          >
                            <span className="desktop-toc-num">{idx + 1}.</span>
                            <span className="desktop-toc-text">{item.text}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              )}

              {/* SIDEBAR CARD 2: NEWSLETTER CTA */}
              <div className="sidebar-widget-card sidebar-newsletter-card">
                <div className="sidebar-nl-icon-badge">
                  <Mail size={18} />
                </div>
                <h3>Stay Updated</h3>
                <p>Get the latest web productivity &amp; streaming tutorials delivered directly to your inbox.</p>
                {sidebarSubscribed ? (
                  <div className="sidebar-nl-success">
                    <Check size={16} color="#14B8A6" />
                    <span>Thanks for subscribing!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSidebarSubscribe} className="sidebar-nl-form">
                    <input
                      type="email"
                      value={sidebarEmail}
                      onChange={(e) => setSidebarEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="sidebar-nl-input"
                    />
                    <button type="submit" className="sidebar-nl-btn">
                      Subscribe
                    </button>
                  </form>
                )}
              </div>

              {/* SIDEBAR CARD 3: TRENDING / POPULAR POSTS */}
              {trendingPosts.length > 0 && (
                <div className="sidebar-widget-card">
                  <div className="sidebar-widget-header">
                    <TrendingUp size={16} color="#14B8A6" />
                    <h3>Popular Guides</h3>
                  </div>
                  <div className="sidebar-trending-list">
                    {trendingPosts.map((tPost, idx) => (
                      <Link
                        key={tPost.id}
                        to={`/blog/${tPost.slug}`}
                        className="sidebar-trending-item"
                      >
                        <span className="trending-rank-num">0{idx + 1}</span>
                        <div className="trending-info">
                          <span className="trending-cat">{tPost.category}</span>
                          <h4 className="trending-title">{tPost.title}</h4>
                          <span className="trending-read"><Clock size={10} /> {calculateReadTime(tPost.content)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* SIDEBAR CARD 4: CATEGORIES & TAGS */}
              {categoryCounts.length > 0 && (
                <div className="sidebar-widget-card">
                  <div className="sidebar-widget-header">
                    <Layers size={16} color="#14B8A6" />
                    <h3>Explore Categories</h3>
                  </div>
                  <div className="sidebar-cat-list">
                    {categoryCounts.map((cat) => (
                      <Link
                        key={cat.name}
                        to={`/blog?category=${encodeURIComponent(cat.name)}`}
                        className="sidebar-cat-item"
                      >
                        <span className="sidebar-cat-name">{cat.name}</span>
                        <span className="sidebar-cat-count">{cat.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* SIDEBAR CARD 5: QUICK SHARE */}
              <div className="sidebar-widget-card sidebar-share-card">
                <div className="sidebar-widget-header">
                  <Share2 size={16} color="#14B8A6" />
                  <h3>Share this Guide</h3>
                </div>
                <div className="sidebar-share-icons-grid">
                  <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="sb-share-btn wa" title="WhatsApp">
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="sb-share-btn tw" title="X / Twitter">
                    <TwitterXIcon size={15} /> X / Twitter
                  </a>
                  <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="sb-share-btn in" title="LinkedIn">
                    <LinkedInIcon size={15} /> LinkedIn
                  </a>
                  <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="sb-share-btn fb" title="Facebook">
                    <FacebookIcon size={15} /> Facebook
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="sidebar-copy-link-btn"
                >
                  {copied ? <Check size={14} color="#14B8A6" /> : <Copy size={14} />}
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Article Link'}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ─── FLOATING BACK TO TOP BUTTON ─────────────────────────────── */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="floating-back-to-top"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* ─── COPIED FLOATING TOAST NOTIFICATION ──────────────────────── */}
      {copied && (
        <div className="detail-toast-notification">
          <CheckCircle2 size={16} color="#14B8A6" />
          <span>Article link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}
