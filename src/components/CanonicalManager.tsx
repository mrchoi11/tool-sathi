import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setCanonicalUrl, getCanonicalUrlForPath } from '../data/seoRegistry';

/**
 * Automatically synchronizes <link rel="canonical">, <meta property="og:url">,
 * and <meta property="twitter:url"> with the current route URL across all pages.
 */
export default function CanonicalManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Individual blog posts manage their own custom canonicals via BlogPostPage
    const isSingleBlogPost = pathname.startsWith('/blog/') && pathname.length > 6;
    if (!isSingleBlogPost) {
      const canonical = getCanonicalUrlForPath(pathname);
      setCanonicalUrl(canonical);
    }
  }, [pathname]);

  return null;
}
