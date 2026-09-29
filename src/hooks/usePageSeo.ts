import { useEffect } from 'react';

interface SeoConfig {
  title: string;
  description: string;
  canonicalPath: string; // e.g. '/terminos-y-condiciones'
  type?: string;
}

const BASE_DOMAIN = 'https://prettystore.store';

export function usePageSeo({ title, description, canonicalPath, type = 'website' }: SeoConfig) {
  useEffect(() => {
    // 1. Title
    const originalTitle = document.title;
    document.title = title;

    // 2. Meta description
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.content : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // 3. Canonical Link
    const fullCanonicalUrl = `${BASE_DOMAIN}${canonicalPath}`;
    let linkCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const createdCanonical = !linkCanonical;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    const originalCanonical = linkCanonical.href;
    linkCanonical.href = fullCanonicalUrl;

    // 4. OpenGraph tags
    const setOgMeta = (property: string, content: string): (() => void) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      const created = !tag;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      const prev = tag.content;
      tag.content = content;
      return () => {
        if (created) {
          tag?.remove();
        } else if (tag) {
          tag.content = prev;
        }
      };
    };

    const restoreOgTitle = setOgMeta('og:title', title);
    const restoreOgDesc = setOgMeta('og:description', description);
    const restoreOgUrl = setOgMeta('og:url', fullCanonicalUrl);
    const restoreOgType = setOgMeta('og:type', type);

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.content = originalDesc;
      if (createdCanonical && linkCanonical) {
        linkCanonical.remove();
      } else if (linkCanonical) {
        linkCanonical.href = originalCanonical || `${BASE_DOMAIN}/`;
      }
      restoreOgTitle();
      restoreOgDesc();
      restoreOgUrl();
      restoreOgType();
    };
  }, [title, description, canonicalPath, type]);
}
