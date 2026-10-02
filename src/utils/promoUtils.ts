import { CartItem, Producto } from '../types/database';

// UUID de la categoría 'gorras legendaria 2.0' en Supabase
export const LEGENDARY_CAPS_CATEGORY_ID = '6e813d2c-2207-4416-bcd8-03af68652e5b';

/**
 * Determina si un producto pertenece a la categoría de "Gorras Legendarias".
 * Considera:
 * - El UUID oficial de la categoría en Supabase ('6e813d2c-2207-4416-bcd8-03af68652e5b')
 * - Nombre de categoría que contenga 'legendaria' o 'legendarias'
 * - Nombre de producto que contenga 'legendaria'
 */
export function isLegendaryCap(
  product?: { categoria_id?: string | null; nombre?: string; categoria?: { id?: string; nombre?: string } | null } | null,
  categoryNameFallback?: string
): boolean {
  if (!product) return false;

  // 1. Verificación por ID de categoría
  if (product.categoria_id === LEGENDARY_CAPS_CATEGORY_ID) return true;
  if (product.categoria?.id === LEGENDARY_CAPS_CATEGORY_ID) return true;

  // 2. Verificación por nombre de categoría (asociada o fallback)
  const catName = (product.categoria?.nombre || categoryNameFallback || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (catName.includes('legendaria') || catName.includes('legendarias')) {
    return true;
  }

  // 3. Verificación por nombre de producto
  const prodName = (product.nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (prodName.includes('legendaria') || prodName.includes('legendarias')) {
    return true;
  }

  return false;
}

export interface PromoCalculationResult {
  hasPromo: boolean;
  legendaryCapsCount: number;
  pairs: number;
  discount: number;
  promoTitle: string;
  promoDescription: string;
  nextPromoHint: string | null;
}

/**
 * Calcula la promoción de "2 Gorras Legendarias por $55 USD"
 * Cada 2 gorras (sean del mismo modelo o de modelos distintos) reciben un descuento de $5.00 USD,
 * logrando que 2 gorras de $30 ($60 en total) queden en exactamente $55 USD.
 */
export function calculateLegendaryCapsPromo(items: CartItem[] = []): PromoCalculationResult {
  let count = 0;

  for (const item of items) {
    if (isLegendaryCap(item.product, item.product?.categoria?.nombre)) {
      count += Number(item.quantity) || 0;
    }
  }

  const pairs = Math.floor(count / 2);
  const discount = pairs * 5.0; // $5 de descuento por cada par
  const hasPromo = pairs > 0;

  const remainder = count % 2;
  const nextPromoHint =
    remainder === 1
      ? '¡Agrega 1 gorra legendaria más para aprovechar la promo: 2 por solo $55 USD!'
      : null;

  const promoTitle = pairs === 1
    ? 'Promoción 2 Gorras Legendarias ($55)'
    : `Promoción ${pairs * 2} Gorras Legendarias (${pairs}x $55)`;

  const promoDescription = pairs === 1
    ? '¡Se aplicó el precio especial de $55 USD por 2 gorras legendarias!'
    : `¡Se aplicó el precio especial de $55 USD por cada 2 gorras legendarias (${pairs} pares)!`;

  return {
    hasPromo,
    legendaryCapsCount: count,
    pairs,
    discount,
    promoTitle,
    promoDescription,
    nextPromoHint,
  };
}
