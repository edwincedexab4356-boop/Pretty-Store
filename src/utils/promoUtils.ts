import { CartItem, Producto } from '../types/database';

export const LEGENDARY_CAPS_CATEGORY_ID = '6e813d2c-2207-4416-bcd8-03af68652e5b';
export const BELICAS_BEISBOLERAS_CATEGORY_ID = 'd8092f51-94ea-4aa0-998a-fb781b2d4858';
export const BELICAS_CATEGORY_ID = 'b9ce5b2b-ccba-4ad1-b92e-487e25a0a523';
export const PERFUMES_CHICAS_CATEGORY_ID = 'beaa3edb-ec7f-40f8-8c17-03ec98219e9c';

export interface PromoRule {
  key: string;
  categoryIds?: string[];
  matchNames: string[];
  excludeNames?: string[];
  displayName: string;
  unitPrice: number;
  pairPrice: number;
  pairDiscount: number;
  badgeText: string;
  shortBadge: string;
}

export const PROMO_RULES: PromoRule[] = [
  {
    key: 'legendarias',
    categoryIds: [LEGENDARY_CAPS_CATEGORY_ID],
    matchNames: ['gorras legendaria 2.0', 'legendaria 2.0', 'legendaria', 'legendarias'],
    displayName: 'Gorras Legendarias 2.0',
    unitPrice: 30,
    pairPrice: 55,
    pairDiscount: 5.0,
    badgeText: '1 por $30 | 2 por $55',
    shortBadge: '2 por $55',
  },
  {
    key: 'belicas_beisboleras',
    categoryIds: [BELICAS_BEISBOLERAS_CATEGORY_ID],
    matchNames: ['gorras belicas beisboleras', 'belicas beisboleras', 'belica beisbolera', 'beisboleras'],
    displayName: 'Gorras Bélicas Beisboleras',
    unitPrice: 25,
    pairPrice: 40,
    pairDiscount: 10.0,
    badgeText: '1 por $25 | 2 por $40',
    shortBadge: '2 por $40',
  },
  {
    key: 'belicas',
    categoryIds: [BELICAS_CATEGORY_ID],
    matchNames: ['gorras belicas', 'gorra belica', 'belicas', 'belica'],
    excludeNames: ['beisboleras', 'beisbolera'],
    displayName: 'Gorras Bélicas',
    unitPrice: 25,
    pairPrice: 40,
    pairDiscount: 10.0,
    badgeText: '1 por $25 | 2 por $40',
    shortBadge: '2 por $40',
  },
  {
    key: 'perfumes_chicas',
    categoryIds: [PERFUMES_CHICAS_CATEGORY_ID],
    matchNames: ['perfumes virales para chicas', 'perfumes virales chicas', 'virales para chicas'],
    displayName: 'Perfumes Virales para Chicas',
    unitPrice: 4,
    pairPrice: 7,
    pairDiscount: 1.0,
    badgeText: '1 por $4 | 2 por $7',
    shortBadge: '2 por $7',
  },
  {
    key: 'pastelitos_pequenos',
    matchNames: ['pastelitos pequenos', 'pastelitos pequeno', 'pastelito pequeno', 'pastelitos mini', 'pastelito mini'],
    displayName: 'Pastelitos Pequeños',
    unitPrice: 10,
    pairPrice: 18,
    pairDiscount: 2.0,
    badgeText: '1 por $10 | 2 por $18',
    shortBadge: '2 por $18',
  },
  {
    key: 'pastelitos_grandes',
    matchNames: ['pastelitos grandes', 'pastelitos grande', 'pastelito grande'],
    displayName: 'Pastelitos Grandes',
    unitPrice: 10,
    pairPrice: 18,
    pairDiscount: 2.0,
    badgeText: '1 por $10 | 2 por $18',
    shortBadge: '2 por $18',
  },
  {
    key: 'otros_perfumes_virales',
    matchNames: ['otros perfumes virales', 'otro perfume viral', 'otros perfumes'],
    excludeNames: ['para chicas', 'chicas', 'mujer'],
    displayName: 'Otros Perfumes Virales',
    unitPrice: 5,
    pairPrice: 8,
    pairDiscount: 2.0,
    badgeText: '1 por $5 | 2 por $8',
    shortBadge: '2 por $8',
  },
];

