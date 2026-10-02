import { Categoria } from '../types/database';
import { getSupabaseClient } from '../lib/supabase';

export const CATEGORY_ORDER_STORAGE_KEY = 'pretty_store_category_order_ids';
const CATEGORY_ORDER_EVENT = 'pretty_store_category_order_changed';

/**
 * Obtiene el orden guardado de IDs de categorías desde almacenamiento local
 */
export function getSavedCategoryOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
  } catch (e) {
    console.warn('[CategoryOrder] Error al leer orden local:', e);
  }
  return [];
}

/**
 * Guarda el orden localmente y notifica a todas las vistas / pestañas
 */
export function saveCategoryOrderLocal(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(ids));
    // Disparar evento personalizado en la ventana actual
    window.dispatchEvent(new CustomEvent(CATEGORY_ORDER_EVENT, { detail: ids }));
  } catch (e) {
    console.warn('[CategoryOrder] Error al guardar orden local:', e);
  }
}

/**
 * Ordena una lista de categorías según el orden preferido (customOrderIds o localStorage o cat.orden)
 */
export function sortCategoriesWithOrder(
  categories: Categoria[],
  explicitOrderIds?: string[]
): Categoria[] {
  if (!categories || categories.length === 0) return [];

  const orderIds = explicitOrderIds || getSavedCategoryOrder();
  const orderMap = new Map<string, number>();

  if (orderIds && orderIds.length > 0) {
    orderIds.forEach((id, idx) => {
      orderMap.set(String(id), idx);
    });
  }

  // Copia antes de ordenar para evitar mutaciones directas
  return [...categories].sort((a, b) => {
    const idA = String(a.id);
    const idB = String(b.id);

    const hasCustomA = orderMap.has(idA);
    const hasCustomB = orderMap.has(idB);

    if (hasCustomA && hasCustomB) {
      return (orderMap.get(idA) ?? 0) - (orderMap.get(idB) ?? 0);
    }

    if (hasCustomA) return -1;
    if (hasCustomB) return 1;

    // Si ambos tienen la columna `orden` numérica definida en base de datos
    if (typeof a.orden === 'number' && typeof b.orden === 'number') {
      if (a.orden !== b.orden) {
        return a.orden - b.orden;
      }
    } else if (typeof a.orden === 'number') {
      return -1;
    } else if (typeof b.orden === 'number') {
      return 1;
    }

    // Como último criterio, mantener orden por nombre
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  });
}

/**
 * Guarda el orden de las categorías tanto localmente como en Supabase (si la columna orden existe)
 */
export async function persistCategoryOrder(
  orderedIds: string[]
): Promise<{ success: boolean; supabaseSynced: boolean; error?: string }> {
  // 1. Guardar de forma inmediata en local storage para que el usuario no sienta latencia
  saveCategoryOrderLocal(orderedIds);

  let supabaseSynced = false;
  let syncError: string | undefined = undefined;

  // 2. Intentar actualizar en Supabase la columna 'orden' de cada categoría
  try {
    const supabase = getSupabaseClient();
    
    // Ejecutar actualizaciones en paralelo
    const updatePromises = orderedIds.map((id, index) =>
      supabase
        .from('categorias')
        .update({ orden: index } as any)
        .eq('id', id)
    );

    const results = await Promise.allSettled(updatePromises);
    const hasError = results.some(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)
    );

    if (!hasError) {
      supabaseSynced = true;
    } else {
      // Inspeccionar el primer error
      const firstRejected = results.find(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)
      );
      if (firstRejected && firstRejected.status === 'fulfilled' && firstRejected.value.error) {
        syncError = firstRejected.value.error.message;
      }
    }
  } catch (err: any) {
    syncError = err?.message || 'Error al sincronizar con Supabase';
  }

  return {
    success: true,
    supabaseSynced,
    error: syncError,
  };
}

/**
 * Suscribe un callback a cambios de orden de categorías (mismo navegador o diferentes pestañas)
 */
export function subscribeToCategoryOrder(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => {
    callback();
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CATEGORY_ORDER_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(CATEGORY_ORDER_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(CATEGORY_ORDER_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
