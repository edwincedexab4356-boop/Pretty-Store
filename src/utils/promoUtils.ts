import { CartItem, Producto } from '../types/database';

export const LEGENDARY_CAPS_CATEGORY_ID = '6e813d2c-2207-4416-bcd8-03af68652e5b'; // Gorras Legendaria 2.0
export const LEGENDARY_20_CATEGORY_ID = '6e813d2c-2207-4416-bcd8-03af68652e5b'; // Gorras Legendaria 2.0
export const GORRA_LEGENDARIA_CATEGORY_ID = '8ae0e02f-91a2-4d3b-9d8e-d6d21932feaa'; // Gorra Lengendaria / Gorra Legendaria
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
    key: 'legendaria_base',
    categoryIds: [GORRA_LEGENDARIA_CATEGORY_ID],
    matchNames: [
      'gorra legendaria',
      'gorras legendarias',
      'gorra lengendaria',
      'gorras lengendarias',
      'lengendaria',
      'lengendarias',
    ],
    excludeNames: ['2.0', '2 0', '2.o', '2 o'],
    displayName: 'Gorras Legendarias',
    unitPrice: 32,
    pairPrice: 58,
    pairDiscount: 6.0,
    badgeText: '1 por $32 | 2 por $58',
    shortBadge: '2 por $58',
  },
  {
    key: 'legendaria_20',
    categoryIds: [LEGENDARY_20_CATEGORY_ID],
    matchNames: [
      'gorras legendaria 2.0',
      'legendaria 2.0',
      'legendarias 2.0',
      'lengendaria 2.0',
      'lengendarias 2.0',
    ],
    displayName: 'Gorras Legendarias 2.0',
    unitPrice: 30,
    pairPrice: 55,
    pairDiscount: 5.0,
    badgeText: '1 por $30 | 2 por $55 (o combo $58)',
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

  // Priorizar match por ID exacto de categoría
  for (const rule of PROMO_RULES) {
    if (catId && rule.categoryIds && rule.categoryIds.includes(catId)) {
      return rule;
    }
  }

  // Verificar si es Gorras Legendarias 2.0 (por texto explícito)
  const is20 = combined.includes('2.0') || combined.includes('2 0') || combined.includes('2.o');
  const isLegend =
    combined.includes('legendaria') ||
    combined.includes('legendarias') ||
    combined.includes('lengendaria') ||
    combined.includes('lengendarias');

  if (isLegend) {
    if (is20) {
      return PROMO_RULES.find((r) => r.key === 'legendaria_20') || null;
    }
    return PROMO_RULES.find((r) => r.key === 'legendaria_base') || null;
  }

  // Para el resto de colecciones
  for (const rule of PROMO_RULES) {
    if (rule.key === 'legendaria_base' || rule.key === 'legendaria_20') {
      continue;
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
  return promo?.key === 'legendaria_base' || promo?.key === 'legendaria_20';
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
  const baseLegendariaUnits: { item: CartItem; price: number }[] = [];
  const twoPointZeroUnits: { item: CartItem; price: number }[] = [];
  const countsByOtherRule: Record<string, number> = {};

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;

    const unitPrice = typeof item.selectedOption?.precio === 'number'
      ? item.selectedOption.precio
      : (typeof item.product.precio === 'number' ? item.product.precio : 0);

    const promo = getProductPromo(item.product, item.product?.categoria?.nombre);

    if (promo?.key === 'legendaria_base') {
      for (let i = 0; i < qty; i++) {
        baseLegendariaUnits.push({ item, price: unitPrice });
      }
    } else if (promo?.key === 'legendaria_20') {
      for (let i = 0; i < qty; i++) {
        twoPointZeroUnits.push({ item, price: unitPrice });
      }
    } else if (promo) {
      countsByOtherRule[promo.key] = (countsByOtherRule[promo.key] || 0) + qty;
    }
  }

  const breakdown: PromoCategoryBreakdown[] = [];
  const nextPromoHints: string[] = [];
  let totalDiscount = 0;
  let totalPairs = 0;

  const ruleLegendariaBase = PROMO_RULES.find((r) => r.key === 'legendaria_base')!;
  const ruleLegendaria20 = PROMO_RULES.find((r) => r.key === 'legendaria_20')!;

  // 1. Promociones para Gorras Legendarias y Combinación con Legendaria 2.0
  const countBase = baseLegendariaUnits.length;
  const count20 = twoPointZeroUnits.length;

  const pairsBase = Math.floor(countBase / 2);
  const remBase = countBase % 2;

  const pairs20 = Math.floor(count20 / 2);
  const rem20 = count20 % 2;

  // Si queda 1 Gorra Legendaria y 1 Gorra Legendaria 2.0 desparejadas, se combinan en combo por $58
  let mixedPairs = 0;
  let mixedDiscount = 0;

  if (remBase === 1 && rem20 === 1) {
    mixedPairs = 1;
    const lastBasePrice = baseLegendariaUnits[countBase - 1].price || 32;
    const last20Price = twoPointZeroUnits[count20 - 1].price || 30;
    const regularComboSum = lastBasePrice + last20Price;
    mixedDiscount = Math.max(0, Number((regularComboSum - 58).toFixed(2)));
  }

  // Descuento por pares de Gorras Legendarias ($58 por par = $6 de ahorro sobre 2x$32=$64)
  if (pairsBase > 0) {
    let pairBaseDiscount = 0;
    for (let p = 0; p < pairsBase; p++) {
      const p1 = baseLegendariaUnits[p * 2].price || 32;
      const p2 = baseLegendariaUnits[p * 2 + 1].price || 32;
      const reg = p1 + p2;
      pairBaseDiscount += Math.max(0, Number((reg - 58).toFixed(2)));
    }

    totalDiscount += pairBaseDiscount;
    totalPairs += pairsBase;

    breakdown.push({
      rule: ruleLegendariaBase,
      count: pairsBase * 2,
      pairs: pairsBase,
      discount: pairBaseDiscount,
      promoTitle: pairsBase === 1
        ? 'Promo Gorras Legendarias (2 por $58)'
        : `Promo ${pairsBase}x (2 por $58) en Gorras Legendarias`,
      promoDescription: `¡Precio especial de $58.00 USD aplicado por cada 2 Gorras Legendarias!`,
      nextPromoHint: null,
    });
  }

  // Descuento por Combo Mixto (1 Legendaria + 1 Legendaria 2.0 = $58)
  if (mixedPairs > 0) {
    totalDiscount += mixedDiscount;
    totalPairs += mixedPairs;

    breakdown.push({
      rule: {
        ...ruleLegendariaBase,
        displayName: 'Combo Gorra Legendaria + Legendaria 2.0',
        shortBadge: '2 por $58',
      },
      count: mixedPairs * 2,
      pairs: mixedPairs,
      discount: mixedDiscount,
      promoTitle: 'Promo Combo Legendario: 1 Legendaria + 1 Legendaria 2.0 (2 por $58)',
      promoDescription: '¡Se aplicó el precio especial de $58.00 USD al combinar 1 Gorra Legendaria y 1 Gorra Legendaria 2.0!',
      nextPromoHint: null,
    });
  }

  // Descuento por pares de Gorras Legendarias 2.0 (2 por $55 = $5 de ahorro sobre 2x$30=$60)
  if (pairs20 > 0) {
    let pair20Discount = 0;
    for (let p = 0; p < pairs20; p++) {
      const p1 = twoPointZeroUnits[p * 2].price || 30;
      const p2 = twoPointZeroUnits[p * 2 + 1].price || 30;
      const reg = p1 + p2;
      pair20Discount += Math.max(0, Number((reg - 55).toFixed(2)));
    }

    totalDiscount += pair20Discount;
    totalPairs += pairs20;

    breakdown.push({
      rule: ruleLegendaria20,
      count: pairs20 * 2,
      pairs: pairs20,
      discount: pair20Discount,
      promoTitle: pairs20 === 1
        ? 'Promo Gorras Legendarias 2.0 (2 por $55)'
        : `Promo ${pairs20}x (2 por $55) en Gorras Legendarias 2.0`,
      promoDescription: `¡Descuento especial de -$${pair20Discount.toFixed(2)} USD aplicado en Gorras Legendarias 2.0!`,
      nextPromoHint: null,
    });
  }

  // Sugerencia de siguiente promo para gorras legendarias
  const effectiveRemBase = remBase - mixedPairs;
  const effectiveRem20 = rem20 - mixedPairs;

  if (effectiveRemBase === 1 && effectiveRem20 === 0) {
    nextPromoHints.push(
      '¡Agrega 1 Gorra Legendaria o Legendaria 2.0 más y llévate ambas por solo $58.00 USD!'
    );
  } else if (effectiveRemBase === 0 && effectiveRem20 === 1) {
    nextPromoHints.push(
      '¡Agrega 1 Gorra Legendaria 2.0 (2 por $55) o 1 Gorra Legendaria (Combo por $58) para activar tu descuento!'
    );
  }

  // 2. Otras Colecciones con Promoción (Bélicas, Perfumes, etc.)
  for (const rule of PROMO_RULES) {
    if (rule.key === 'legendaria_base' || rule.key === 'legendaria_20') {
      continue;
    }

    const count = countsByOtherRule[rule.key] || 0;
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
  const legendaryCapsCount = countBase + count20;

  let promoTitle = '';
  let promoDescription = '';

  if (breakdown.length === 1) {
    promoTitle = breakdown[0].promoTitle;
    promoDescription = breakdown[0].promoDescription;
  } else if (breakdown.length > 1) {
    promoTitle = `Promociones Múltiples Aplicadas (${breakdown.length} ofertas)`;
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
