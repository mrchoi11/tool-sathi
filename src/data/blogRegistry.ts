import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc,
  query, where, orderBy, Timestamp, writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;                   // HTML from TipTap editor
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  category: "Video" | "PDF" | "Productivity" | "SEO" | "Tech";
  tags: string[];
  coverImage: string;
  publishedAt: string;
  status: "published" | "draft";
  readTime: string;
  views?: number;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

const COLLECTION = "blog_posts";

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (snap.empty) {
      return INITIAL_POSTS;
    }
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
    const existingSlugs = new Set(posts.map((p) => p.slug));
    const fallback = INITIAL_POSTS.filter((p) => !existingSlugs.has(p.slug));
    const combined = [...posts, ...fallback];
    return combined.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  } catch (err) {
    console.error("Error fetching all posts:", err);
    return INITIAL_POSTS;
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (snap.empty) {
      return INITIAL_POSTS.filter((p) => p.status === "published");
    }
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
    const published = posts.filter((p) => p.status === "published");
    const existingSlugs = new Set(published.map((p) => p.slug));
    const fallback = INITIAL_POSTS.filter((p) => p.status === "published" && !existingSlugs.has(p.slug));
    const combined = [...published, ...fallback];
    return combined.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  } catch (err) {
    console.error("Error fetching published posts:", err);
    return INITIAL_POSTS.filter((p) => p.status === "published");
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const all = await getAllPosts();
    return all.find((p) => p.slug === slug);
  } catch (err) {
    console.error("Error fetching post by slug:", err);
    return INITIAL_POSTS.find((p) => p.slug === slug);
  }
}

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function savePost(post: BlogPost): Promise<void> {
  const { id, ...data } = post;
  
  // 12s timeout so it never hangs indefinitely
  const savePromise = setDoc(doc(db, COLLECTION, id), data, { merge: true });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Connection timeout: Firestore Database may not be created or Rules are blocking writes.")), 12000)
  );

  await Promise.race([savePromise, timeoutPromise]);
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// ─── IMAGE UPLOAD (100% Free - Instant In-Browser WebP Compression) ──────────

