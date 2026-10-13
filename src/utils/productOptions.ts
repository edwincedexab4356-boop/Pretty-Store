import { ProductoOpcion } from '../types/database';

const OPTIONS_TAG_REGEX = /<!--PRETTY_OPTIONS:(.*?)-->/s;

/**
 * Codifica las opciones del producto dentro del campo descripción
 * usando un comentario HTML estandarizado para no alterar el esquema de BD.
 */
export function encodeProductOptions(
  description: string | null | undefined,
  opciones?: ProductoOpcion[]
): string | null {
  const baseDesc = (description || '').replace(OPTIONS_TAG_REGEX, '').trim();

  if (!opciones || opciones.length === 0) {
    return baseDesc || null;
  }

  // Filtrar opciones válidas con nombre
  const validOptions: ProductoOpcion[] = opciones
    .filter((opt) => opt && opt.nombre && opt.nombre.trim().length > 0)
    .map((opt, idx) => ({
      id: opt.id || `opt_${idx + 1}_${Date.now()}`,
      nombre: opt.nombre.trim(),
      precio:
        typeof opt.precio === 'number' && !isNaN(opt.precio) && opt.precio >= 0
          ? opt.precio
          : undefined,
      stock: typeof opt.stock === 'number' ? opt.stock : undefined,
    }));

  if (validOptions.length === 0) {
    return baseDesc || null;
  }

  const encodedTag = `<!--PRETTY_OPTIONS:${JSON.stringify(validOptions)}-->`;
  return baseDesc ? `${baseDesc}\n\n${encodedTag}` : encodedTag;
}

/**
 * Decodifica las opciones y devuelve la descripción limpia y la lista de opciones.
 */
export function decodeProductOptions(
  rawDescription: string | null | undefined,
  productId?: string
): { cleanDescription: string | null; opciones: ProductoOpcion[] } {
  let cleanDescription = rawDescription || null;
  let opciones: ProductoOpcion[] = [];

  if (rawDescription) {
    const match = rawDescription.match(OPTIONS_TAG_REGEX);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          opciones = parsed;
        }
      } catch (e) {
        console.warn('Error parsing product options tag:', e);
      }
      cleanDescription = rawDescription.replace(OPTIONS_TAG_REGEX, '').trim() || null;
    }
  }

  // Respaldo en localStorage si no viene en el texto
  if (opciones.length === 0 && productId && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`pretty_options_${productId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          opciones = parsed;
        }
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }

  return { cleanDescription, opciones };
}

/**
 * Guarda las opciones en localStorage para sincronización instantánea
 */
export function saveLocalProductOptions(productId: string, opciones?: ProductoOpcion[]) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    if (opciones && opciones.length > 0) {
      localStorage.setItem(`pretty_options_${productId}`, JSON.stringify(opciones));
    } else {
      localStorage.removeItem(`pretty_options_${productId}`);
    }
  } catch {
    // Ignorar errores
  }
}
