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
  category: "Video" | "PDF" | "Productivity" | "SEO" | "Tech" | string;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  status: "published" | "draft";
  readTime: string;
  views?: number;
  featured?: boolean;
  topHighlight?: boolean;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

const COLLECTION = "blog_posts";

export function formatBlogDate(publishedAt?: string, updatedAt?: string): string {
  if (updatedAt && publishedAt) {
    const pub = new Date(publishedAt).getTime();
    const upd = new Date(updatedAt).getTime();
    if (!isNaN(upd) && (!isNaN(pub) ? upd - pub > 60000 : true)) {
      const d = new Date(updatedAt);
      return `Updated: ${d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
    }
  }
  if (publishedAt) {
    const d = new Date(publishedAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    }
    return publishedAt;
  }
  return "";
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const fetchPromise = getDocs(collection(db, COLLECTION));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore fetch timeout")), 2500)
    );
    const snap = await Promise.race([fetchPromise, timeoutPromise]);
    if (snap.empty) {
      return INITIAL_POSTS;
    }
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
    // Filter out dummy/test posts
    const cleanPosts = posts.filter(
      (p) =>
        p.title &&
        !p.title.toLowerCase().includes("ds dmsmksd") &&
        !p.title.toLowerCase().includes("bhvgvg") &&
        !p.title.toLowerCase().includes("hijiojio") &&
        !p.title.toLowerCase().includes("1234567890")
    );
    return cleanPosts.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  } catch (err) {
    console.error("Error fetching all posts:", err);
    return INITIAL_POSTS;
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const fetchPromise = getDocs(collection(db, COLLECTION));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore fetch timeout")), 2500)
    );
    const snap = await Promise.race([fetchPromise, timeoutPromise]);
    if (snap.empty) {
      return INITIAL_POSTS.filter((p) => p.status === "published");
    }
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
    const published = posts.filter(
      (p) =>
        p.status === "published" &&
        p.title &&
        !p.title.toLowerCase().includes("ds dmsmksd") &&
        !p.title.toLowerCase().includes("bhvgvg") &&
        !p.title.toLowerCase().includes("hijiojio") &&
        !p.title.toLowerCase().includes("1234567890")
    );
    return published.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
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

export async function setFeaturedPost(targetId: string): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const batch = writeBatch(db);
    
    // Un-feature all other posts, feature the target
    snap.docs.forEach((d) => {
      if (d.id === targetId) {
        batch.update(d.ref, { featured: true });
      } else if (d.data().featured) {
        batch.update(d.ref, { featured: false });
      }
    });

    // If targetId is from INITIAL_POSTS and not yet in firestore:
    const exists = snap.docs.some((d) => d.id === targetId);
    if (!exists) {
      const fallbackPost = INITIAL_POSTS.find((p) => p.id === targetId);
      if (fallbackPost) {
        const { id, ...data } = fallbackPost;
        batch.set(doc(db, COLLECTION, targetId), { ...data, featured: true });
      }
    }

    const commitPromise = batch.commit();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout updating featured post")), 12000)
    );
    await Promise.race([commitPromise, timeoutPromise]);
  } catch (err) {
    console.error("Error setting featured post in Firestore:", err);
    throw err;
  }
}

export async function toggleTopHighlight(targetId: string, currentVal: boolean): Promise<boolean> {
  try {
    const newVal = !currentVal;
    if (newVal) {
      // Check count of currently highlighted posts (max 2)
      const snap = await getDocs(collection(db, COLLECTION));
      const highlighted = snap.docs.filter((d) => d.data().topHighlight && d.id !== targetId);
      if (highlighted.length >= 2) {
        throw new Error("Maximum 2 articles can be highlighted in the top row. Please unhighlight another first.");
      }
    }

    const postRef = doc(db, COLLECTION, targetId);
    await setDoc(postRef, { topHighlight: newVal }, { merge: true });
    return newVal;
  } catch (err) {
    console.error("Error toggling top highlight:", err);
    throw err;
  }
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
    featured: true,
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
  {
    id: "post-10",
    slug: "how-to-play-terabox-without-app-redirects",
    title: "How to Play TeraBox Videos Without URL App Install or Redirects",
    excerpt: "Learn how to bypass annoying download traps and watch TeraBox videos directly in your mobile browser with zero app installation.",
    category: "Video",
    tags: ["terabox", "streaming", "video player"],
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-16",
    status: "published",
    readTime: "5 min read",
    views: 2150,
    metaTitle: "Play TeraBox Without App Redirects | ProToolBox",
    metaDescription: "Step by step tutorial to play TeraBox links directly on Android, iPhone, and PC without app installs.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Direct Playback Architecture</h2><p>Direct web streaming avoids bloated applications...</p>",
  },
  {
    id: "post-11",
    slug: "advanced-video-streaming-hls-web-codecs",
    title: "Advanced Video Streaming: Low Latency HLS & WebCodecs Acceleration",
    excerpt: "Architecting enterprise-grade browser video playback using HTTP Live Streaming chunk caching, MSE, and hardware acceleration.",
    category: "Video",
    tags: ["streaming", "hls", "web codecs", "video player"],
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-14",
    status: "published",
    readTime: "6 min read",
    views: 3200,
    metaTitle: "Advanced Video Streaming with WebCodecs | ProToolBox",
    metaDescription: "Master low-latency web video streaming using hardware accelerated browser decoders.",
    author: {
      name: "Sarah Chen",
      role: "Frontend Performance Lead",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Optimizing Video Chunks in Memory</h2><p>Hardware accelerated decoding provides butter-smooth 60fps playback...</p>",
  },
  {
    id: "post-12",
    slug: "video-processing-streamer-client-side",
    title: "How to Video Processing Streamer: Fast Client-Side Video Filtering",
    excerpt: "Apply real-time CSS filters, canvas post-processing, and aspect ratio transformations to HTML5 video streams with zero latency.",
    category: "Video",
    tags: ["video processing", "canvas", "streaming"],
    coverImage: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-11",
    status: "published",
    readTime: "4 min read",
    views: 1980,
    metaTitle: "Client-Side Video Processing Streamer | ProToolBox",
    metaDescription: "Manipulate video frames in real time using Canvas 2D and WebGL filters directly in the browser.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Real-Time Video Frame Filters</h2><p>Process video streams without sending raw video files to any backend...</p>",
  },
  {
    id: "post-13",
    slug: "terabox-video-player-prevesence-optimization",
    title: "TeraBox Video Player: Prevesence Contents Stream Optimization",
    excerpt: "How to eliminate buffer stutters and optimize packet chunk sizes when playing high-definition cloud video links.",
    category: "Video",
    tags: ["terabox", "optimization", "video player"],
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-08",
    status: "published",
    readTime: "5 min read",
    views: 2470,
    metaTitle: "TeraBox Video Player Stream Optimization | ProToolBox",
    metaDescription: "Stream optimization strategies to prevent lag and buffer interruptions on TeraBox shared video streams.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Optimizing Stream Packet Delivery</h2><p>Chunked fetch requests keep playback smooth even on 4G networks...</p>",
  },
  {
    id: "post-14",
    slug: "terabox-video-through-url-browser",
    title: "How to Play TeraBox Video Through URL in Browser Without Apps",
    excerpt: "Paste any TeraBox share URL and start streaming immediately in full high definition with custom playback speed controls.",
    category: "Video",
    tags: ["terabox", "url stream", "video player"],
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-05",
    status: "published",
    readTime: "4 min read",
    views: 3890,
    metaTitle: "Play TeraBox Video Through URL | ProToolBox",
    metaDescription: "Direct URL video stream player for TeraBox files. Fast, free, and secure in any modern web browser.",
    author: {
      name: "Sarah Chen",
      role: "Frontend Performance Lead",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Instant Direct Playback via URL</h2><p>No waiting, no app installer APKs, simply copy and play...</p>",
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
