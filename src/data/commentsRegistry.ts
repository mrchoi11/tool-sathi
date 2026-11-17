import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
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
  hidden?: boolean;        // When true, hidden from public post
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
      hidden: false,
      replies: [
        {
          id: 'c-seed-1-rep',
          postId: 'post-2',
          parentId: 'c-seed-1',
          authorName: 'Alex Rivera',
          authorEmail: '',
          content: 'Yes! It streams directly from the underlying cloud video CDN chunk, bypassing the app-download throttle. If the source file is 1080p, you get smooth 1080p playback.',
          createdAt: '2026-11-12T11:40:00.000Z',
          likes: 8,
          hidden: false
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
      hidden: false,
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
      hidden: false,
      replies: [
        {
          id: 'c-seed-3-rep',
          postId: 'post-1',
          parentId: 'c-seed-3',
          authorName: 'Sarah Chen',
          authorEmail: '',
          content: 'WebCodecs gives you frame-level control with zero memory copy to the GPU, cutting video decode latency by over 45% compared to classic MSE.',
          createdAt: '2026-11-10T15:05:00.000Z',
          likes: 6,
          hidden: false
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
 * Retrieve public comments for a blog post (merges Firestore with local storage cache, filters hidden comments)
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

      // Filter out hidden comments for public readers
      const visible = merged.filter((c) => !c.hidden);
      const tree = buildCommentTree(visible);
      // Also filter out any hidden replies inside visible parents
      tree.forEach((tl) => {
        if (tl.replies) {
          tl.replies = tl.replies.filter((r) => !r.hidden);
        }
      });
      return tree;
    }
  } catch (err) {
    console.warn('Firestore fetch for comments timed out or failed, using local/seed fallback:', err);
  }

  // Fallback to local comments or default seed comments
  if (localComments.length > 0) {
    const visible = localComments.filter((c) => !c.hidden);
    const tree = buildCommentTree(visible);
    tree.forEach((tl) => {
      if (tl.replies) {
        tl.replies = tl.replies.filter((r) => !r.hidden);
      }
    });
    return tree;
  }

  const seed = DEFAULT_COMMENTS_BY_POST[postId] || [];
  return seed.filter((c) => !c.hidden);
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
    hidden: false,
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

// ─────────────────────────────────────────────────────────────────────────────
// ─── ADMIN MASTER CMS COMMENT MANAGEMENT FUNCTIONS ───────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve ALL comments across all posts for the Admin CMS
 */
export async function getAllAdminComments(): Promise<BlogComment[]> {
  const commentsMap = new Map<string, BlogComment>();

  // 1. Add default seed comments as baseline
  Object.values(DEFAULT_COMMENTS_BY_POST).forEach((postSeeds) => {
    postSeeds.forEach((seed) => {
      commentsMap.set(seed.id, { ...seed, hidden: !!seed.hidden });
      if (seed.replies) {
        seed.replies.forEach((rep) => {
          commentsMap.set(rep.id, { ...rep, hidden: !!rep.hidden });
        });
      }
    });
  });

  // 2. Fetch all comments from Firestore
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    snap.docs.forEach((d) => {
      const data = d.data() as BlogComment;
      commentsMap.set(d.id, {
        id: d.id,
        postId: data.postId || 'post-1',
        parentId: data.parentId || null,
        authorName: data.authorName || 'Anonymous',
        authorEmail: data.authorEmail || '',
        content: data.content || '',
        createdAt: data.createdAt || new Date().toISOString(),
        likes: data.likes || 0,
        hidden: !!data.hidden
      });
    });
  } catch (err) {
    console.warn('Could not fetch all comments from Firestore for admin, reading local caches:', err);
  }

  // 3. Merge any comments in localStorage across all posts
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ptb_comments_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const list: BlogComment[] = JSON.parse(val);
            list.forEach((item) => {
              if (!commentsMap.has(item.id)) {
                commentsMap.set(item.id, { ...item, hidden: !!item.hidden });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error reading local comments for admin:', e);
    }
  }

  const allComments = Array.from(commentsMap.values());
  // Sort newest first
  allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return allComments;
}

/**
 * Admin: Toggle comment visibility (hide or unhide)
 */
export async function adminToggleCommentVisibility(commentId: string, currentHidden: boolean): Promise<boolean> {
  const nextHidden = !currentHidden;

  // 1. Update Firestore
  try {
    const commentRef = doc(db, COLLECTION, commentId);
    await setDoc(commentRef, { hidden: nextHidden }, { merge: true });
  } catch (err) {
    console.warn('Firestore toggle comment visibility warning:', err);
  }

  // 2. Update local storage caches
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ptb_comments_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const list: BlogComment[] = JSON.parse(val);
            let updated = false;
            list.forEach((c) => {
              if (c.id === commentId) {
                c.hidden = nextHidden;
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error syncing comment visibility in localStorage:', e);
    }
  }

  return nextHidden;
}

/**
 * Admin: Edit an existing comment (authorName, authorEmail, content, hidden)
 */
export async function adminUpdateComment(
  commentId: string,
  updates: {
    authorName?: string;
    authorEmail?: string;
    content?: string;
    hidden?: boolean;
  }
): Promise<void> {
  // 1. Update Firestore
  try {
    const commentRef = doc(db, COLLECTION, commentId);
    await setDoc(commentRef, updates, { merge: true });
  } catch (err) {
    console.warn('Firestore comment update warning:', err);
  }

  // 2. Update localStorage caches
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ptb_comments_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const list: BlogComment[] = JSON.parse(val);
            let updated = false;
            list.forEach((c) => {
              if (c.id === commentId) {
                if (updates.authorName !== undefined) c.authorName = updates.authorName;
                if (updates.authorEmail !== undefined) c.authorEmail = updates.authorEmail;
                if (updates.content !== undefined) c.content = updates.content;
                if (updates.hidden !== undefined) c.hidden = updates.hidden;
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error updating comment in localStorage:', e);
    }
  }
}

/**
 * Admin: Permanently delete a comment (and any child replies)
 */
export async function adminDeleteComment(commentId: string): Promise<void> {
  // 1. Delete from Firestore
  try {
    const commentRef = doc(db, COLLECTION, commentId);
    await deleteDoc(commentRef);

    // Also find and delete child replies
    const q = query(collection(db, COLLECTION), where('parentId', '==', commentId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Firestore comment delete warning:', err);
  }

  // 2. Delete from localStorage caches
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ptb_comments_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const list: BlogComment[] = JSON.parse(val);
            const filtered = list.filter((c) => c.id !== commentId && c.parentId !== commentId);
            if (filtered.length !== list.length) {
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error deleting comment in localStorage:', e);
    }
  }
}
