import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';
import { Categoria, Producto, Inventario } from '../types/database';

export interface CatalogLoadResult {
  isConfigured: boolean;
  categories: Categoria[];
  products: Producto[];
  inventories: Inventario[];
  inventoryWarning?: string;
}

export interface CatalogError {
  failedQuery: 'connection' | 'categorias' | 'productos' | 'inventario';
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Checks whether Supabase credentials have been provided.
 */
export function isSupabaseReady(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * Fetches real categories, active products, and inventories from Supabase.
 * Enforces:
 * - categorias: activa = true
 * - productos: activo = true
 * - inventario: inventario.producto_id -> productos.id (stock_actual as authoritative stock)
 */
export async function fetchCatalogData(): Promise<CatalogLoadResult> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      isConfigured: false,
      categories: [],
      products: [],
      inventories: [],
    };
  }

  const supabase = getSupabaseClient();

  // 1. Fetch active categories from public.categorias
  const { data: rawCategories, error: catError } = await supabase
    .from('categorias')
    .select('id, nombre, descripcion, activa, created_at')
    .eq('activa', true)
    .order('nombre', { ascending: true });

  if (catError) {
    const err: CatalogError = {
      failedQuery: 'categorias',
      message: `Error al consultar la tabla 'public.categorias': ${catError.message}`,
      details: catError.details,
      hint: catError.hint || 'Ejecuta en Supabase SQL Editor: GRANT SELECT ON public.categorias TO anon; y CREATE POLICY "Lectura categorias" ON public.categorias FOR SELECT USING (true);',
      code: catError.code,
    };
    throw err;
  }

  const categories: Categoria[] = (rawCategories || []).map((c) => ({
    ...c,
    id: String(c.id),
  }));
  const categoryMap = new Map<string, Categoria>();
  categories.forEach((c) => categoryMap.set(String(c.id), c));

  // 2. Fetch active products from public.productos
  const { data: rawProducts, error: prodError } = await supabase
    .from('productos')
    .select('id, categoria_id, nombre, descripcion, precio, costo, stock, imagen_url, activo, created_at, updated_at')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (prodError) {
    const err: CatalogError = {
      failedQuery: 'productos',
      message: `Error al consultar la tabla 'public.productos': ${prodError.message}`,
      details: prodError.details,
      hint: prodError.hint || 'Ejecuta en Supabase SQL Editor: GRANT SELECT ON public.productos TO anon; y CREATE POLICY "Lectura productos" ON public.productos FOR SELECT USING (true);',
      code: prodError.code,
    };
    throw err;
  }

  // 3. Fetch inventory from public.inventario
  let inventories: Inventario[] = [];
  let inventoryWarning: string | undefined = undefined;

  const { data: rawInventories, error: invError } = await supabase
    .from('inventario')
    .select('id, producto_id, stock_actual, stock_minimo, updated_at');

  if (invError) {
    console.warn('[Supabase Warning: Inventario]', invError);
    // If inventario has permission error 42501, don't crash products if products table is available;
    // fallback to stock directly on the producto record.
    inventoryWarning = `Permisos pendientes en public.inventario (${invError.message}). Ejecuta: GRANT SELECT ON public.inventario TO anon;`;
  } else {
    inventories = rawInventories || [];
  }

  const inventoryMap = new Map<string, Inventario>();
  inventories.forEach((inv) => {
    if (inv.producto_id !== undefined && inv.producto_id !== null) {
      inventoryMap.set(String(inv.producto_id), inv);
    }
  });

  // 4. Merge inventory stock_actual into products and attach category
  const products: Producto[] = (rawProducts || []).map((prod) => {
    const stringProdId = String(prod.id);
    const stringCatId = String(prod.categoria_id);
    const inv = inventoryMap.get(stringProdId);
    const resolvedStock = inv !== undefined && typeof inv.stock_actual === 'number'
      ? inv.stock_actual
      : (typeof prod.stock === 'number' ? prod.stock : 0);

    return {
      ...prod,
      id: stringProdId,
      categoria_id: stringCatId,
      stock: resolvedStock,
      categoria: categoryMap.get(stringCatId),
    };
  });

  return {
    isConfigured: true,
    categories,
    products,
    inventories,
    inventoryWarning,
  };
}
