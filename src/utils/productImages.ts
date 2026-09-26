import { Producto } from '../types/database';

/**
 * Checks whether a given media URL is a video file or video stream.
 * Supports direct files (.mp4, .webm, .mov, .m4v, .ogv, .ogg), data:video, and video host links.
 */
export function isVideoMedia(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase().split('?')[0];

  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.endsWith('.ogv') ||
    clean.endsWith('.ogg') ||
    clean.startsWith('data:video/') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com')
  );
}

/**
 * Returns embed URL for YouTube/Vimeo if applicable, or null if direct video file.
 */
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playsinline=1`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playsinline=1`;
  }
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1`;
  }
  return null;
}

export interface MediaItem {
  url: string;
  isVideo: boolean;
}

/**
 * Extracts all valid media items (photos and videos) from a product.
 */
export function getProductMedia(product?: Producto | null): MediaItem[] {
  const urls = getProductImages(product);
  return urls.map((url) => ({
    url,
    isVideo: isVideoMedia(url),
  }));
}

/**
 * Extracts all valid media URLs (images and videos) from a product.
 * Handles single image_url, JSON arrays in image_url, and separated strings.
 */
export function getProductImages(product?: Producto | null): string[] {
  if (!product) return [];

  // 1. Direct imagenes array
  if (Array.isArray(product.imagenes) && product.imagenes.length > 0) {
    const valid = product.imagenes.filter((url) => typeof url === 'string' && url.trim().length > 0);
    if (valid.length > 0) return valid;
  }

  // 2. Parse from imagen_url if present
  if (product.imagen_url && typeof product.imagen_url === 'string') {
    const trimmed = product.imagen_url.trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((url) => typeof url === 'string' && url.trim().length > 0);
          if (valid.length > 0) return valid;
        }
      } catch {
        // Not valid JSON
      }
    }

    if (trimmed.includes('|||')) {
      const split = trimmed.split('|||').map((s) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }

    if (trimmed.length > 0) {
      return [trimmed];
    }
  }

  return [];
}
