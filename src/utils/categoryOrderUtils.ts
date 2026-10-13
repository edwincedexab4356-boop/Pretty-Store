const ORDER_STORAGE_KEY = 'pretty_store_categories_order_v1';

export function getCustomCategoryOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategoryOrder(categoryIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(categoryIds));
  } catch (err) {
    console.warn('Error saving category order:', err);
  }
}

export function sortCategoriesByCustomOrder<T extends { id: string }>(categories: T[]): T[] {
  const order = getCustomCategoryOrder();
  if (!order || order.length === 0) return categories;

  const map = new Map<string, number>();
  order.forEach((id, idx) => map.set(id, idx));

  return [...categories].sort((a, b) => {
    const idxA = map.has(a.id) ? (map.get(a.id) as number) : 9999;
    const idxB = map.has(b.id) ? (map.get(b.id) as number) : 9999;
    return idxA - idxB;
  });
}
