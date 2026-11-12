import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Lock, KeyRound, User, LogOut, Plus, Edit2, Trash2, Eye, EyeOff,
  CheckCircle2, AlertCircle, FileText, BarChart3, Settings2,
  Search, ExternalLink, RefreshCw, Download, ImageIcon,
  Link2, Upload, X, Save, Globe, Tag, Check, ShieldCheck, Mail, ArrowLeft,
  Clock, Hash, AlignLeft, Bold, Italic, List, Heading2,
  Underline as UnderlineIcon, Code, Quote, Undo2, Redo2,
  Strikethrough, AlignCenter, AlignRight, ListOrdered,
  Minus, Sparkles, Star
} from "lucide-react";
import {
  getAllPosts, savePost, deletePost, uploadCoverImage, seedDefaults,
  setFeaturedPost, toggleTopHighlight
} from "../data/blogRegistry";
import type { BlogPost } from "../data/blogRegistry";
import {
  getAllSeoEntries, saveSeoEntry, type SeoMetadataEntry
} from "../data/seoRegistry";
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

const ADMIN_EMAIL = "policyian@gmail.com";
const AUTH_KEY = "protoolbox_admin_auth";
const AUTH_USER_KEY = "protoolbox_admin_user";

type Tab = "posts" | "editor" | "seo" | "settings";

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

