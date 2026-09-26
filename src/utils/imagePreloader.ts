/**
 * Utility to preload high-priority images into browser memory cache
 * so they render instantaneously without network delay.
 */

const HIGH_PRIORITY_IMAGES: string[] = [];

const ALL_PRODUCT_IMAGES: string[] = [];

const preloadedSet = new Set<string>();

export function preloadImage(url: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  if (preloadedSet.has(url)) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    // @ts-ignore
    if (priority === 'high' && 'fetchPriority' in img) {
      // @ts-ignore
      img.fetchPriority = 'high';
    }
    img.decoding = 'async';
    img.onload = () => {
      preloadedSet.add(url);
      resolve();
    };
    img.onerror = () => {
      preloadedSet.add(url);
      resolve();
    };
    img.src = url;
  });
}

export function preloadCatalogImages() {
  if (typeof window === 'undefined') return;

  // 1. Immediately preload Gorras with highest priority
  HIGH_PRIORITY_IMAGES.forEach((url) => {
    preloadImage(url, 'high');
  });

  // 2. Preload remaining store images shortly after idle/render
  const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
  idleCallback(() => {
    ALL_PRODUCT_IMAGES.forEach((url) => {
      if (!preloadedSet.has(url)) {
        preloadImage(url, 'low');
      }
    });
  });
}
