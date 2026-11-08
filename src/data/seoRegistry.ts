import { doc, getDoc, getDocs, setDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { tools, categories } from './toolRegistry';

export interface SeoMetadataEntry {
  id: string;              // e.g. 'home', 'tools', 'tool-video-player', 'cat-video'
  path: string;            // e.g. '/', '/tools', '/tools/video-player'
  name: string;            // Human readable name
  type: 'core' | 'category' | 'tool' | 'blog';
  title: string;           // Meta Title
  description: string;     // Meta Description
  keywords?: string;       // Keywords
  updatedAt?: string;      // Last update ISO date
}

const COLLECTION = 'seo_metadata';
const CACHE_KEY_PREFIX = 'protoolbox_seo_';

// Default static pages
const CORE_PAGES: SeoMetadataEntry[] = [
  {
    id: 'page-home',
    path: '/',
    name: 'Home Page',
    type: 'core',
    title: 'ProToolBox — Free Online Tools for Video, PDF, Image & More',
    description: '75+ free browser-based online tools: play videos, merge PDFs, compress images, generate QR codes, convert formats, and more. Fast, private, no file uploads needed.',
    keywords: 'online tools, video player, pdf tools, image compressor, file converter'
  },
  {
    id: 'page-tools',
    path: '/tools',
    name: 'All Tools Directory',
    type: 'core',
    title: 'All Free Online Tools — Video, PDF, Image & Utilities | ProToolBox',
    description: 'Browse all 75+ free online utilities. Fast, privacy-friendly, zero sign-up required.',
    keywords: 'free web tools, online utilities, browser tools'
  },
  {
    id: 'page-blog',
    path: '/blog',
    name: 'Blog Index',
    type: 'core',
    title: 'ProToolBox Insights, Guides & Tutorials | ProToolBox',
    description: 'Read the latest guides, tutorials, and tips on video streaming, PDF editing, image optimization, and web productivity.',
    keywords: 'tech blog, video tutorials, productivity guides'
  },
  {
    id: 'page-about',
    path: '/about',
    name: 'About Us',
    type: 'core',
    title: 'About ProToolBox — Fast, Private Web Utilities',
    description: 'Learn about ProToolBox: our mission to provide high-speed, client-side online tools with zero file upload privacy.',
    keywords: 'about protoolbox, privacy tools'
  },
  {
    id: 'page-contact',
    path: '/contact',
    name: 'Contact Page',
    type: 'core',
    title: 'Contact Us — ProToolBox Support & Feedback',
    description: 'Have questions, feedback, or tool requests? Contact the ProToolBox engineering and support team.',
    keywords: 'contact support, protoolbox feedback'
  },
  {
    id: 'page-privacy',
    path: '/privacy',
    name: 'Privacy Policy',
    type: 'core',
    title: 'Privacy Policy — ProToolBox Zero-Upload Security',
    description: 'Our privacy policy details how files are processed locally in your browser without cloud storage retention.',
    keywords: 'privacy policy, zero upload privacy'
  },
  {
    id: 'page-terms',
    path: '/terms',
    name: 'Terms of Service',
    type: 'core',
    title: 'Terms of Service — ProToolBox',
    description: 'Review the terms and conditions for using ProToolBox browser tools and utilities.',
    keywords: 'terms of service, user agreement'
  },
  {
    id: 'page-sitemap',
    path: '/sitemap',
    name: 'HTML Sitemap Page',
    type: 'core',
    title: 'Sitemap — Directory of Tools & Pages | ProToolBox',
    description: 'Complete directory and index of all pages, categories, and browser tools on ProToolBox.',
    keywords: 'sitemap, all tools directory'
  }
];

// Helper to build all default entries
export function getDefaultSeoEntries(): SeoMetadataEntry[] {
  const entries: SeoMetadataEntry[] = [...CORE_PAGES];

  // Add Categories
  for (const cat of categories) {
    entries.push({
      id: `cat-${cat.id}`,
      path: `/category/${cat.id}`,
      name: `${cat.name} Category`,
      type: 'category',
      title: `${cat.name} — Free Online Utilities | ProToolBox`,
      description: `${cat.description}. Free, fast, in-browser processing with zero file uploads.`,
      keywords: `${cat.name}, free ${cat.id} tools, online utilities`
    });
  }

  // Add Tools
  for (const t of tools) {
    entries.push({
      id: `tool-${t.slug}`,
      path: `/tools/${t.slug}`,
      name: t.name,
      type: 'tool',
      title: t.seo?.title || `${t.name} | ProToolBox`,
      description: t.seo?.description || t.description,
      keywords: t.keywords ? t.keywords.join(', ') : 'online tool, free utility'
    });
  }

  return entries;
}

// Fetch all SEO entries (Defaults merged with Firestore overrides)
export async function getAllSeoEntries(): Promise<SeoMetadataEntry[]> {
  const defaults = getDefaultSeoEntries();
  const overridesMap: Record<string, Partial<SeoMetadataEntry>> = {};

  try {
    const snap = await getDocs(collection(db, COLLECTION));
    snap.forEach((d) => {
      overridesMap[d.id] = d.data() as Partial<SeoMetadataEntry>;
    });
  } catch (err) {
    console.warn('Could not fetch Firestore SEO overrides, using defaults:', err);
  }

  return defaults.map((item) => {
    const override = overridesMap[item.id];
    if (override) {
      return {
        ...item,
        title: override.title || item.title,
        description: override.description || item.description,
        keywords: override.keywords !== undefined ? override.keywords : item.keywords,
        updatedAt: override.updatedAt || item.updatedAt
      };
    }
    return item;
  });
}

// Save or Update a single Page SEO entry
export async function saveSeoEntry(entry: SeoMetadataEntry): Promise<void> {
  const payload = {
    id: entry.id,
    path: entry.path,
    name: entry.name,
    type: entry.type,
    title: entry.title.trim(),
    description: entry.description.trim(),
    keywords: (entry.keywords || '').trim(),
    updatedAt: new Date().toISOString()
  };

  // 1. Update localStorage cache for instant local hydration
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + entry.id, JSON.stringify(payload));
  } catch {}

  // 2. Persist to Firestore
  await setDoc(doc(db, COLLECTION, entry.id), payload, { merge: true });
}

// Get SEO for specific page ID (with local cache check first)
export async function getSeoForPage(pageId: string): Promise<SeoMetadataEntry | null> {
  // Check localStorage first
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + pageId);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Check Firestore
  try {
    const snap = await getDoc(doc(db, COLLECTION, pageId));
    if (snap.exists()) {
      const data = snap.data() as SeoMetadataEntry;
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + pageId, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch {}

  return null;
}

// Apply Meta Tags to Document Head in Real Time (Title, Description, OG, Twitter)
export function applyDocumentSeo(title: string, description: string, keywords?: string) {
  if (title) {
    document.title = title;
    setMetaTag('name', 'title', title);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'twitter:title', title);
  }
  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'twitter:description', description);
  }
  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

