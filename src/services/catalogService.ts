import { supabase } from '../lib/supabase';
import { Categoria, Producto } from '../types/database';
import { sortCategoriesByCustomOrder } from '../utils/categoryOrderUtils';
import { decodeProductOptions } from '../utils/productOptions';

let cachedCategories: { data: Categoria[]; timestamp: number } | null = null;
let cachedProducts: { data: Producto[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 20_000;

export function invalidateCatalogCache() {
  cachedCategories = null;
  cachedProducts = null;
}

export async function getActiveCategories(): Promise<Categoria[]> {
  if (cachedCategories && Date.now() - cachedCategories.timestamp < CACHE_TTL_MS) {
    return cachedCategories.data;
  }

  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching categories from Supabase:', error);
      return cachedCategories?.data || [];
    }

    const sorted = sortCategoriesByCustomOrder(data || []);
    cachedCategories = { data: sorted, timestamp: Date.now() };
    return sorted;
  } catch (err) {
    console.warn('Network error fetching categories:', err);
    return cachedCategories?.data || [];
  }
}

export async function getActiveProducts(categoryId?: string): Promise<Producto[]> {
  if (!categoryId && cachedProducts && Date.now() - cachedProducts.timestamp < CACHE_TTL_MS) {
    return cachedProducts.data;
  }

  try {
    let query = supabase
      .from('productos')
      .select('*, categoria:categorias(*)')
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (categoryId) {
      query = query.eq('categoria_id', categoryId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching products from Supabase:', error);
      return (!categoryId && cachedProducts?.data) ? cachedProducts.data : [];
    }

    const parsed = (data || []).map((p: any) => {
      const { cleanDescription, opciones } = decodeProductOptions(p.descripcion, p.id);
      return {
        ...p,
        descripcion: cleanDescription,
        opciones,
      };
    });

    if (!categoryId) {
      cachedProducts = { data: parsed, timestamp: Date.now() };
    }

    return parsed;
  } catch (err) {
    console.warn('Network error fetching products:', err);
    return (!categoryId && cachedProducts?.data) ? cachedProducts.data : [];
  }
}
