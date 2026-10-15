import { Producto } from '../types/database';

/**
 * Returns all real image and video URLs for a product.
 * Handles single URLs, arrays, stringified JSON arrays like '["https://..."]',
 * and stripped quotes. Returns an empty array if no real images exist.
 */
export function getProductImages(
  product?: Partial<Producto> | { imagen_url?: string | null; imagenes?: any } | null
): string[] {
  if (!product) return [];
  const list: string[] = [];

  const addUrl = (u: any) => {
    if (!u) return;
    if (typeof u === 'string') {
      let trimmed = u.trim();
      if (!trimmed) return;

      // Handle stringified JSON array in database (e.g. '["https://..."]')
      if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('"[') && trimmed.endsWith(']"'))
      ) {
        try {
          if (trimmed.startsWith('"[') && trimmed.endsWith(']"')) {
            trimmed = JSON.parse(trimmed);
          }
          const parsed = typeof trimmed === 'string' ? JSON.parse(trimmed) : trimmed;
          if (Array.isArray(parsed)) {
            parsed.forEach(addUrl);
            return;
          }
        } catch {
          // If JSON parse fails, attempt regex extraction of URLs
          const matches = trimmed.match(/https?:\/\/[^\s"',\]]+/g);
          if (matches && matches.length > 0) {
            matches.forEach(addUrl);
            return;
          }
        }
      }

      // Remove surrounding quotes or backslashes
      const clean = trimmed
        .replace(/^["'\\]+|["'\\]+$/g, '')
        .replace(/\\"/g, '"')
        .trim();

      if (clean && !list.includes(clean)) {
        list.push(clean);
      }
    } else if (Array.isArray(u)) {
      u.forEach(addUrl);
    }
  };

  addUrl(product.imagen_url);
  addUrl(product.imagenes);

  return list;
}

/**
 * Returns the primary (first) image URL for a product, or a fallback.
 */
export function getPrimaryProductImage(
  product?: any,
  fallback: string = '/images/logo/logotipo-thumb.webp'
): string {
  if (!product) return fallback;
  const imgs = getProductImages(product);
  return imgs.length > 0 ? imgs[0] : fallback;
}

/**
 * Checks whether the product has at least one real image assigned.
 */
export function hasProductRealImage(product?: any): boolean {
  return getProductImages(product).length > 0;
}

export function isVideoUrl(url?: string | null): boolean {
  return isVideoMedia(url);
}

export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com')
  );
}

export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('watch?v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  return null;
}