function normalize(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getProductPromo(
  product?: { categoria_id?: string | null; nombre?: string; categoria?: { id?: string; nombre?: string } | null } | null,
  categoryNameFallback?: string
): PromoRule | null {
  if (!product) return null;

  const catId = product.categoria_id || product.categoria?.id || '';
  const catName = normalize(product.categoria?.nombre || categoryNameFallback || '');
  const prodName = normalize(product.nombre || '');
  const combined = `${catName} ${prodName}`;

  for (const rule of PROMO_RULES) {
    if (catId && rule.categoryIds && rule.categoryIds.includes(catId)) {
      return rule;
    }

    if (rule.excludeNames && rule.excludeNames.some((ex) => combined.includes(ex))) {
      continue;
    }

    for (const match of rule.matchNames) {
      if (catName.includes(match) || prodName.includes(match)) {
        return rule;
      }
    }
  }

  return null;
}

export function isLegendaryCap(
  product?: { categoria_id?: string | null; nombre?: string; categoria?: { id?: string; nombre?: string } | null } | null,
  categoryNameFallback?: string
): boolean {
  const promo = getProductPromo(product, categoryNameFallback);
  return promo?.key === 'legendarias';
}

export interface PromoCategoryBreakdown {
  rule: PromoRule;
  count: number;
  pairs: number;
  discount: number;
  promoTitle: string;
  promoDescription: string;
  nextPromoHint: string | null;
}

export interface PromoCalculationResult {
  hasPromo: boolean;
  totalDiscount: number;
  discount: number;
  promoTitle: string;
  promoDescription: string;
  breakdown: PromoCategoryBreakdown[];
  nextPromoHints: string[];
  nextPromoHint: string | null;
  legendaryCapsCount: number;
  pairs: number;
}

export function calculateLegendaryCapsPromo(items: CartItem[] = []): PromoCalculationResult {
  return calculatePromotions(items);
}

export function calculatePromotions(items: CartItem[] = []): PromoCalculationResult {
  const countsByRuleKey: Record<string, number> = {};

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;

    const promo = getProductPromo(item.product, item.product?.categoria?.nombre);
    if (promo) {
      countsByRuleKey[promo.key] = (countsByRuleKey[promo.key] || 0) + qty;
    }
  }

  const breakdown: PromoCategoryBreakdown[] = [];
  const nextPromoHints: string[] = [];
  let totalDiscount = 0;
  let totalPairs = 0;

  for (const rule of PROMO_RULES) {
    const count = countsByRuleKey[rule.key] || 0;
    if (count <= 0) continue;

    const pairs = Math.floor(count / 2);
    const remainder = count % 2;
    const discount = pairs * rule.pairDiscount;

    let nextPromoHint: string | null = null;
    if (remainder === 1) {
      nextPromoHint = `¡Agrega 1 artículo más de ${rule.displayName} para activar la promo: ${rule.badgeText}!`;
      nextPromoHints.push(nextPromoHint);
    }

    if (pairs > 0) {
      totalDiscount += discount;
      totalPairs += pairs;

      const promoTitle = pairs === 1
        ? `Promo ${rule.displayName} (${rule.shortBadge})`
        : `Promo ${pairs}x (${rule.shortBadge}) en ${rule.displayName}`;

      const promoDescription = `¡Se aplicó el descuento especial de -$${discount.toFixed(2)} USD en ${rule.displayName}!`;

      breakdown.push({
        rule,
        count,
        pairs,
        discount,
        promoTitle,
        promoDescription,
        nextPromoHint,
      });
    }
  }

  const hasPromo = totalDiscount > 0;
  const legendaryCapsCount = countsByRuleKey['legendarias'] || 0;

  let promoTitle = '';
  let promoDescription = '';

  if (breakdown.length === 1) {
    promoTitle = breakdown[0].promoTitle;
    promoDescription = breakdown[0].promoDescription;
  } else if (breakdown.length > 1) {
    promoTitle = `Promociones Múltiples Aplicadas (${breakdown.length} colecciones)`;
    promoDescription = `¡Ahorro total de $${totalDiscount.toFixed(2)} USD en tus colecciones con descuento!`;
  }

  return {
    hasPromo,
    totalDiscount: Number(totalDiscount.toFixed(2)),
    discount: Number(totalDiscount.toFixed(2)),
    promoTitle,
    promoDescription,
    breakdown,
    nextPromoHints,
    nextPromoHint: nextPromoHints[0] || null,
    legendaryCapsCount,
    pairs: totalPairs,
  };
}
