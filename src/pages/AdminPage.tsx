import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Lock, KeyRound, User, LogOut, Plus, Edit, Trash2, Eye, 
  Check, AlertCircle, FileText, BarChart3, Settings, Search, 
  ExternalLink, ArrowLeft, RefreshCw, Download, Sparkles 
} from 'lucide-react';
import { 
  getAllPosts, savePost, deletePost, resetToDefaults 
} from '../data/blogRegistry';
import type { BlogPost } from '../data/blogRegistry';
import './AdminPage.css';

const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'toolsathi2026';
const AUTH_KEY = 'toolsathi_admin_session';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // CRM Dashboard State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'edit' | 'backup'>('posts');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Editor State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Video',
    tags: [],
    coverImage: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    readTime: '4 min read',
    author: {
      name: 'Admin Editor',
      role: 'Content Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
  });
  const [tagsInput, setTagsInput] = useState<string>('');
  const [editorPreview, setEditorPreview] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
      setPosts(getAllPosts());
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (username.trim() === DEFAULT_USER && password === DEFAULT_PASS) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setPosts(getAllPosts());
    } else {
      setLoginError('Invalid username or password. Please use the default credentials provided below.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  const reloadPosts = () => {
    setPosts(getAllPosts());
  };

  // Switch to Create New Post
  const handleStartCreate = () => {
    setEditingPostId(null);
    setFormData({
      id: 'post-' + Date.now(),
      title: '',
      slug: '',
      excerpt: '',
      content: '## Write your article heading here\n\nProvide valuable step-by-step guidance for readers...',
      category: 'Video',
      tags: ['guide', 'tutorial'],
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: '3 min read',
      author: {
        name: 'Admin Editor',
        role: 'Content Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      },
    });
    setTagsInput('guide, tutorial');
    setActiveTab('edit');
  };

  // Switch to Edit existing post
  const handleStartEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setFormData({ ...post });
    setTagsInput(post.tags.join(', '));
    setActiveTab('edit');
  };

  const handleTitleChange = (newTitle: string) => {
    const generatedSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug === '' || !editingPostId ? generatedSlug : prev.slug,
    }));
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.slug?.trim()) {
      alert('Title and slug are required.');
      return;
    }

    const postToSave: BlogPost = {
      id: formData.id || 'post-' + Date.now(),
      slug: formData.slug.trim(),
      title: formData.title.trim(),
      excerpt: formData.excerpt || '',
      content: formData.content || '',
      category: formData.category as any || 'Video',
      tags: tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      coverImage: formData.coverImage || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
      publishedAt: formData.publishedAt || new Date().toISOString().split('T')[0],
      status: formData.status as any || 'published',
      readTime: formData.readTime || '4 min read',
      views: formData.views || Math.floor(Math.random() * 400) + 100,
      author: formData.author || {
        name: 'Admin Editor',
        role: 'Content Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      },
    };

    savePost(postToSave);
    reloadPosts();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('posts');
    }, 1200);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePost(id);
      reloadPosts();
    }
  };

  const handleTogglePublish = (post: BlogPost) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    savePost({ ...post, status: nextStatus });
    reloadPosts();
  };

  const handleResetDefaults = () => {
    if (confirm('Reset blog database to original 3 sample posts? All custom posts will be overwritten.')) {
      resetToDefaults();
      reloadPosts();
      alert('Reset completed successfully.');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `toolsathi-posts-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered post list
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.category.toLowerCase().includes(searchFilter.toLowerCase());

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [posts, searchFilter, statusFilter]);

  // Stats
  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="card glass admin-login-card">
          <div className="login-header">
            <div className="login-icon-box">
              <Lock size={26} />
            </div>
            <h1 className="login-title">Admin CRM Portal</h1>
            <p className="login-subtitle">Sign in to publish, edit, and manage ToolSathi blog articles.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="tool-field">
              <label className="tool-label">Username</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  className="tool-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="tool-field">
              <label className="tool-label">Password</label>
              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="tool-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                />
                <button
                  type="button"
                  className="toggle-pass-btn"
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            {loginError && (
              <div className="tool-alert tool-alert-danger" style={{ fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary login-btn">
              Sign In to CRM Dashboard
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="login-hint-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '4px' }}>
              <KeyRound size={14} /> Quick Demo Access:
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
              Username: <strong style={{ color: 'var(--color-text)' }}>admin</strong> &bull; Password: <strong style={{ color: 'var(--color-text)' }}>toolsathi2026</strong>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: '8px', fontSize: '0.75rem', padding: '3px 8px', border: '1px solid var(--color-border)' }}
              onClick={() => {
                setUsername('admin');
                setPassword('toolsathi2026');
              }}
            >
              Fill Credentials Automatically
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="admin-dashboard-page">
      <div className="container">
        {/* Top Navbar */}
        <div className="admin-header-row">
          <div>
            <div className="admin-badge">Admin CRM Studio</div>
            <h1 className="admin-heading">Blog Publishing Dashboard</h1>
          </div>

          <div className="admin-top-actions">
            <Link to="/blog" target="_blank" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ExternalLink size={14} /> View Live Blog
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm logout-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="admin-stats-grid">
          <div className="card glass admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
              <FileText size={20} />
            </div>
            <div>
              <span className="stat-number">{totalPosts}</span>
              <span className="stat-title">Total Articles</span>
            </div>
          </div>

          <div className="card glass admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Check size={20} />
            </div>
            <div>
              <span className="stat-number">{publishedCount}</span>
              <span className="stat-title">Published Live</span>
            </div>
          </div>

          <div className="card glass admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Edit size={20} />
            </div>
            <div>
              <span className="stat-number">{draftCount}</span>
              <span className="stat-title">Drafts Pending</span>
            </div>
          </div>

          <div className="card glass admin-stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-accent)' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <span className="stat-number">{totalViews.toLocaleString()}</span>
              <span className="stat-title">Estimated Readers</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`admin-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          >
            <FileText size={16} /> Articles Manager ({posts.length})
          </button>
          <button
            type="button"
            onClick={handleStartCreate}
            className={`admin-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
          >
            <Plus size={16} /> {editingPostId ? 'Edit Article' : 'New Article'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`admin-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          >
            <Settings size={16} /> Storage & Tools
          </button>
        </div>

        {/* TAB 1: POSTS LIST TABLE */}
        {activeTab === 'posts' && (
          <div className="card glass admin-table-card">
            <div className="admin-controls-row">
              <div className="search-filter-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search articles by title, tag, or category..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="table-search-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="tool-select"
                  style={{ width: '150px', padding: '6px 10px', fontSize: '0.85rem' }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Drafts Only</option>
                </select>

                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> New Article
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Reads</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        No articles found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map(post => (
                      <tr key={post.id}>
                        <td>
                          <div className="post-cell">
                            <img src={post.coverImage} alt={post.title} className="post-thumb" />
                            <div>
                              <strong className="post-table-title">{post.title}</strong>
                              <span className="post-table-slug">/blog/{post.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{post.category}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(post)}
                            className={`status-chip ${post.status === 'published' ? 'published' : 'draft'}`}
                            title="Click to toggle publish status"
                          >
                            {post.status === 'published' ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          {post.publishedAt}
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {(post.views || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <Link
                              to={`/blog/${post.slug}`}
                              target="_blank"
                              className="ctrl-btn"
                              title="View Live Page"
                            >
                              <ExternalLink size={15} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(post)}
                              className="ctrl-btn"
                              title="Edit Article"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(post.id, post.title)}
                              className="ctrl-btn"
                              style={{ color: '#f87171' }}
                              title="Delete Article"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ARTICLE EDITOR */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSavePost} className="card glass admin-editor-card">
            <div className="editor-header">
              <div>
                <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                  {editingPostId ? 'Edit Article' : 'Compose New Article'}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Changes will publish immediately to the public blog and persist in local storage.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setEditorPreview(!editorPreview)}
                  className="btn btn-ghost btn-sm"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <Eye size={14} /> {editorPreview ? 'Editor Mode' : 'Live Preview'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} /> {saveSuccess ? 'Saved!' : 'Save & Publish'}
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="tool-alert tool-alert-success" style={{ marginBottom: 'var(--space-md)' }}>
                <Check size={18} /> Article published and saved successfully! Redirecting...
              </div>
            )}

            {!editorPreview ? (
              <div className="editor-grid">
                <div className="tool-field">
                  <label className="tool-label">Article Title *</label>
                  <input
                    type="text"
                    className="tool-input"
                    value={formData.title || ''}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Enter an engaging SEO-friendly title..."
                    required
                  />
                </div>

                <div className="tool-field">
                  <label className="tool-label">URL Slug *</label>
                  <input
                    type="text"
                    className="tool-input"
                    value={formData.slug || ''}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. how-to-play-terabox-videos"
                    required
                  />
                </div>

                <div className="tool-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="tool-label">Short Summary / Excerpt *</label>
                  <textarea
                    className="tool-textarea"
                    style={{ height: '70px' }}
                    value={formData.excerpt || ''}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief 1-2 sentence preview for search results and social cards..."
                    required
                  />
                </div>

                <div className="tool-field">
                  <label className="tool-label">Category</label>
                  <select
                    className="tool-select"
                    value={formData.category || 'Video'}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="Video">Video</option>
                    <option value="PDF">PDF</option>
                    <option value="Productivity">Productivity</option>
                    <option value="SEO">SEO</option>
                    <option value="Tech">Tech</option>
                  </select>
                </div>

                <div className="tool-field">
                  <label className="tool-label">Publishing Status</label>
                  <select
                    className="tool-select"
                    value={formData.status || 'published'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="published">Published (Live on Website)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="tool-field">
                  <label className="tool-label">Cover Image URL</label>
                  <input
                    type="url"
                    className="tool-input"
                    value={formData.coverImage || ''}
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="tool-field">
                  <label className="tool-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="tool-input"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="e.g. terabox, streaming, tutorial"
                  />
                </div>

                <div className="tool-field">
                  <label className="tool-label">Author Name</label>
                  <input
                    type="text"
                    className="tool-input"
                    value={formData.author?.name || 'Admin Editor'}
                    onChange={e => setFormData({
                      ...formData,
                      author: { ...formData.author!, name: e.target.value }
                    })}
                  />
                </div>

                <div className="tool-field">
                  <label className="tool-label">Estimated Read Time</label>
                  <input
                    type="text"
                    className="tool-input"
                    value={formData.readTime || '4 min read'}
                    onChange={e => setFormData({ ...formData, readTime: e.target.value })}
                  />
                </div>

                {/* Content Markdown Area */}
                <div className="tool-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="tool-label" style={{ marginBottom: '6px' }}>
                    <span>Article Body Content (Markdown Supported)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Supports ## Headings, **bold**, lists, and links
                    </span>
                  </div>
                  <textarea
                    className="tool-textarea"
                    style={{ height: '320px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}
                    value={formData.content || ''}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Compose your article in Markdown..."
                    required
                  />
                </div>
              </div>
            ) : (
              /* Live Preview within Editor */
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
                <span className="post-category-tag">{formData.category}</span>
                <h1 style={{ fontSize: '2rem', margin: '12px 0' }}>{formData.title || 'Untitled Post'}</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>{formData.excerpt}</p>
                {formData.coverImage && (
                  <img src={formData.coverImage} alt="Cover preview" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '12px', margin: '16px 0' }} />
                )}
                <div style={{ lineHeight: 1.8, fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                  <p>{formData.content}</p>
                </div>
              </div>
            )}
          </form>
        )}

        {/* TAB 3: BACKUP & SYSTEM SETTINGS */}
        {activeTab === 'backup' && (
          <div className="card glass" style={{ padding: 'var(--space-2xl)' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: 'var(--space-md)' }}>Data Management & Backups</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
              ToolSathi articles are stored locally in the browser storage engine. You can backup your posts to JSON or restore the factory sample guides anytime.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportJson}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Export All Posts (.JSON)
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="btn btn-ghost"
                style={{ border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} /> Restore Default Articles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
