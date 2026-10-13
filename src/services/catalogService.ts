import { supabase } from '../lib/supabase';
import { Categoria, Producto } from '../types/database';
import { sortCategoriesByCustomOrder } from '../utils/categoryOrderUtils';

export async function getActiveCategories(): Promise<Categoria[]> {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching categories from Supabase:', error);
      return [];
    }

    return sortCategoriesByCustomOrder(data || []);
  } catch (err) {
    console.warn('Network error fetching categories:', err);
    return [];
  }
}

export async function getActiveProducts(categoryId?: string): Promise<Producto[]> {
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
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Network error fetching products:', err);
    return [];
  }
}
