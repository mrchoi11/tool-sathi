import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Lock, KeyRound, User, LogOut, Plus, Edit2, Trash2, Eye,
  CheckCircle2, AlertCircle, FileText, BarChart3, Settings2,
  Search, ExternalLink, RefreshCw, Download, ImageIcon,
  Link2, Upload, X, Save, Globe, Tag,
  Clock, Hash, AlignLeft, Bold, Italic, List, Heading2,
  Underline as UnderlineIcon, Code, Quote, Undo2, Redo2,
  Strikethrough, AlignCenter, AlignRight, ListOrdered,
  Minus, ArrowLeft
} from "lucide-react";
import {
  getAllPosts, savePost, deletePost, uploadCoverImage, seedDefaults,
} from "../data/blogRegistry";
import type { BlogPost } from "../data/blogRegistry";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import "./AdminPage.css";

const ADMIN_USER = "admin";
const ADMIN_PASS = "toolsathi2026";
const AUTH_KEY = "toolsathi_admin_auth";

type Tab = "posts" | "editor" | "settings";

const emptyPost = (): Partial<BlogPost> => ({
  id: "post-" + Date.now(),
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Video",
  tags: [],
  coverImage: "",
  status: "published",
  publishedAt: new Date().toISOString().split("T")[0],
  readTime: "3 min read",
  views: 0,
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  ogImage: "",
  author: { name: "Admin", role: "Content Lead", avatar: "" },
});

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button type="button" title={title} onClick={onClick} className={`tbar-btn ${active ? "tbar-active" : ""}`}>
      {children}
    </button>
  );
  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  return (
    <div className="editor-toolbar">
      <div className="tbar-group">
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold", <Bold size={14} />)}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic", <Italic size={14} />)}
        {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Underline", <UnderlineIcon size={14} />)}
        {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "Strike", <Strikethrough size={14} />)}
        {btn(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight().run(), "Highlight", <span style={{ fontWeight: 700, fontSize: 12 }}>H</span>)}
        {btn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), "Code", <Code size={14} />)}
      </div>
      <div className="tbar-sep" />
      <div className="tbar-group">
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2", <Heading2 size={14} />)}
        {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3", <span style={{ fontWeight: 700, fontSize: 12 }}>H3</span>)}
        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bullet List", <List size={14} />)}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Ordered List", <ListOrdered size={14} />)}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Quote", <Quote size={14} />)}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), "Divider", <Minus size={14} />)}
      </div>
      <div className="tbar-sep" />
      <div className="tbar-group">
        {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), "Left", <AlignLeft size={14} />)}
        {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), "Center", <AlignCenter size={14} />)}
        {btn(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), "Right", <AlignRight size={14} />)}
      </div>
      <div className="tbar-sep" />
      <div className="tbar-group">
        {btn(editor.isActive("link"), setLink, "Add Link", <Link2 size={14} />)}
        {btn(false, addImage, "Add Image URL", <ImageIcon size={14} />)}
      </div>
      <div className="tbar-sep" />
      <div className="tbar-group">
        {btn(false, () => editor.chain().focus().undo().run(), "Undo", <Undo2 size={14} />)}
        {btn(false, () => editor.chain().focus().redo().run(), "Redo", <Redo2 size={14} />)}
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem(AUTH_KEY, "true");
      onLogin();
    } else {
      setError("Invalid credentials.");
    }
  };
  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo"><Lock size={22} /></div>
        <h1 className="login-heading">Admin Portal</h1>
        <p className="login-sub">ToolSathi Blog Management System</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <label className="field-label">Username</label>
            <div className="field-icon-wrap">
              <User size={15} className="field-icon" />
              <input type="text" className="field-input" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="field-icon-wrap">
              <KeyRound size={15} className="field-icon" />
              <input type={showPass ? "text" : "password"} className="field-input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Enter password..." autoComplete="current-password" />
              <button type="button" className="pass-toggle" onClick={() => setShowPass((v) => !v)}><Eye size={14} /></button>
            </div>
          </div>
          {error && <div className="login-error"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
        <div className="login-hint">
          <KeyRound size={12} />
          <span>Demo: <strong>admin</strong> / <strong>toolsathi2026</strong></span>
          <button type="button" className="autofill-btn" onClick={() => { setUser("admin"); setPass("toolsathi2026"); }}>Autofill</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "true");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("posts");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BlogPost>>(emptyPost());
  const [tagsInput, setTagsInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"" | "ok" | "err">("");
  const [coverMode, setCoverMode] = useState<"url" | "upload">("url");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder: "Write your article content here..." }),
      CharacterCount,
    ],
    content: "",
    onUpdate: ({ editor }) => setForm((prev) => ({ ...prev, content: editor.getHTML() })),
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try { const data = await getAllPosts(); setPosts(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) loadPosts(); }, [authed, loadPosts]);

  const startCreate = () => {
    const fresh = emptyPost();
    setEditingId(null); setForm(fresh); setTagsInput("");
    setCoverPreview(""); setCoverFile(null);
    editor?.commands.setContent(""); setTab("editor");
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id); setForm({ ...post });
    setTagsInput(post.tags.join(", "));
    setCoverPreview(post.coverImage || ""); setCoverFile(null);
    editor?.commands.setContent(post.content || ""); setTab("editor");
  };

  const handleTitleChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setForm((p) => ({ ...p, title: val, slug: editingId ? p.slug : slug }));
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const localUrl = URL.createObjectURL(file);
    setCoverPreview(localUrl);
    setForm((p) => ({ ...p, coverImage: localUrl }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.slug?.trim()) { alert("Title and Slug are required."); return; }
    setSaving(true);
    try {
      let coverImageUrl = form.coverImage || "";
      if (coverMode === "upload" && coverFile) {
        coverImageUrl = await uploadCoverImage(coverFile, form.id || "post-" + Date.now());
      }
      const post: BlogPost = {
        id: form.id || "post-" + Date.now(),
        slug: form.slug!.trim(), title: form.title!.trim(),
        excerpt: form.excerpt || "",
        content: editor?.getHTML() || form.content || "",
        category: (form.category as any) || "Video",
        tags: tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        coverImage: coverImageUrl,
        publishedAt: form.publishedAt || new Date().toISOString().split("T")[0],
        status: (form.status as any) || "published",
        readTime: form.readTime || "3 min read",
        views: form.views || 0,
        metaTitle: form.metaTitle || "",
        metaDescription: form.metaDescription || "",
        canonicalUrl: form.canonicalUrl || "",
        ogImage: form.ogImage || coverImageUrl,
        author: form.author || { name: "Admin", role: "Content Lead", avatar: "" },
      };
      await savePost(post);
      setSaveMsg("ok");
      await loadPosts();
      setTimeout(() => { setSaveMsg(""); setTab("posts"); }, 1400);
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveMsg("err");
      alert("Publish Error: " + (err?.message || "Please check Firestore Database and Rules in Firebase Console."));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deletePost(id); await loadPosts();
  };

  const handleToggleStatus = async (post: BlogPost) => {
    await savePost({ ...post, status: post.status === "published" ? "draft" : "published" });
    await loadPosts();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(posts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `toolsathi-posts-${Date.now()}.json`; a.click();
  };

  const handleSeed = async () => {
    if (!confirm("Seed 3 default sample posts to Firestore?")) return;
    setSeeding(true);
    try { await seedDefaults(); await loadPosts(); alert("Seeded successfully!"); }
    catch (e) { alert("Error seeding. Check Firebase config."); }
    finally { setSeeding(false); }
  };

  const filteredPosts = useMemo(() =>
    posts.filter((p) => {
      const q = searchQ.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    }), [posts, searchQ, statusFilter]);

  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    drafts: posts.filter((p) => p.status === "draft").length,
    views: posts.reduce((s, p) => s + (p.views || 0), 0),
  }), [posts]);

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <div className="adm-root">
      <aside className="adm-sidebar">
        <div className="adm-brand"><span className="adm-brand-dot" /><span>ToolSathi CMS</span></div>
        <nav className="adm-nav">
          <button className={`adm-nav-item ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}><FileText size={16} /> Articles</button>
          <button className={`adm-nav-item ${tab === "editor" ? "active" : ""}`} onClick={startCreate}><Plus size={16} /> New Article</button>
          <button className={`adm-nav-item ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}><Settings2 size={16} /> Settings</button>
        </nav>
        <div className="adm-sidebar-footer">
          <Link to="/blog" target="_blank" className="adm-footer-link"><Globe size={13} /> View Blog</Link>
          <button className="adm-footer-link" onClick={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }}><LogOut size={13} /> Sign Out</button>
        </div>
      </aside>

      <main className="adm-main">
        {tab === "posts" && (
          <div className="adm-section">
            <div className="adm-page-header">
              <div><h1 className="adm-page-title">Articles</h1><p className="adm-page-sub">Manage and publish your blog content</p></div>
              <button className="adm-primary-btn" onClick={startCreate}><Plus size={15} /> New Article</button>
            </div>
            <div className="adm-stats-row">
              {[
                { icon: <FileText size={18} />, value: stats.total, label: "Total Articles", color: "#6366f1" },
                { icon: <CheckCircle2 size={18} />, value: stats.published, label: "Published", color: "#10b981" },
                { icon: <Edit2 size={18} />, value: stats.drafts, label: "Drafts", color: "#f59e0b" },
                { icon: <BarChart3 size={18} />, value: stats.views.toLocaleString(), label: "Total Views", color: "#06b6d4" },
              ].map((s, i) => (
                <div key={i} className="adm-stat-card">
                  <div className="adm-stat-icon" style={{ color: s.color, background: s.color + "18" }}>{s.icon}</div>
                  <div><div className="adm-stat-val">{s.value}</div><div className="adm-stat-label">{s.label}</div></div>
                </div>
              ))}
            </div>
            <div className="adm-filters-row">
              <div className="adm-search-box">
                <Search size={14} />
                <input type="text" placeholder="Search articles..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="adm-search-input" />
              </div>
              <select className="adm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <button className="adm-ghost-btn" onClick={loadPosts}><RefreshCw size={14} /></button>
            </div>
            <div className="adm-table-wrap">
              {loading ? (
                <div className="adm-loading">Loading articles...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="adm-empty"><FileText size={36} /><p>No articles found.</p><button className="adm-primary-btn" onClick={startCreate}><Plus size={14} /> Create First Article</button></div>
              ) : (
                <table className="adm-table">
                  <thead><tr><th>Article</th><th>Category</th><th>Status</th><th>Date</th><th>Views</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id}>
                        <td>
                          <div className="adm-post-cell">
                            {post.coverImage && <img src={post.coverImage} alt="" className="adm-post-thumb" />}
                            <div><div className="adm-post-title">{post.title}</div><div className="adm-post-slug">/blog/{post.slug}</div></div>
                          </div>
                        </td>
                        <td><span className="adm-cat-tag">{post.category}</span></td>
                        <td><button className={`adm-status-btn ${post.status}`} onClick={() => handleToggleStatus(post)}>{post.status === "published" ? "● Published" : "○ Draft"}</button></td>
                        <td className="adm-muted">{post.publishedAt}</td>
                        <td className="adm-muted">{(post.views || 0).toLocaleString()}</td>
                        <td>
                          <div className="adm-actions">
                            <Link to={`/blog/${post.slug}`} target="_blank" className="adm-act-btn"><ExternalLink size={14} /></Link>
                            <button className="adm-act-btn" onClick={() => startEdit(post)}><Edit2 size={14} /></button>
                            <button className="adm-act-btn danger" onClick={() => handleDelete(post.id, post.title)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "editor" && (
          <form onSubmit={handleSave} className="adm-section">
            <div className="adm-page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" className="adm-back-btn" onClick={() => setTab("posts")}><ArrowLeft size={16} /></button>
                <div><h1 className="adm-page-title">{editingId ? "Edit Article" : "New Article"}</h1><p className="adm-page-sub">{editingId ? "Update your existing post" : "Create and publish a new post"}</p></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="adm-ghost-btn" onClick={() => setTab("posts")}>Cancel</button>
                <button type="submit" className="adm-primary-btn" disabled={saving}>
                  {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save & Publish"}
                </button>
              </div>
            </div>
            {saveMsg === "ok" && <div className="adm-alert success"><CheckCircle2 size={16} /> Article saved successfully!</div>}
            {saveMsg === "err" && <div className="adm-alert error"><AlertCircle size={16} /> Failed to save. Check Firebase config.</div>}

            <div className="editor-layout">
              <div className="editor-left">
                <div className="editor-card">
                  <div className="editor-card-title"><FileText size={15} /> Article Content</div>
                  <div className="ed-field">
                    <label className="ed-label">Title *</label>
                    <input type="text" className="ed-input" value={form.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Write an engaging, SEO-friendly title..." required />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">URL Slug *</label>
                    <div className="slug-wrap">
                      <span className="slug-prefix">/blog/</span>
                      <input type="text" className="ed-input slug-input" value={form.slug || ""} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="url-friendly-slug" required />
                    </div>
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">Excerpt / Summary *</label>
                    <textarea className="ed-textarea small" value={form.excerpt || ""} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} placeholder="A brief 1-2 sentence description shown in article cards..." required />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">Article Body</label>
                    <div className="tiptap-wrap">
                      <EditorToolbar editor={editor} />
                      <EditorContent editor={editor} className="tiptap-editor" />
                      <div className="tiptap-footer">{editor?.storage.characterCount.words()} words · {editor?.storage.characterCount.characters()} chars</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editor-right">
                <div className="editor-card">
                  <div className="editor-card-title"><Settings2 size={15} /> Publish Settings</div>
                  <div className="ed-field">
                    <label className="ed-label">Status</label>
                    <select className="ed-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}>
                      <option value="published">Published (Live)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">Category</label>
                    <select className="ed-select" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as any }))}>
                      <option value="Video">Video</option>
                      <option value="PDF">PDF</option>
                      <option value="Productivity">Productivity</option>
                      <option value="SEO">SEO</option>
                      <option value="Tech">Tech</option>
                    </select>
                  </div>
                  <div className="ed-field">
                    <label className="ed-label"><Tag size={12} /> Tags (comma separated)</label>
                    <input type="text" className="ed-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="seo, tutorial, guide" />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label"><Clock size={12} /> Read Time</label>
                    <input type="text" className="ed-input" value={form.readTime || ""} onChange={(e) => setForm((p) => ({ ...p, readTime: e.target.value }))} placeholder="5 min read" />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">Published Date</label>
                    <input type="date" className="ed-input" value={form.publishedAt || ""} onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))} />
                  </div>
                </div>

                <div className="editor-card">
                  <div className="editor-card-title"><ImageIcon size={15} /> Cover Image</div>
                  <div className="cover-mode-tabs">
                    <button type="button" className={`cover-tab ${coverMode === "url" ? "active" : ""}`} onClick={() => setCoverMode("url")}><Link2 size={12} /> Paste URL</button>
                    <button type="button" className={`cover-tab ${coverMode === "upload" ? "active" : ""}`} onClick={() => setCoverMode("upload")}><Upload size={12} /> Upload File</button>
                  </div>
                  {coverMode === "url" ? (
                    <input type="url" className="ed-input" value={form.coverImage || ""} onChange={(e) => { setForm((p) => ({ ...p, coverImage: e.target.value })); setCoverPreview(e.target.value); }} placeholder="https://images.unsplash.com/..." />
                  ) : (
                    <div className="cover-upload-area" onClick={() => fileInputRef.current?.click()}>
                      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleCoverFileChange} />
                      {coverPreview ? <img src={coverPreview} alt="Preview" className="cover-preview-img" /> : (<><Upload size={24} style={{ color: "var(--adm-muted)" }} /><p>Click to upload</p><span>PNG, JPG, WebP</span></>)}
                    </div>
                  )}
                  {coverPreview && <img src={coverPreview} alt="Cover" className="cover-final-preview" />}
                </div>

                <div className="editor-card">
                  <div className="editor-card-title"><User size={15} /> Author</div>
                  <div className="ed-field">
                    <label className="ed-label">Author Name</label>
                    <input type="text" className="ed-input" value={form.author?.name || ""} onChange={(e) => setForm((p) => ({ ...p, author: { ...p.author!, name: e.target.value } }))} />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">Author Role</label>
                    <input type="text" className="ed-input" value={form.author?.role || ""} onChange={(e) => setForm((p) => ({ ...p, author: { ...p.author!, role: e.target.value } }))} />
                  </div>
                </div>

                <div className="editor-card seo-card">
                  <div className="editor-card-title seo-title"><Globe size={15} /> SEO & Meta Tags <span className="seo-badge">Recommended</span></div>
                  <div className="ed-field">
                    <label className="ed-label"><Hash size={12} /> Meta Title <span className="char-hint">{(form.metaTitle || "").length}/60</span></label>
                    <input type="text" className={`ed-input ${(form.metaTitle || "").length > 60 ? "input-warn" : ""}`} value={form.metaTitle || ""} onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))} placeholder="Custom page title for Google (60 chars max)" maxLength={80} />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label"><AlignLeft size={12} /> Meta Description <span className="char-hint">{(form.metaDescription || "").length}/160</span></label>
                    <textarea className={`ed-textarea small ${(form.metaDescription || "").length > 160 ? "input-warn" : ""}`} value={form.metaDescription || ""} onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))} placeholder="Describe this page for search engines (160 chars max)..." maxLength={200} />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">Canonical URL <span className="optional-badge">Optional</span></label>
                    <input type="url" className="ed-input" value={form.canonicalUrl || ""} onChange={(e) => setForm((p) => ({ ...p, canonicalUrl: e.target.value }))} placeholder="https://toolsathi.com/blog/..." />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label">OG Image URL <span className="optional-badge">Optional</span></label>
                    <input type="url" className="ed-input" value={form.ogImage || ""} onChange={(e) => setForm((p) => ({ ...p, ogImage: e.target.value }))} placeholder="Defaults to cover image if empty" />
                  </div>
                  {(form.metaTitle || form.title) && (
                    <div className="serp-preview">
                      <div className="serp-label">Google Preview</div>
                      <div className="serp-url">toolsathi.com › blog › {form.slug || "article"}</div>
                      <div className="serp-title">{form.metaTitle || form.title || "Article Title"}</div>
                      <div className="serp-desc">{form.metaDescription || form.excerpt || "Article description will appear here..."}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {tab === "settings" && (
          <div className="adm-section">
            <div className="adm-page-header">
              <div><h1 className="adm-page-title">Settings & Tools</h1><p className="adm-page-sub">Database management and data tools</p></div>
            </div>
            <div className="settings-grid">
              <div className="editor-card">
                <div className="editor-card-title"><Download size={15} /> Data Backup</div>
                <p className="settings-desc">Export all your blog posts as a JSON file for backup or migration.</p>
                <button className="adm-primary-btn" onClick={handleExport}><Download size={14} /> Export Posts JSON</button>
              </div>
              <div className="editor-card">
                <div className="editor-card-title"><RefreshCw size={15} /> Seed Sample Data</div>
                <p className="settings-desc">Add 3 sample blog posts to your Firestore database to get started.</p>
                <button className="adm-ghost-btn-full" onClick={handleSeed} disabled={seeding}>
                  {seeding ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
                  {seeding ? "Seeding..." : "Seed Default Posts"}
                </button>
              </div>
              <div className="editor-card">
                <div className="editor-card-title"><Settings2 size={15} /> Firebase Status</div>
                <p className="settings-desc">Connected to Firestore. All posts sync across all users globally.</p>
                <div className="firebase-status"><span className="status-dot" /><span>Firebase Firestore Active</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}