export async function uploadCoverImage(file: File, _postId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 630;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Instant base64 WebP (~30-60KB) - Saves directly to Firestore, 0ms network latency
          const dataUrl = canvas.toDataURL("image/webp", 0.82);
          resolve(dataUrl);
        } catch (canvasErr) {
          reject(canvasErr);
        }
      };
      img.onerror = () => reject(new Error("Failed to load selected image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

// ─── SEED DEFAULTS ───────────────────────────────────────────────────────────

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: "post-1",
    slug: "building-high-performance-video-apps",
    title: "Building High-Performance Web Video Applications with Hardware Acceleration",
    excerpt: "A deep dive into HTML5 video pipelines, adaptive bitrate streaming, web codecs, and GPU decoding for smooth, low-latency browser video players.",
    category: "Video",
    tags: ["video player", "streaming", "web codecs", "gpu acceleration"],
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-11-09",
    status: "published",
    readTime: "7 min read",
    views: 3420,
    metaTitle: "Building High-Performance Web Video Applications | ProToolBox",
    metaDescription: "Learn how modern browser video players leverage GPU decoding and WebCodecs for lightning-fast streaming.",
    author: {
      name: "Sarah Chen",
      role: "Frontend Performance Lead",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Next-Generation Video Playback Architecture</h2><p>Modern web video streaming demands unprecedented efficiency...</p>",
  },
  {
    id: "post-2",
    slug: "how-to-play-terabox-videos-online-without-app",
    title: "How to Play TeraBox Videos Online Directly in Your Browser (No App Required)",
    excerpt: "Frustrated by forced app downloads and slow streaming? Learn the best ways to play and stream TeraBox shared video links online smoothly on mobile and PC.",
    category: "Video",
    tags: ["terabox", "video player", "streaming", "cloud video"],
    coverImage: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-11-07",
    status: "published",
    readTime: "4 min read",
    views: 2950,
    metaTitle: "Play TeraBox Videos Online Free – No App Needed | ProToolBox",
    metaDescription: "Stream any TeraBox shared video link directly in your browser. No app download required. Works on mobile & PC.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Why TeraBox Forces App Downloads</h2><p>TeraBox has become one of the most widely used cloud storage platforms...</p>",
  },
  {
    id: "post-3",
    slug: "client-side-pdf-merge-split-security",
    title: "Client-Side PDF Architecture: How In-Browser Document Processing Protects Privacy",
    excerpt: "Why uploading confidential PDFs to unknown servers is risky, and how WebAssembly-powered browser engines parse, split, and merge PDF byte streams 100% locally.",
    category: "PDF",
    tags: ["pdf tools", "wasm", "client-side", "security", "pdf merge"],
    coverImage: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-11-05",
    status: "published",
    readTime: "6 min read",
    views: 1840,
    metaTitle: "Client-Side PDF Security & Architecture Guide | ProToolBox",
    metaDescription: "Discover how client-side WebAssembly enables secure, private PDF merging and compression without server uploads.",
    author: {
      name: "Marcus Brody",
      role: "Security & Systems Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>The Security Risks of Server-Side PDF Converters</h2><p>Every time you upload a financial statement or contract...</p>",
  },
  {
    id: "post-4",
    slug: "terabox-video-player-direct-url-streaming",
    title: "How to Stream TeraBox Shared Links via Direct URL: No Installation Needed",
    excerpt: "A complete walkthrough on resolving TeraBox shared file URLs into high-speed direct video streams using client-side video players.",
    category: "Video",
    tags: ["terabox", "streaming", "video player", "direct link"],
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-11-04",
    status: "published",
    readTime: "5 min read",
    views: 2180,
    metaTitle: "Stream TeraBox Direct URL Videos | ProToolBox",
    metaDescription: "Step by step instructions to bypass TeraBox speed limits and play cloud videos directly.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Bypassing TeraBox Stream Restrictions</h2><p>TeraBox shared URLs are often bundled with app banners...</p>",
  },
  {
    id: "post-5",
    slug: "diskwala-video-player-ad-free-playback",
    title: "Stream Diskwala Videos Directly in Your Browser Without Popups or App Downloads",
    excerpt: "Stop suffering through redirect loops and deceptive ads. Learn how our direct Diskwala player extracts clean media streams for instant playback.",
    category: "Video",
    tags: ["diskwala", "video player", "streaming", "clean player"],
    coverImage: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-11-02",
    status: "published",
    readTime: "4 min read",
    views: 3120,
    metaTitle: "Stream Diskwala Videos Free Online | ProToolBox",
    metaDescription: "Play Diskwala video links smoothly without adware, redirects, or installing suspicious APKs.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Overcoming Diskwala Ad Redirects</h2><p>Diskwala link shorteners frequently bombard users with tricky ad pages...</p>",
  },
  {
    id: "post-6",
    slug: "client-side-image-compression-canvas",
    title: "Zero-Server Image Compression: How In-Browser Canvas APIs Reduce File Sizes by 85%",
    excerpt: "Explore the mathematics of bilinear resampling, DCT quantization in JPEG/WebP encoders, and how to compress gigabytes of images 100% privately.",
    category: "Tech",
    tags: ["image compressor", "canvas", "performance", "webp"],
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-30",
    status: "published",
    readTime: "5 min read",
    views: 1890,
    metaTitle: "Zero-Server Image Compression Explained | ProToolBox",
    metaDescription: "How HTML5 Canvas and WebP codecs achieve 85% file size reduction directly in client memory.",
    author: {
      name: "Sarah Chen",
      role: "Frontend Performance Lead",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>The Mechanics of In-Browser Resampling</h2><p>HTML5 Canvas allows native manipulation of raw pixel buffers...</p>",
  },
  {
    id: "post-7",
    slug: "html-to-word-offline-conversion",
    title: "Clean HTML to Word (DOCX) Conversion: Preserving Tables, Headers & Styles Offline",
    excerpt: "Master the technique of converting web documents, rich-text editor outputs, and complex tables into production-grade Microsoft Word files without servers.",
    category: "Productivity",
    tags: ["html to word", "docx", "converter", "productivity"],
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-26",
    status: "published",
    readTime: "4 min read",
    views: 1450,
    metaTitle: "HTML to Word Offline Conversion Guide | ProToolBox",
    metaDescription: "Convert HTML content into formatted DOCX files offline with embedded styles and table structures.",
    author: {
      name: "David Kim",
      role: "Productivity Specialist",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Why HTML to DOCX Formatting Breaks</h2><p>Converting HTML to Word XML requires mapping CSS styles into OOXML definitions...</p>",
  },
  {
    id: "post-8",
    slug: "essential-on-page-seo-audit-checklist",
    title: "10 Critical On-Page SEO Factors You Can Audit Instantly for Higher Search Rankings",
    excerpt: "From OpenGraph tags and canonical URLs to heading hierarchy and schema markup — audit your web pages with free browser-based SEO tools.",
    category: "SEO",
    tags: ["seo", "meta tags", "audit", "google ranking"],
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-21",
    status: "published",
    readTime: "6 min read",
    views: 2410,
    metaTitle: "10 Critical On-Page SEO Audit Checks | ProToolBox",
    metaDescription: "Comprehensive guide to evaluating on-page technical SEO, meta descriptions, headings, and structured data.",
    author: {
      name: "Elena Rostova",
      role: "SEO Technical Lead",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Essential Technical SEO Checklist</h2><p>Modern search engines prioritize semantic markup and fast loading speeds...</p>",
  },
  {
    id: "post-9",
    slug: "video-thumbnail-extractor-canvas",
    title: "Extract Crisp Video Frame Thumbnails at Any Timestamp Using HTML5 Video & Canvas",
    excerpt: "A step-by-step technical guide to extracting high-resolution poster images and video frame sequences without external software or FFmpeg binaries.",
    category: "Video",
    tags: ["video thumbnail", "video player", "canvas", "frame extractor"],
    coverImage: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-18",
    status: "published",
    readTime: "4 min read",
    views: 1820,
    metaTitle: "Extract Video Frame Thumbnails Online | ProToolBox",
    metaDescription: "Capture exact timestamp video frames into high-resolution PNG or JPG images directly in your browser.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Direct Frame Extraction from HTML5 Video Elements</h2><p>Capturing video frames in the browser is fast and accurate using Canvas 2D context...</p>",
  },
];

export async function seedDefaults(): Promise<void> {
  const batch = writeBatch(db);
  for (const post of INITIAL_POSTS) {
    const { id, ...data } = post;
    batch.set(doc(db, COLLECTION, id), data, { merge: false });
  }
  await batch.commit();
}
