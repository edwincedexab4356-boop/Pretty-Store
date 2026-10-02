import { Categoria } from '../types/database';
import { getSupabaseClient } from '../lib/supabase';

export const CATEGORY_ORDER_STORAGE_KEY = 'pretty_store_category_order_ids';
const CATEGORY_ORDER_EVENT = 'pretty_store_category_order_changed';
const SYSTEM_ORDER_EMAIL = 'system_category_order@store.internal';

// Memoria caché en tiempo de ejecución
let memoryCachedOrder: string[] | null = null;

/**
 * Obtiene el orden guardado de IDs de categorías desde almacenamiento local
 */
export function getSavedCategoryOrder(): string[] {
  if (memoryCachedOrder && memoryCachedOrder.length > 0) {
    return memoryCachedOrder;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryCachedOrder = parsed.map(String);
      return memoryCachedOrder;
    }
  } catch (e) {
    console.warn('[CategoryOrder] Error al leer orden local:', e);
  }
  return [];
}

/**
 * Consulta el orden persistido en Supabase de forma global para todos los visitantes públicos.
 */
export async function fetchRemoteCategoryOrder(): Promise<string[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('clientes')
      .select('direccion')
      .eq('email', SYSTEM_ORDER_EMAIL)
      .maybeSingle();

    if (!error && data?.direccion) {
      try {
        const parsed = JSON.parse(data.direccion);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = parsed.map(String);
          memoryCachedOrder = ids;
          saveCategoryOrderLocal(ids);
          return ids;
        }
      } catch (parseErr) {
        console.warn('[CategoryOrder] Error parseando JSON remoto:', parseErr);
      }
    }
  } catch (err) {
    console.warn('[CategoryOrder] Error consultando orden remoto en Supabase:', err);
  }

  return getSavedCategoryOrder();
}

/**
 * Guarda el orden localmente y notifica a todas las vistas / pestañas
 */
export function saveCategoryOrderLocal(ids: string[]): void {
  memoryCachedOrder = ids;
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

  const orderIds = explicitOrderIds && explicitOrderIds.length > 0
    ? explicitOrderIds
    : getSavedCategoryOrder();

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
 * Guarda el orden de las categorías de manera definitiva en Supabase para que
 * se refleje en la página pública para TODOS los visitantes en cualquier dispositivo.
 */
export async function persistCategoryOrder(
  orderedIds: string[]
): Promise<{ success: boolean; supabaseSynced: boolean; error?: string }> {
  // 1. Guardar de forma inmediata en local storage y memoria para latencia 0
  saveCategoryOrderLocal(orderedIds);

  let supabaseSynced = false;
  let syncError: string | undefined = undefined;

  try {
    const supabase = getSupabaseClient();
    const jsonOrder = JSON.stringify(orderedIds);

    // 2. Persistir en la tabla global de Supabase accesible para todos los clientes públicos
    const { data: existingRecord, error: checkError } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', SYSTEM_ORDER_EMAIL)
      .maybeSingle();

    if (!checkError && existingRecord?.id) {
      const { error: updateError } = await supabase
        .from('clientes')
        .update({
          direccion: jsonOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id);

      if (!updateError) {
        supabaseSynced = true;
      } else {
        syncError = updateError.message;
      }
    } else {
      const { error: insertError } = await supabase
        .from('clientes')
        .insert({
          nombre: '__system_category_order__',
          email: SYSTEM_ORDER_EMAIL,
          telefono: 'system',
          direccion: jsonOrder,
        });

      if (!insertError) {
        supabaseSynced = true;
      } else {
        syncError = insertError.message;
      }
    }

    // 3. También intentar actualizar la columna 'orden' en la tabla 'categorias'
    // si el usuario ejecutó la migración de columna en PostgreSQL
    try {
      const updatePromises = orderedIds.map((id, index) =>
        supabase
          .from('categorias')
          .update({ orden: index } as any)
          .eq('id', id)
      );
      await Promise.allSettled(updatePromises);
    } catch {
      // Ignorar si la columna no existe aún en categorias
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
