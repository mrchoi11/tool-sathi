import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc,
  query, where, orderBy, Timestamp, writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

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
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy("publishedAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("slug", "==", slug))
  );
  if (snap.empty) return undefined;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as BlogPost;
}

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function savePost(post: BlogPost): Promise<void> {
  const { id, ...data } = post;
  await setDoc(doc(db, COLLECTION, id), data, { merge: true });
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// ─── IMAGE UPLOAD (100% Free - Auto Canvas Compression & Base64 Fallback) ──────

export async function uploadCoverImage(file: File, postId: string): Promise<string> {
  // First, convert to compressed base64 (works 100% free without Firebase Storage / Blaze plan)
  const compressToBase64 = (imgFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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
          // High quality compressed webp/jpeg (~40KB - 80KB)
          const dataUrl = canvas.toDataURL("image/webp", 0.82);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imgFile);
    });
  };

  try {
    const ext = file.name.split(".").pop();
    const storageRef = ref(storage, `blog-covers/${postId}.${ext}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn("Firebase Storage unavailable or requires Blaze plan, using free base64 fallback:", err);
    return await compressToBase64(file);
  }
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
