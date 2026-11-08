import { useEffect } from 'react';
import { applyDocumentSeo, getSeoForPage } from '../data/seoRegistry';

export function usePageSeo(
  pageId: string,
  defaultTitle: string,
  defaultDescription: string,
  defaultKeywords?: string
) {
  useEffect(() => {
    // 1. Immediately apply default SEO
    applyDocumentSeo(defaultTitle, defaultDescription, defaultKeywords);

    // 2. Asynchronously check for Admin overrides from Firestore / Cache
    let isMounted = true;
    getSeoForPage(pageId).then((custom) => {
      if (isMounted && custom) {
        applyDocumentSeo(
          custom.title || defaultTitle,
          custom.description || defaultDescription,
          custom.keywords || defaultKeywords
        );
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pageId, defaultTitle, defaultDescription, defaultKeywords]);
}

