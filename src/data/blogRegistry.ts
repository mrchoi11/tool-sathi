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
    return posts.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
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
    slug: "how-to-play-terabox-videos-online-without-app",
    title: "How to Play TeraBox Videos Online Directly in Your Browser (No App Required)",
    excerpt: "Frustrated by forced app downloads and slow streaming? Learn the best ways to play and stream TeraBox shared video links online smoothly on mobile and PC.",
    category: "Video",
    tags: ["terabox", "video player", "streaming", "cloud video"],
    coverImage: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-15",
    status: "published",
    readTime: "4 min read",
    views: 1420,
    metaTitle: "Play TeraBox Videos Online Free – No App Needed | ToolSathi",
    metaDescription: "Stream any TeraBox shared video link directly in your browser. No app download required. Works on mobile & PC.",
    author: {
      name: "Alex Rivera",
      role: "Streaming Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
    content: "<h2>Why TeraBox Forces App Downloads</h2><p>TeraBox has become one of the most widely used cloud storage platforms...</p>",
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
