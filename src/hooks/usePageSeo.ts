import { useEffect } from 'react';
import { applyDocumentSeo, getSeoForPage, getCanonicalUrlForPath } from '../data/seoRegistry';

export function usePageSeo(
  pageId: string,
  defaultTitle: string,
  defaultDescription: string,
  defaultKeywords?: string,
  customCanonical?: string
) {
  useEffect(() => {
    // 1. Immediately apply default SEO & Canonical URL
    const canonical = customCanonical || (typeof window !== 'undefined' ? getCanonicalUrlForPath(window.location.pathname) : undefined);
    applyDocumentSeo(defaultTitle, defaultDescription, defaultKeywords, canonical);

    // 2. Asynchronously check for Admin overrides from Firestore / Cache
    let isMounted = true;
    getSeoForPage(pageId).then((custom) => {
      if (isMounted && custom) {
        applyDocumentSeo(
          custom.title || defaultTitle,
          custom.description || defaultDescription,
          custom.keywords || defaultKeywords,
          custom.canonicalUrl || canonical
        );
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pageId, defaultTitle, defaultDescription, defaultKeywords, customCanonical]);
}