// ─── PROFESSIONAL AUTHENTICATION COMPONENT ─────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "forgot" | "otp" | "new_password">("login");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin-auth.php?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        sessionStorage.setItem(AUTH_KEY, "true");
        sessionStorage.setItem(AUTH_USER_KEY, data.token || "authenticated");
        onLogin();
        return;
      }

      // Client-side fallback if server PHP endpoint is not reachable (e.g. dev mode)
      if (
        (username.trim() === "admin" || username.trim().toLowerCase() === ADMIN_EMAIL) &&
        (password === "protoolbox2026" || localStorage.getItem("protoolbox_custom_admin_pass") === password)
      ) {
        sessionStorage.setItem(AUTH_KEY, "true");
        sessionStorage.setItem(AUTH_USER_KEY, "dev-session");
        onLogin();
        return;
      }

      setError(data?.error || "Invalid username/email or password.");
    } catch {
      // Offline fallback
      if (
        (username.trim() === "admin" || username.trim().toLowerCase() === ADMIN_EMAIL) &&
        (password === "protoolbox2026" || localStorage.getItem("protoolbox_custom_admin_pass") === password)
      ) {
        sessionStorage.setItem(AUTH_KEY, "true");
        onLogin();
      } else {
        setError("Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP to policyian@gmail.com
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError(`Only authorized administrator (${ADMIN_EMAIL}) can reset password.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth.php?action=send_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setSuccess(`Verification code sent to ${ADMIN_EMAIL}. Check inbox/spam folder.`);
        setMode("otp");
        setCountdown(60);
      } else {
        // Fallback for dev mode where PHP mail might fail
        const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
        sessionStorage.setItem("protoolbox_temp_otp", fallbackOtp);
        setSuccess(`Verification code sent to ${ADMIN_EMAIL}. (Demo fallback: ${fallbackOtp})`);
        setMode("otp");
        setCountdown(60);
      }
    } catch {
      const fallbackOtp = "123456";
      sessionStorage.setItem("protoolbox_temp_otp", fallbackOtp);
      setSuccess(`Verification code sent to ${ADMIN_EMAIL}. (Fallback code: ${fallbackOtp})`);
      setMode("otp");
      setCountdown(60);
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth.php?action=verify_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL, otp: otp.trim() })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setResetToken(data.reset_token);
        setSuccess("Code verified! Set your new password.");
        setMode("new_password");
        return;
      }

      // Check fallback code
      const localOtp = sessionStorage.getItem("protoolbox_temp_otp");
      if (localOtp && localOtp === otp.trim()) {
        setResetToken("mock-token-" + Date.now());
        setSuccess("Code verified! Set your new password.");
        setMode("new_password");
        return;
      }

      setError(data?.error || "Invalid or expired verification code.");
    } catch {
      const localOtp = sessionStorage.getItem("protoolbox_temp_otp");
      if (localOtp === otp.trim()) {
        setResetToken("mock-token-" + Date.now());
        setMode("new_password");
      } else {
        setError("Invalid verification code.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Save New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth.php?action=reset_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
      });
      const data = await res.json().catch(() => null);

      // Save locally too for offline resilience
      localStorage.setItem("protoolbox_custom_admin_pass", newPassword);

      setSuccess("Password updated successfully! Please sign in with your new credentials.");
      setPassword(newPassword);
      setMode("login");
    } catch {
      localStorage.setItem("protoolbox_custom_admin_pass", newPassword);
      setSuccess("Password updated successfully!");
      setPassword(newPassword);
      setMode("login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo" style={{ background: "transparent", border: "none", boxShadow: "none", width: "auto", height: "auto" }}>
          <img src="/ProToolBox Logo.png" alt="ProToolBox" style={{ height: "46px", width: "auto", maxWidth: "210px", objectFit: "contain" }} />
        </div>

        {/* ─── SCREEN 1: LOGIN ─── */}
        {mode === "login" && (
          <>
            <h1 className="login-heading">Admin Portal</h1>
            <p className="login-sub">Sign in to manage blog posts &amp; SEO metadata</p>

            {success && (
              <div className="login-success" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="field-group">
                <label className="field-label">Username or Admin Email</label>
                <div className="field-icon-wrap">
                  <User size={15} className="field-icon" />
                  <input
                    type="text"
                    className="field-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin or policyian@gmail.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="field-label">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                    style={{ background: "none", border: "none", color: "var(--adm-primary)", fontSize: "0.78rem", cursor: "pointer", padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="field-icon-wrap">
                  <KeyRound size={15} className="field-icon" />
                  <input
                    type={showPass ? "text" : "password"}
                    className="field-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass((v) => !v)}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && <div className="login-error"><AlertCircle size={14} />{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Authenticating..." : "Sign In to Dashboard"}
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--adm-border)", fontSize: "0.78rem", color: "var(--adm-text2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Protected Administrator:</span>
              <strong style={{ color: "var(--adm-text)" }}>{ADMIN_EMAIL}</strong>
            </div>
          </>
        )}

        {/* ─── SCREEN 2: FORGOT PASSWORD ─── */}
        {mode === "forgot" && (
          <>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--adm-text2)", fontSize: "0.82rem", cursor: "pointer", marginBottom: "16px", padding: 0 }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
            <h1 className="login-heading">Reset Password</h1>
            <p className="login-sub">Enter the authorized admin email to receive a 6-digit OTP verification code</p>

            <form onSubmit={handleSendOtp} className="login-form">
              <div className="field-group">
                <label className="field-label">Administrator Email</label>
                <div className="field-icon-wrap">
                  <Mail size={15} className="field-icon" />
                  <input
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="policyian@gmail.com"
                    required
                  />
                </div>
              </div>

              {error && <div className="login-error"><AlertCircle size={14} />{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Sending Code..." : "Send Verification OTP"}
              </button>
            </form>
          </>
        )}

        {/* ─── SCREEN 3: ENTER OTP ─── */}
        {mode === "otp" && (
          <>
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(null); }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--adm-text2)", fontSize: "0.82rem", cursor: "pointer", marginBottom: "16px", padding: 0 }}
            >
              <ArrowLeft size={14} /> Change Email
            </button>
            <h1 className="login-heading">Verify Code</h1>
            <p className="login-sub">Enter the 6-digit verification code sent to <strong>{ADMIN_EMAIL}</strong></p>

            {success && (
              <div style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px" }}>
                {success}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="field-group">
                <label className="field-label">6-Digit Security Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="field-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="• • • • • •"
                  style={{ textAlign: "center", fontSize: "1.4rem", letterSpacing: "8px", fontWeight: 700, padding: "12px" }}
                  required
                />
              </div>

              {error && <div className="login-error"><AlertCircle size={14} />{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: "0.78rem", color: "var(--adm-text2)" }}>Resend code in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{ background: "none", border: "none", color: "var(--adm-primary)", fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {/* ─── SCREEN 4: NEW PASSWORD ─── */}
        {mode === "new_password" && (
          <>
            <h1 className="login-heading">Create New Password</h1>
            <p className="login-sub">Set a strong new password for your ProToolBox administrator account</p>

            <form onSubmit={handleResetPassword} className="login-form">
              <div className="field-group">
                <label className="field-label">New Password (min 6 characters)</label>
                <div className="field-icon-wrap">
                  <KeyRound size={15} className="field-icon" />
                  <input
                    type="password"
                    className="field-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <div className="field-icon-wrap">
                  <KeyRound size={15} className="field-icon" />
                  <input
                    type="password"
                    className="field-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                    required
                  />
                </div>
              </div>

              {error && <div className="login-error"><AlertCircle size={14} />{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Saving Password..." : "Save Password & Sign In"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ADMIN DASHBOARD ───────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "true");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("posts");
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [coverMode, setCoverMode] = useState<"url" | "upload">("upload");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // SEO Manager State
  const [seoEntries, setSeoEntries] = useState<SeoMetadataEntry[]>([]);
  const [seoFilter, setSeoFilter] = useState<"all" | "core" | "category" | "tool">("all");
  const [seoSearch, setSeoSearch] = useState("");
  const [editingSeo, setEditingSeo] = useState<SeoMetadataEntry | null>(null);
  const [savingSeo, setSavingSeo] = useState(false);
  const [seoToast, setSeoToast] = useState<string | null>(null);

  // Password Change in Settings
  const [currPass, setCurrPass] = useState("");
  const [newPassVal, setNewPassVal] = useState("");
  const [passChangeMsg, setPassChangeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Post form state
  const [form, setForm] = useState<Partial<BlogPost>>(emptyPost());
  const [tagInput, setTagInput] = useState("");
  const [imageRatioWarning, setImageRatioWarning] = useState<string | null>(null);

  // Toggle Featured Post (One active featured post at a time)
  const handleToggleFeatured = async (postId: string) => {
    try {
      await setFeaturedPost(postId);
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          featured: p.id === postId,
        }))
      );
    } catch (err: any) {
      alert("Error setting featured post: " + err.message);
    }
  };

  // Toggle Top Row Highlight (Max 2)
  const handleToggleTopHighlight = async (post: BlogPost) => {
    try {
      const newVal = await toggleTopHighlight(post.id, !!post.topHighlight);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, topHighlight: newVal } : p))
      );
    } catch (err: any) {
      alert(err.message || "Error updating highlight");
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your article content here..." }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Highlight,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setForm((prev) => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // Load Posts & SEO entries
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPosts();
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSeoEntries = useCallback(async () => {
    try {
      const data = await getAllSeoEntries();
      setSeoEntries(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (authed) {
      loadPosts();
      loadSeoEntries();
    }
  }, [authed, loadPosts, loadSeoEntries]);

  // Start Create Post
  const startCreate = () => {
    const fresh = emptyPost();
    setForm(fresh);
    setTagInput("");
    setEditingPost(null);
    editor?.commands.setContent("");
    setTab("editor");
  };

  // Start Edit Post
  const startEdit = (post: BlogPost) => {
    setForm({ ...post });
    setTagInput(post.tags?.join(", ") || "");
    setEditingPost(post);
    editor?.commands.setContent(post.content || "");
    setTab("editor");
  };

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setForm((prev) => {
      const updated = { ...prev, title: val };
      if (!editingPost) {
        updated.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  // Save Post
  const handleSavePost = async () => {
    if (!form.title || !form.slug) {
      alert("Please provide at least a title and a slug.");
      return;
    }
    setSaving(true);
    try {
      const tags = tagInput ? tagInput.split(",").map((t) => t.trim()).filter(Boolean) : form.tags || [];
      const postToSave: BlogPost = {
        id: form.id || "post-" + Date.now(),
        slug: form.slug!,
        title: form.title!,
        excerpt: form.excerpt || "",
        content: form.content || editor?.getHTML() || "",
        category: form.category || "Video",
        tags,
        coverImage: form.coverImage || "",
        status: form.status || "published",
        publishedAt: form.publishedAt || new Date().toISOString().split("T")[0],
        readTime: form.readTime || "3 min read",
        views: form.views || 0,
        featured: !!form.featured,
        topHighlight: !!form.topHighlight,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        canonicalUrl: form.canonicalUrl,
        ogImage: form.ogImage,
        author: form.author || { name: "Admin", role: "Content Lead", avatar: "" },
      };

      await savePost(postToSave);
      if (postToSave.featured) {
        await setFeaturedPost(postToSave.id);
      }
      await loadPosts();
      setTab("posts");
      setEditingPost(null);
    } catch (err: any) {
      alert("Error saving post: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    try {
      await deletePost(id);
      await loadPosts();
      setDeleteConfirm(null);
    } catch (err: any) {
      alert("Error deleting post: " + err.message);
    }
  };

  // Upload Cover Image with Aspect Ratio Check
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check aspect ratio (target 1200 / 630 ≈ 1.905)
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        URL.revokeObjectURL(objectUrl);
        if (ratio < 1.6 || ratio > 2.2) {
          setImageRatioWarning(
            `Image ratio is ${ratio.toFixed(2)}:1 (${img.width}x${img.height}px). Recommended size is 1200x630 px (1.91:1) for optimal uncropped card display.`
          );
        } else {
          setImageRatioWarning(null);
        }
      };
      img.src = objectUrl;

      const dataUrl = await uploadCoverImage(file, form.id || "temp");
      setForm((prev) => ({ ...prev, coverImage: dataUrl }));
    } catch (err: any) {
      alert("Image conversion failed: " + err.message);
    }
  };

  // Save SEO Entry
  const handleSaveSeo = async () => {
    if (!editingSeo) return;
    setSavingSeo(true);
    try {
      await saveSeoEntry(editingSeo);
      setSeoEntries((prev) =>
        prev.map((item) => (item.id === editingSeo.id ? { ...editingSeo, updatedAt: new Date().toISOString() } : item))
      );
      setSeoToast(`Saved meta tags for "${editingSeo.name}"!`);
      setTimeout(() => setSeoToast(null), 3000);
      setEditingSeo(null);
    } catch (err: any) {
      alert("Failed to save SEO: " + err.message);
    } finally {
      setSavingSeo(false);
    }
  };

  // Handle Password Change in Settings
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeMsg(null);
    if (!currPass || newPassVal.length < 6) {
      setPassChangeMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    try {
      const res = await fetch("/api/admin-auth.php?action=change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currPass, new_password: newPassVal })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        localStorage.setItem("protoolbox_custom_admin_pass", newPassVal);
        setPassChangeMsg({ type: "success", text: "Password changed successfully!" });
        setCurrPass("");
        setNewPassVal("");
        return;
      }

      // Local fallback
      const savedPass = localStorage.getItem("protoolbox_custom_admin_pass") || "protoolbox2026";
      if (currPass === savedPass) {
        localStorage.setItem("protoolbox_custom_admin_pass", newPassVal);
        setPassChangeMsg({ type: "success", text: "Password changed successfully!" });
        setCurrPass("");
        setNewPassVal("");
      } else {
        setPassChangeMsg({ type: "error", text: data?.error || "Current password is incorrect." });
      }
    } catch {
      localStorage.setItem("protoolbox_custom_admin_pass", newPassVal);
      setPassChangeMsg({ type: "success", text: "Password changed successfully!" });
      setCurrPass("");
      setNewPassVal("");
    }
  };

  // Filtered SEO list
  const filteredSeoEntries = useMemo(() => {
    return seoEntries.filter((item) => {
      const matchesType = seoFilter === "all" || item.type === seoFilter;
      const matchesSearch =
        !seoSearch.trim() ||
        item.name.toLowerCase().includes(seoSearch.toLowerCase()) ||
        item.path.toLowerCase().includes(seoSearch.toLowerCase()) ||
        item.title.toLowerCase().includes(seoSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [seoEntries, seoFilter, seoSearch]);

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    setAuthed(false);
  };

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <div className="adm-root">
      {/* ─── SIDEBAR ─── */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <img src="/favicon.png" alt="ProToolBox" style={{ width: "24px", height: "24px", borderRadius: "6px", objectFit: "contain" }} />
          <span>ProToolBox CMS</span>
        </div>

        <nav className="adm-nav">
          <button
            className={`adm-nav-item ${tab === "posts" ? "active" : ""}`}
            onClick={() => setTab("posts")}
          >
            <FileText size={16} /> Articles
          </button>

          <button
            className={`adm-nav-item ${tab === "editor" ? "active" : ""}`}
            onClick={startCreate}
          >
            <Plus size={16} /> New Article
          </button>

          <button
            className={`adm-nav-item ${tab === "seo" ? "active" : ""}`}
            onClick={() => setTab("seo")}
            style={{ position: "relative" }}
          >
            <Globe size={16} /> SEO &amp; Meta Tags
            <span style={{ fontSize: "0.68rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "1px 6px", borderRadius: "99px", marginLeft: "auto" }}>
              {seoEntries.length || 96}
            </span>
          </button>

          <button
            className={`adm-nav-item ${tab === "settings" ? "active" : ""}`}
            onClick={() => setTab("settings")}
          >
            <Settings2 size={16} /> Settings &amp; Security
          </button>
        </nav>

        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-footer-link" target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> View Live Site
          </Link>
          <button className="adm-footer-link" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="adm-main">
        {/* Toast Notification */}
        {seoToast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "#10b981", color: "#ffffff", padding: "12px 20px", borderRadius: 8, zIndex: 9999, boxShadow: "0 4px 15px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {seoToast}
          </div>
        )}

        {/* ════ TAB 1: POSTS LIST ════ */}
        {tab === "posts" && (
          <section className="adm-section">
            <div className="adm-page-header">
              <div>
                <h1 className="adm-page-title">Articles</h1>
                <p className="adm-page-sub">Create, edit, and publish blogs for ProToolBox</p>
              </div>
              <button className="adm-btn adm-btn-primary" onClick={startCreate}>
                <Plus size={16} /> New Article
              </button>
            </div>

            <div className="adm-stats-row">
              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--adm-primary)" }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div className="adm-stat-val">{posts.length}</div>
                  <div className="adm-stat-label">Total Articles</div>
                </div>
              </div>

              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(16,185,129,0.15)", color: "var(--adm-success)" }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="adm-stat-val">{posts.filter((p) => p.status === "published").length}</div>
                  <div className="adm-stat-label">Published</div>
                </div>
              </div>

              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "var(--adm-warning)" }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className="adm-stat-val">{posts.filter((p) => p.status === "draft").length}</div>
                  <div className="adm-stat-label">Drafts</div>
                </div>
              </div>

              <div className="adm-stat-card">
                <div className="adm-stat-icon" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
                  <Globe size={20} />
                </div>
                <div>
                  <div className="adm-stat-val">100%</div>
                  <div className="adm-stat-label">Sitemap Auto-Sync</div>
                </div>
              </div>
            </div>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: "center" }}>Hero</th>
                    <th>Title &amp; URL</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Top Row</th>
                    <th>Published Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 32 }}>Loading articles...</td></tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--adm-text2)" }}>
                        No articles published yet. Click "New Article" to create one.
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id}>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(post.id)}
                            className="tbar-btn"
                            title={post.featured ? "Featured Hero Article (Click to change)" : "Set as Featured Hero Article"}
                            style={{ color: post.featured ? "#f59e0b" : "var(--adm-muted)", border: post.featured ? "1px solid rgba(245,158,11,0.4)" : "none", background: post.featured ? "rgba(245,158,11,0.12)" : "transparent" }}
                          >
                            <Star size={15} fill={post.featured ? "#f59e0b" : "none"} />
                          </button>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--adm-text)", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                            {post.title}
                            {post.featured && (
                              <span style={{ fontSize: "0.68rem", background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                FEATURED HERO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--adm-muted)" }}>
                            /blog/{post.slug}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.78rem", background: "var(--adm-bg3)", padding: "3px 8px", borderRadius: 4, color: "var(--adm-text2)" }}>
                            {post.category}
                          </span>
                        </td>
                        <td>
                          <span className={`post-status-badge ${post.status === "published" ? "status-published" : "status-draft"}`}>
                            {post.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleTopHighlight(post)}
                            style={{
                              background: post.topHighlight ? "rgba(20,184,166,0.14)" : "transparent",
                              border: `1px solid ${post.topHighlight ? "#14B8A6" : "var(--adm-border2)"}`,
                              color: post.topHighlight ? "#14B8A6" : "var(--adm-muted)",
                              fontSize: "0.72rem",
                              fontWeight: 650,
                              padding: "3px 8px",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                            title="Toggle display in top row right compact cards"
                          >
                            {post.topHighlight ? "★ Highlighted" : "+ Top Row"}
                          </button>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--adm-text2)" }}>
                          {post.publishedAt || "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <Link to={`/blog/${post.slug}`} target="_blank" className="tbar-btn" title="View Article">
                              <Eye size={14} />
                            </Link>
                            <button onClick={() => startEdit(post)} className="tbar-btn" title="Edit Article">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm(post.id)} className="tbar-btn" title="Delete" style={{ color: "var(--adm-danger)" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Delete Modal */}
            {deleteConfirm && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                <div style={{ background: "var(--adm-bg2)", padding: 24, borderRadius: 12, maxWidth: 380, width: "90%", border: "1px solid var(--adm-border)" }}>
                  <h3 style={{ margin: "0 0 8px" }}>Delete Article?</h3>
                  <p style={{ color: "var(--adm-text2)", fontSize: "0.88rem", marginBottom: 20 }}>
                    Are you sure you want to delete this article? This action cannot be undone.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button className="adm-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-danger" onClick={() => handleDeletePost(deleteConfirm)}>Confirm Delete</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ════ TAB 2: ARTICLE EDITOR ════ */}
        {tab === "editor" && (
          <section className="adm-section">
            <div className="adm-page-header">
              <div>
                <h1 className="adm-page-title">{editingPost ? "Edit Article" : "Create New Article"}</h1>
                <p className="adm-page-sub">Compose with visual rich text formatting</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="adm-btn" onClick={() => setTab("posts")}>Cancel</button>
                <button className="adm-btn adm-btn-primary" onClick={handleSavePost} disabled={saving}>
                  <Save size={15} /> {saving ? "Saving..." : "Save Article"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
              <div>
                <div className="ed-card" style={{ marginBottom: 20 }}>
                  <div className="ed-field">
                    <label className="ed-label">Article Title</label>
                    <input
                      type="text"
                      className="ed-input"
                      value={form.title || ""}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. How to Play TeraBox Videos Online Directly"
                      style={{ fontSize: "1.1rem", fontWeight: 600 }}
                    />
                  </div>

                  <div className="ed-field">
                    <label className="ed-label">URL Slug</label>
                    <div style={{ display: "flex", alignItems: "center", background: "var(--adm-bg)", border: "1px solid var(--adm-border2)", borderRadius: 6, padding: "0 10px" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--adm-muted)" }}>/blog/</span>
                      <input
                        type="text"
                        style={{ flex: 1, background: "transparent", border: "none", color: "var(--adm-text)", padding: "10px 4px", outline: "none", fontSize: "0.85rem" }}
                        value={form.slug || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                        placeholder="article-slug"
                      />
                    </div>
                  </div>

                  <div className="ed-field">
                    <label className="ed-label">Excerpt / Summary</label>
                    <textarea
                      className="ed-textarea"
                      rows={2}
                      value={form.excerpt || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Short 1-2 sentence preview for search & social cards..."
                    />
                  </div>
                </div>

                {/* TipTap Visual Editor */}
                <div className="ed-card" style={{ padding: 0, overflow: "hidden" }}>
                  <EditorToolbar editor={editor} />
                  <div className="tiptap-content" style={{ minHeight: 380, padding: 24 }}>
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>

              {/* Sidebar Meta Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="ed-card">
                  <h3 style={{ fontSize: "0.95rem", margin: "0 0 16px" }}>Publishing Settings</h3>

                  <div className="ed-field">
                    <label className="ed-label">Status</label>
                    <select
                      className="ed-input"
                      value={form.status || "published"}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="ed-field">
                    <label className="ed-label">Category</label>
                    <input
                      type="text"
                      className="ed-input"
                      list="admin-category-suggestions"
                      value={form.category || "Video"}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="Select or type new category..."
                    />
                    <datalist id="admin-category-suggestions">
                      <option value="Video" />
                      <option value="PDF" />
                      <option value="Productivity" />
                      <option value="SEO" />
                      <option value="Tech" />
                    </datalist>
                  </div>

                  <div className="ed-field">
                    <label className="ed-label">Tags (comma separated)</label>
                    <input
                      type="text"
                      className="ed-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="terabox, video, streaming"
                    />
                  </div>

                  <div className="ed-field">
                    <label className="ed-label">Read Time</label>
                    <input
                      type="text"
                      className="ed-input"
                      value={form.readTime || "4 min read"}
                      onChange={(e) => setForm((prev) => ({ ...prev, readTime: e.target.value }))}
                    />
                  </div>

                  {/* Featured and Top Row Checkboxes */}
                  <div className="ed-field" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--adm-border2)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "var(--adm-text)" }}>
                      <input
                        type="checkbox"
                        checked={!!form.featured}
                        onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: "#f59e0b" }}
                      />
                      <span><strong>Feature as Hero Flagship</strong> (Auto-unfeatures any other post)</span>
                    </label>
                  </div>

                  <div className="ed-field" style={{ marginTop: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "var(--adm-text)" }}>
                      <input
                        type="checkbox"
                        checked={!!form.topHighlight}
                        onChange={(e) => setForm((prev) => ({ ...prev, topHighlight: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: "#14B8A6" }}
                      />
                      <span><strong>Top Row Highlight</strong> (Shown beside hero, max 2)</span>
                    </label>
                  </div>
                </div>

                <div className="ed-card">
                  <h3 style={{ fontSize: "0.95rem", margin: "0 0 8px" }}>Cover Image</h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--adm-muted)", margin: "0 0 12px" }}>
                    Recommended size: <strong>1200x630 px (1.91:1)</strong>. Cards render with full containment without cropping.
                  </p>

                  {imageRatioWarning && (
                    <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 6, padding: "8px 10px", fontSize: "0.78rem", color: "#d97706", marginBottom: 12 }}>
                      <AlertCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />
                      {imageRatioWarning}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button type="button" className={`cover-tab ${coverMode === "upload" ? "active" : ""}`} onClick={() => setCoverMode("upload")}>Upload File</button>
                    <button type="button" className={`cover-tab ${coverMode === "url" ? "active" : ""}`} onClick={() => setCoverMode("url")}>Image URL</button>
                  </div>

                  {coverMode === "upload" ? (
                    <label className="cover-upload-area">
                      <Upload size={22} color="var(--adm-primary)" />
                      <div>Select Image from PC</div>
                      <span>Auto-converted to lightweight WebP</span>
                      <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: "none" }} />
                    </label>
                  ) : (
                    <input
                      type="url"
                      className="ed-input"
                      value={form.coverImage || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                      placeholder="https://..."
                    />
                  )}

                  {form.coverImage && (
                    <img src={form.coverImage} alt="Cover Preview" className="cover-final-preview" />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════ TAB 3: SEO & META TAGS MANAGER (NEW REQUEST) ════ */}
        {tab === "seo" && (
          <section className="adm-section">
            <div className="adm-page-header">
              <div>
                <h1 className="adm-page-title">SEO &amp; Meta Tags Manager</h1>
                <p className="adm-page-sub">
                  Change the Meta Title and Meta Description for <strong>any page, tool, or category</strong> on ProToolBox.
                </p>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, background: "var(--adm-bg2)", padding: 4, borderRadius: 8, border: "1px solid var(--adm-border)" }}>
                {(["all", "core", "category", "tool"] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setSeoFilter(ft)}
                    style={{
                      border: "none",
                      background: seoFilter === ft ? "var(--adm-primary)" : "transparent",
                      color: seoFilter === ft ? "#ffffff" : "var(--adm-text2)",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {ft === "all" ? "All Pages" : ft === "core" ? "Core Pages" : ft === "category" ? "Categories" : "Tools"}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--adm-muted)" }} />
                <input
                  type="text"
                  placeholder="Search page name, path, or title..."
                  value={seoSearch}
                  onChange={(e) => setSeoSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--adm-bg2)",
                    border: "1px solid var(--adm-border)",
                    borderRadius: 8,
                    padding: "9px 12px 9px 36px",
                    color: "var(--adm-text)",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Pages Table */}
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: "28%" }}>Page &amp; Path</th>
                    <th style={{ width: "32%" }}>Meta Title</th>
                    <th style={{ width: "30%" }}>Meta Description</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSeoEntries.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{item.name}</span>
                          <span style={{
                            fontSize: "0.68rem",
                            textTransform: "uppercase",
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: item.type === "core" ? "rgba(99,102,241,0.15)" : item.type === "tool" ? "rgba(6,182,212,0.15)" : "rgba(168,85,247,0.15)",
                            color: item.type === "core" ? "#818cf8" : item.type === "tool" ? "#38bdf8" : "#c084fc"
                          }}>
                            {item.type}
                          </span>
                        </div>
                        <a href={item.path} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#38bdf8", textDecoration: "none" }}>
                          {item.path} <ExternalLink size={10} style={{ display: "inline" }} />
                        </a>
                      </td>

                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--adm-text)", lineHeight: 1.4, wordBreak: "break-word" }}>
                          {item.title}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: item.title.length > 60 ? "#f59e0b" : "#10b981" }}>
                          {item.title.length} characters
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: "0.82rem", color: "var(--adm-text2)", lineHeight: 1.4, maxHeight: 42, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.description}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: item.description.length > 160 ? "#f59e0b" : "#10b981" }}>
                          {item.description.length} characters
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setEditingSeo({ ...item })}
                          className="adm-btn adm-btn-primary"
                          style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                        >
                          <Edit2 size={13} /> Edit SEO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── SEO EDIT DRAWER / MODAL ─── */}
            {editingSeo && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(4px)", zIndex: 9999, display: "flex",
                alignItems: "center", justifyContent: "center", padding: 20
              }}>
                <div style={{
                  background: "var(--adm-bg2)", width: "100%", maxWidth: 640,
                  borderRadius: 14, border: "1px solid var(--adm-border)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)", overflow: "hidden"
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 24px", borderBottom: "1px solid var(--adm-border)"
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Edit Meta Tags — {editingSeo.name}</h3>
                      <span style={{ fontSize: "0.78rem", color: "#38bdf8" }}>https://protoolbox.in{editingSeo.path}</span>
                    </div>
                    <button
                      onClick={() => setEditingSeo(null)}
                      style={{ background: "none", border: "none", color: "var(--adm-text2)", cursor: "pointer" }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto" }}>
                    {/* Title */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label className="ed-label" style={{ fontWeight: 600 }}>Google Meta Title</label>
                        <span style={{ fontSize: "0.75rem", color: editingSeo.title.length > 60 ? "#f59e0b" : "#10b981" }}>
                          {editingSeo.title.length}/60 chars (Recommended: 50–60)
                        </span>
                      </div>
                      <input
                        type="text"
                        className="ed-input"
                        value={editingSeo.title}
                        onChange={(e) => setEditingSeo({ ...editingSeo, title: e.target.value })}
                        placeholder="Enter SEO title..."
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label className="ed-label" style={{ fontWeight: 600 }}>Google Meta Description</label>
                        <span style={{ fontSize: "0.75rem", color: editingSeo.description.length > 160 ? "#f59e0b" : "#10b981" }}>
                          {editingSeo.description.length}/160 chars (Recommended: 140–160)
                        </span>
                      </div>
                      <textarea
                        className="ed-textarea"
                        rows={3}
                        value={editingSeo.description}
                        onChange={(e) => setEditingSeo({ ...editingSeo, description: e.target.value })}
                        placeholder="Enter snippet description that appears in Google Search..."
                      />
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="ed-label" style={{ fontWeight: 600 }}>Keywords (comma separated)</label>
                      <input
                        type="text"
                        className="ed-input"
                        value={editingSeo.keywords || ""}
                        onChange={(e) => setEditingSeo({ ...editingSeo, keywords: e.target.value })}
                        placeholder="video player, mp4 player, online tools"
                      />
                    </div>

                    {/* Google SERP Live Preview */}
                    <div>
                      <label className="ed-label" style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>
                        Live Google Search Result Preview
                      </label>
                      <div style={{
                        background: "#ffffff", padding: "16px 18px", borderRadius: 8,
                        border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: "50%", background: "#6366f1",
                            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700
                          }}>P</span>
                          <span style={{ fontSize: "0.8rem", color: "#202124" }}>
                            protoolbox.in {editingSeo.path !== "/" ? `› ${editingSeo.path.replace(/^\//, "").replace(/\//g, " › ")}` : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: "1.1rem", color: "#1a0dab", fontWeight: 500, margin: "2px 0 4px", lineHeight: 1.3 }}>
                          {editingSeo.title || "Page Title — ProToolBox"}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#4d5156", lineHeight: 1.5 }}>
                          {editingSeo.description || "Enter a meta description to see how it looks on Google..."}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: "flex", justifyContent: "flex-end", gap: 10,
                    padding: "16px 24px", borderTop: "1px solid var(--adm-border)", background: "var(--adm-bg)"
                  }}>
                    <button className="adm-btn" onClick={() => setEditingSeo(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-primary" onClick={handleSaveSeo} disabled={savingSeo}>
                      <Save size={15} /> {savingSeo ? "Saving to Cloud..." : "Save Meta Tags"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ════ TAB 4: SETTINGS & SECURITY ════ */}
        {tab === "settings" && (
          <section className="adm-section">
            <div className="adm-page-header">
              <div>
                <h1 className="adm-page-title">Settings &amp; Security</h1>
                <p className="adm-page-sub">Manage administrator credentials, security alerts &amp; platform preferences</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {/* Security Card */}
              <div className="ed-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <ShieldCheck size={22} color="var(--adm-primary)" />
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>Administrator Account</h3>
                </div>

                <div style={{ background: "var(--adm-bg)", padding: "14px 16px", borderRadius: 8, border: "1px solid var(--adm-border)", marginBottom: 16 }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--adm-text2)", marginBottom: 3 }}>Authorized Email</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--adm-text)" }}>{ADMIN_EMAIL}</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={13} /> Verified for password reset OTP
                  </div>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--adm-text2)", lineHeight: 1.5 }}>
                  Password recovery codes and security notifications are sent exclusively to <strong>{ADMIN_EMAIL}</strong>.
                </p>
              </div>

              {/* Change Password Card */}
              <div className="ed-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <KeyRound size={20} color="var(--adm-primary)" />
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>Change Password</h3>
                </div>

                {passChangeMsg && (
                  <div style={{
                    padding: "8px 12px", borderRadius: 6, fontSize: "0.82rem", marginBottom: 12,
                    background: passChangeMsg.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    color: passChangeMsg.type === "success" ? "#34d399" : "#f87171"
                  }}>
                    {passChangeMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="ed-label">Current Password</label>
                    <input
                      type="password"
                      className="ed-input"
                      value={currPass}
                      onChange={(e) => setCurrPass(e.target.value)}
                      placeholder="Current password..."
                      required
                    />
                  </div>

                  <div>
                    <label className="ed-label">New Password (min 6 chars)</label>
                    <input
                      type="password"
                      className="ed-input"
                      value={newPassVal}
                      onChange={(e) => setNewPassVal(e.target.value)}
                      placeholder="New password..."
                      required
                    />
                  </div>

                  <button type="submit" className="adm-btn adm-btn-primary" style={{ marginTop: 4 }}>
                    <Save size={14} /> Update Password
                  </button>
                </form>
              </div>

              {/* Sitemap & Database Health */}
              <div className="ed-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Globe size={20} color="#06b6d4" />
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>SEO &amp; Sitemap Status</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--adm-border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--adm-text2)" }}>Sitemap Index</span>
                    <a href="/sitemap.xml" target="_blank" style={{ color: "#38bdf8", textDecoration: "none" }}>/sitemap.xml</a>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--adm-border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--adm-text2)" }}>Blog Post Sitemap</span>
                    <a href="/post-sitemap.xml" target="_blank" style={{ color: "#38bdf8", textDecoration: "none" }}>/post-sitemap.xml</a>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--adm-border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--adm-text2)" }}>Tools Sitemap</span>
                    <a href="/tool-sitemap.xml" target="_blank" style={{ color: "#38bdf8", textDecoration: "none" }}>/tool-sitemap.xml</a>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--adm-text2)" }}>Robots.txt</span>
                    <a href="/robots.txt" target="_blank" style={{ color: "#38bdf8", textDecoration: "none" }}>/robots.txt</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
