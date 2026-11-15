import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface BlogComment {
  id: string;
  postId: string;
  parentId?: string | null; // null if top-level, commentId if reply
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;       // ISO 8601 string
  likes: number;
  replies?: BlogComment[];
}

const COLLECTION = 'blog_comments';

// ─── INITIAL SEED COMMENTS (Shown when a post has no comments in Firestore) ──
const DEFAULT_COMMENTS_BY_POST: Record<string, BlogComment[]> = {
  'post-2': [
    {
      id: 'c-seed-1',
      postId: 'post-2',
      parentId: null,
      authorName: 'Rohan Sharma',
      authorEmail: '',
      content: 'Does this direct browser streaming method support 1080p and 4K resolution without the TeraBox speed limit?',
      createdAt: '2026-11-12T10:15:00.000Z',
      likes: 14,
      replies: [
        {
          id: 'c-seed-1-rep',
          postId: 'post-2',
          parentId: 'c-seed-1',
          authorName: 'Alex Rivera',
          authorEmail: '',
          content: 'Yes! It streams directly from the underlying cloud video CDN chunk, bypassing the app-download throttle. If the source file is 1080p, you get smooth 1080p playback.',
          createdAt: '2026-11-12T11:40:00.000Z',
          likes: 8
        }
      ]
    },
    {
      id: 'c-seed-2',
      postId: 'post-2',
      parentId: null,
      authorName: 'Priya Patel',
      authorEmail: '',
      content: 'Tested this on iPhone Safari and iPad Chrome. Works like a charm without installing any APK or app. Great tutorial!',
      createdAt: '2026-11-13T16:22:00.000Z',
      likes: 9,
      replies: []
    }
  ],
  'post-1': [
    {
      id: 'c-seed-3',
      postId: 'post-1',
      parentId: null,
      authorName: 'Devansh Verma',
      authorEmail: '',
      content: 'The WebCodecs pipeline section was super clear. How does this compare to MSE (Media Source Extensions) for adaptive HLS streaming?',
      createdAt: '2026-11-10T14:30:00.000Z',
      likes: 11,
      replies: [
        {
          id: 'c-seed-3-rep',
          postId: 'post-1',
          parentId: 'c-seed-3',
          authorName: 'Sarah Chen',
          authorEmail: '',
          content: 'WebCodecs gives you frame-level control with zero memory copy to the GPU, cutting video decode latency by over 45% compared to classic MSE.',
          createdAt: '2026-11-10T15:05:00.000Z',
          likes: 6
        }
      ]
    }
  ]
};

/**
 * Format relative timestamp (e.g. "Just now", "2 hours ago", "Nov 15, 2026")
 */
export function formatCommentDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Organizes a flat list of comments into a hierarchical tree (top-level + replies)
 */
export function buildCommentTree(flatComments: BlogComment[]): BlogComment[] {
  const commentMap = new Map<string, BlogComment>();
  const topLevel: BlogComment[] = [];

  // Deep clone to avoid mutating raw data
  flatComments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  flatComments.forEach((c) => {
    const current = commentMap.get(c.id);
    if (!current) return;

    if (c.parentId && commentMap.has(c.parentId)) {
      const parent = commentMap.get(c.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(current);
      }
    } else {
      topLevel.push(current);
    }
  });

  // Sort top-level by newest first
  topLevel.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Sort replies within each comment by oldest first (chronological conversation)
  topLevel.forEach((tl) => {
    if (tl.replies && tl.replies.length > 0) {
      tl.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  });

  return topLevel;
}

/**
 * Retrieve comments for a blog post (merges Firestore with local storage cache)
 */
export async function getCommentsByPostId(postId: string): Promise<BlogComment[]> {
  const localKey = `ptb_comments_${postId}`;
  let localComments: BlogComment[] = [];

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        localComments = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to parse cached comments:', e);
    }
  }

  try {
    const q = query(collection(db, COLLECTION), where('postId', '==', postId));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 3500)
    );
    const snap = await Promise.race([getDocs(q), timeoutPromise]);

    if (!snap.empty) {
      const firestoreComments = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as BlogComment[];

      // Merge firestore and local comments (avoiding duplicates by id)
      const combinedMap = new Map<string, BlogComment>();
      firestoreComments.forEach((c) => combinedMap.set(c.id, c));
      localComments.forEach((c) => {
        if (!combinedMap.has(c.id)) {
          combinedMap.set(c.id, c);
        }
      });

      const merged = Array.from(combinedMap.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(merged));
      }
      return buildCommentTree(merged);
    }
  } catch (err) {
    console.warn('Firestore fetch for comments timed out or failed, using local/seed fallback:', err);
  }

  // Fallback to local comments or default seed comments
  if (localComments.length > 0) {
    return buildCommentTree(localComments);
  }

  const seed = DEFAULT_COMMENTS_BY_POST[postId] || [];
  return seed;
}

/**
 * Add a new comment or reply to a blog post
 */
export async function addComment(
  postId: string,
  data: {
    authorName: string;
    authorEmail?: string;
    content: string;
    parentId?: string | null;
  }
): Promise<BlogComment> {
  const trimmedName = data.authorName.trim();
  const trimmedContent = data.content.trim();
  const trimmedEmail = data.authorEmail?.trim() || '';

  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Please enter a valid name (at least 2 characters).');
  }
  if (!trimmedContent || trimmedContent.length < 3) {
    throw new Error('Please enter a comment (at least 3 characters).');
  }

  const commentId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newComment: BlogComment = {
    id: commentId,
    postId,
    parentId: data.parentId || null,
    authorName: trimmedName,
    authorEmail: trimmedEmail,
    content: trimmedContent,
    createdAt: new Date().toISOString(),
    likes: 0,
    replies: []
  };

  // 1. Immediately cache in localStorage for instant offline/optimistic availability
  const localKey = `ptb_comments_${postId}`;
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(localKey);
      const list: BlogComment[] = existing ? JSON.parse(existing) : [];
      list.push(newComment);
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save comment to localStorage:', e);
    }
  }

  // 2. Persist to Firestore in background / async
  try {
    const commentRef = doc(db, COLLECTION, commentId);
    const { replies, ...cleanData } = newComment;
    await setDoc(commentRef, cleanData);
  } catch (err) {
    console.warn('Firestore write warning (persisted locally):', err);
  }

  return newComment;
}

/**
 * Toggle like for a specific comment
 */
export async function toggleCommentLike(
  postId: string,
  commentId: string,
  willLike: boolean
): Promise<number> {
  const localKey = `ptb_comments_${postId}`;
  let newLikes = 0;

  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(localKey);
      if (existing) {
        const list: BlogComment[] = JSON.parse(existing);
        const item = list.find((c) => c.id === commentId);
        if (item) {
          item.likes = Math.max(0, (item.likes || 0) + (willLike ? 1 : -1));
          newLikes = item.likes;
          localStorage.setItem(localKey, JSON.stringify(list));
        }
      }
    } catch (e) {
      console.warn('Error updating comment like in localStorage:', e);
    }
  }

  // Try updating Firestore
  try {
    const commentRef = doc(db, COLLECTION, commentId);
    await setDoc(commentRef, { likes: increment(willLike ? 1 : -1) }, { merge: true });
  } catch (err) {
    console.warn('Firestore comment like update warning:', err);
  }

  return newLikes;
}

