import { getSupabaseClient } from '../lib/supabase';
import {
  Categoria,
  Producto,
  Inventario,
  Pedido,
  DetallePedido,
  Cliente,
  Venta,
  StoreConfig,
  DashboardStats,
  EstadoPedido,
} from '../types/database';

// Default configuration fallback
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  nombre_tienda: 'AURA',
  descripcion: 'Exclusiva selección de moda y accesorios premium.',
  logo_url: '',
  hero_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-adjusting-a-luxury-wristwatch-42999-large.mp4',
  hero_poster_url: '',
  catalog_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-black-dress-41618-large.mp4',
  telefono: '+507 6890-1234',
  whatsapp: '+507 6890-1234',
  email: 'contacto@aura.com',
  direccion: 'Boulevard Costa del Este, Torre Financial Park, Nivel 14',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  twitter: 'https://twitter.com',
};

// ==========================================
// AUTHENTICATION
// ==========================================

export async function loginAdmin(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message || 'Error al iniciar sesión.');
  }

  return data;
}

export async function registerAdmin(email: string, password: string, nombre?: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        nombre: nombre || 'Administrador',
        rol: 'admin',
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al registrar administrador.');
  }

  // Si existe tabla perfiles, intentar insertar/actualizar
  if (data.user) {
    try {
      await supabase.from('perfiles').upsert({
        id: data.user.id,
        nombre: nombre || email.split('@')[0],
        rol: 'admin',
      });
    } catch (e) {
      // Ignorar si perfiles no permite escritura anónima aún
    }
  }

  return data;
}

export async function logoutAdmin() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('Error al cerrar sesión:', error.message);
  }
}

export async function getAdminSession() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAdminAuthChange(callback: (event: string, session: any) => void) {
  const supabase = getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return data.subscription;
}

// ==========================================
// DASHBOARD STATS & CHARTS
// ==========================================

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Pedidos & Ventas
  let ventas_hoy = 0;
  let ventas_mes = 0;
  let pedidos_hoy = 0;
  let pedidos_pendientes = 0;

  try {
    const { data: orders } = await supabase
      .from('pedidos')
      .select('id, total, estado, created_at');

    if (orders) {
      orders.forEach((o) => {
        const orderDate = o.created_at || '';
        const orderTotal = Number(o.total) || 0;

        if (orderDate >= startOfToday && o.estado !== 'cancelado') {
          ventas_hoy += orderTotal;
          pedidos_hoy += 1;
        }

        if (orderDate >= startOfMonth && o.estado !== 'cancelado') {
          ventas_mes += orderTotal;
        }

        if (o.estado === 'pendiente') {
          pedidos_pendientes += 1;
        }
      });
    }
  } catch (err) {
    console.warn('Error cargando stats de pedidos:', err);
  }

  // 2. Productos & Stock
  let total_productos = 0;
  let productos_agotados = 0;
  let productos_stock_bajo = 0;

  try {
    const { data: prods } = await supabase
      .from('productos')
      .select('id, stock, activo');

    const { data: invs } = await supabase
      .from('inventario')
      .select('producto_id, stock_actual, stock_minimo');

    const invMap = new Map<string, { stock_actual: number; stock_minimo: number }>();
    if (invs) {
      invs.forEach((i) => {
        invMap.set(i.producto_id, {
          stock_actual: i.stock_actual,
          stock_minimo: i.stock_minimo || 5,
        });
      });
    }

    if (prods) {
      total_productos = prods.length;
      prods.forEach((p) => {
        const inv = invMap.get(p.id);
        const resolvedStock = inv ? inv.stock_actual : (p.stock || 0);
        const minStock = inv ? inv.stock_minimo : 5;

        if (resolvedStock <= 0) {
          productos_agotados += 1;
        } else if (resolvedStock <= minStock) {
          productos_stock_bajo += 1;
        }
      });
    }
  } catch (err) {
    console.warn('Error cargando stats de productos:', err);
  }

  return {
    ventas_hoy,
    ventas_mes,
    pedidos_hoy,
    pedidos_pendientes,
    total_productos,
    productos_agotados,
    productos_stock_bajo,
  };
}

export interface ChartDayPoint {
  label: string;
  total: number;
  orders: number;
}

export async function fetchSalesByPeriod(daysCount = 7): Promise<ChartDayPoint[]> {
  const supabase = getSupabaseClient();
  const points: ChartDayPoint[] = [];

  const now = new Date();
  const dayBuckets: Record<string, { total: number; orders: number; label: string }> = {};

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    dayBuckets[key] = { total: 0, orders: 0, label };
  }

  try {
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysCount);

    const { data: orders } = await supabase
      .from('pedidos')
      .select('id, total, estado, created_at')
      .gte('created_at', startDate.toISOString())
      .neq('estado', 'cancelado');

    if (orders) {
      orders.forEach((o) => {
        const key = (o.created_at || '').split('T')[0];
        if (dayBuckets[key]) {
          dayBuckets[key].total += Number(o.total) || 0;
          dayBuckets[key].orders += 1;
        }
      });
    }
  } catch (e) {
    console.warn('Error calculando ventas por periodo:', e);
  }

  Object.keys(dayBuckets).forEach((k) => {
    points.push(dayBuckets[k]);
  });

  return points;
}

export interface TopProductItem {
  id: string;
  nombre: string;
  cantidad: number;
  total_ventas: number;
  imagen_url: string | null;
}

export async function fetchTopProducts(): Promise<TopProductItem[]> {
  const supabase = getSupabaseClient();

  try {
    const { data: details } = await supabase
      .from('detalle_pedidos')
      .select('producto_id, cantidad, subtotal, precio_unitario');

    const { data: prods } = await supabase
      .from('productos')
      .select('id, nombre, imagen_url');

    const prodMap = new Map<string, { nombre: string; imagen_url: string | null }>();
    if (prods) {
      prods.forEach((p) => prodMap.set(p.id, { nombre: p.nombre, imagen_url: p.imagen_url }));
    }

    const counts: Record<string, { cantidad: number; total_ventas: number }> = {};
    if (details) {
      details.forEach((d) => {
        if (!counts[d.producto_id]) {
          counts[d.producto_id] = { cantidad: 0, total_ventas: 0 };
        }
        counts[d.producto_id].cantidad += Number(d.cantidad) || 0;
        counts[d.producto_id].total_ventas += Number(d.subtotal) || (Number(d.cantidad) * Number(d.precio_unitario)) || 0;
      });
    }

    const list: TopProductItem[] = Object.keys(counts).map((prodId) => {
      const p = prodMap.get(prodId);
      return {
        id: prodId,
        nombre: p?.nombre || 'Producto #' + prodId.slice(0, 6),
        cantidad: counts[prodId].cantidad,
        total_ventas: counts[prodId].total_ventas,
        imagen_url: p?.imagen_url || null,
      };
    });

    list.sort((a, b) => b.cantidad - a.cantidad);
    return list.slice(0, 5);
  } catch (e) {
    console.warn('Error obteniendo top productos:', e);
    return [];
  }
}

// ==========================================
// PRODUCTS CRUD
// ==========================================

export async function getAdminProducts(): Promise<Producto[]> {
  const supabase = getSupabaseClient();

  const { data: prods, error: pErr } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (pErr) throw new Error(`Error al cargar productos: ${pErr.message}`);

  const { data: cats } = await supabase.from('categorias').select('*');
  const catMap = new Map<string, Categoria>();
  if (cats) cats.forEach((c) => catMap.set(c.id, c));

  const { data: invs } = await supabase.from('inventario').select('*');
  const invMap = new Map<string, Inventario>();
  if (invs) invs.forEach((i) => invMap.set(i.producto_id, i));

  return (prods || []).map((p) => {
    const inv = invMap.get(p.id);
    const stockResolved = inv && typeof inv.stock_actual === 'number' ? inv.stock_actual : p.stock;
    return {
      ...p,
      stock: stockResolved,
      categoria: catMap.get(p.categoria_id),
    };
  });
}

export async function createAdminProduct(productData: {
  categoria_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number;
  stock: number;
  imagen_url: string;
  activo: boolean;
}): Promise<Producto> {
  const supabase = getSupabaseClient();

  const insertPayload = {
    categoria_id: productData.categoria_id,
    nombre: productData.nombre.trim(),
    descripcion: productData.descripcion.trim() || null,
    precio: Number(productData.precio) || 0,
    costo: Number(productData.costo) || 0,
    stock: Number(productData.stock) || 0,
    imagen_url: productData.imagen_url.trim() || null,
    activo: Boolean(productData.activo),
  };

  const { data: newProd, error: pErr } = await supabase
    .from('productos')
    .insert([insertPayload])
    .select()
    .single();

  if (pErr) throw new Error(`Error al guardar producto: ${pErr.message}`);

  // Create or update inventario row
  try {
    await supabase.from('inventario').insert([
      {
        producto_id: newProd.id,
        stock_actual: Number(productData.stock) || 0,
        stock_minimo: 5,
      },
    ]);
  } catch (invErr) {
    console.warn('Inventario sync warning:', invErr);
  }

  return newProd;
}

export async function updateAdminProduct(
  id: string,
  productData: {
    categoria_id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number;
    stock: number;
    imagen_url: string;
    activo: boolean;
  }
): Promise<Producto> {
  const supabase = getSupabaseClient();

  const updatePayload = {
    categoria_id: productData.categoria_id,
    nombre: productData.nombre.trim(),
    descripcion: productData.descripcion.trim() || null,
    precio: Number(productData.precio) || 0,
    costo: Number(productData.costo) || 0,
    stock: Number(productData.stock) || 0,
    imagen_url: productData.imagen_url.trim() || null,
    activo: Boolean(productData.activo),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedProd, error: pErr } = await supabase
    .from('productos')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (pErr) throw new Error(`Error al actualizar producto: ${pErr.message}`);

  // Sync inventario
  try {
    const { data: existingInv } = await supabase
      .from('inventario')
      .select('id')
      .eq('producto_id', id)
      .limit(1);

    if (existingInv && existingInv.length > 0) {
      await supabase
        .from('inventario')
        .update({
          stock_actual: Number(productData.stock) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('producto_id', id);
    } else {
      await supabase.from('inventario').insert([
        {
          producto_id: id,
          stock_actual: Number(productData.stock) || 0,
          stock_minimo: 5,
        },
      ]);
    }
  } catch (e) {
    console.warn('Inventario update error:', e);
  }

  return updatedProd;
}

export async function toggleProductActive(id: string, activo: boolean) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('productos')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`);
}

export async function updateProductStock(id: string, newStock: number) {
  const supabase = getSupabaseClient();
  const cleanStock = Math.max(0, Math.floor(newStock));

  const { error: pErr } = await supabase
    .from('productos')
    .update({ stock: cleanStock, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (pErr) throw new Error(`Error al actualizar stock: ${pErr.message}`);

  try {
    await supabase
      .from('inventario')
      .update({ stock_actual: cleanStock, updated_at: new Date().toISOString() })
      .eq('producto_id', id);
  } catch (e) {
    // Ignore if table has strict RLS
  }
}

export async function deleteAdminProduct(id: string): Promise<{ softDeleted: boolean }> {
  const supabase = getSupabaseClient();

  // Check if product is in detalle_pedidos
  try {
    const { data: ordersWithProd } = await supabase
      .from('detalle_pedidos')
      .select('id')
      .eq('producto_id', id)
      .limit(1);

    if (ordersWithProd && ordersWithProd.length > 0) {
      // Soft delete to protect foreign key integrity of existing customer orders
      await supabase
        .from('productos')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      return { softDeleted: true };
    }
  } catch (e) {
    // Continue to attempt physical delete
  }

  // Attempt physical delete
  try {
    await supabase.from('inventario').delete().eq('producto_id', id);
  } catch (e) {}

  const { error } = await supabase.from('productos').delete().eq('id', id);

  if (error) {
    // Fallback to soft delete
    await supabase
      .from('productos')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    return { softDeleted: true };
  }

  return { softDeleted: false };
}

// ==========================================
// CATEGORIES CRUD
// ==========================================

export async function getAdminCategories(): Promise<Categoria[]> {
  const supabase = getSupabaseClient();

  const { data: cats, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al cargar categorías: ${error.message}`);

  // Count products per category
  try {
    const { data: prods } = await supabase.from('productos').select('categoria_id');
    const countMap: Record<string, number> = {};
    if (prods) {
      prods.forEach((p) => {
        countMap[p.categoria_id] = (countMap[p.categoria_id] || 0) + 1;
      });
    }

    return (cats || []).map((c) => ({
      ...c,
      total_productos: countMap[c.id] || 0,
    }));
  } catch (e) {
    return cats || [];
  }
}

export async function createAdminCategory(categoryData: {
  nombre: string;
  descripcion?: string;
  activa: boolean;
}): Promise<Categoria> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('categorias')
    .insert([
      {
        nombre: categoryData.nombre.trim(),
        descripcion: categoryData.descripcion?.trim() || null,
        activa: Boolean(categoryData.activa),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error al crear categoría: ${error.message}`);
  return data;
}

export async function updateAdminCategory(
  id: string,
  categoryData: {
    nombre: string;
    descripcion?: string;
    activa: boolean;
  }
): Promise<Categoria> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('categorias')
    .update({
      nombre: categoryData.nombre.trim(),
      descripcion: categoryData.descripcion?.trim() || null,
      activa: Boolean(categoryData.activa),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar categoría: ${error.message}`);
  return data;
}

export async function toggleCategoryActive(id: string, activa: boolean) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('categorias')
    .update({ activa })
    .eq('id', id);

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`);
}

export async function deleteAdminCategory(id: string) {
  const supabase = getSupabaseClient();

  // Check if products exist in category
  const { data: prods } = await supabase
    .from('productos')
    .select('id')
    .eq('categoria_id', id)
    .limit(1);

  if (prods && prods.length > 0) {
    throw new Error('No se puede eliminar la categoría porque tiene productos asociados. Reasigna o elimina los productos primero.');
  }

  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar categoría: ${error.message}`);
}

// ==========================================
// INVENTORY CRUD
// ==========================================

export interface InventoryItemRow {
  id: string; // Inventario ID or Product ID
  producto_id: string;
  nombre_producto: string;
  imagen_url: string | null;
  categoria_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
  activo: boolean;
}

export async function getAdminInventory(): Promise<InventoryItemRow[]> {
  const supabase = getSupabaseClient();

  const { data: prods, error: pErr } = await supabase
    .from('productos')
    .select('id, nombre, imagen_url, precio, stock, activo, categoria_id');

  if (pErr) throw new Error(`Error cargando inventario: ${pErr.message}`);

  const { data: cats } = await supabase.from('categorias').select('id, nombre');
  const catMap = new Map<string, string>();
  if (cats) cats.forEach((c) => catMap.set(c.id, c.nombre));

  const { data: invs } = await supabase.from('inventario').select('*');
  const invMap = new Map<string, { id: string; stock_actual: number; stock_minimo: number }>();
  if (invs) {
    invs.forEach((i) => {
      invMap.set(i.producto_id, {
        id: i.id,
        stock_actual: i.stock_actual,
        stock_minimo: i.stock_minimo || 5,
      });
    });
  }

  return (prods || []).map((p) => {
    const inv = invMap.get(p.id);
    return {
      id: inv?.id || p.id,
      producto_id: p.id,
      nombre_producto: p.nombre,
      imagen_url: p.imagen_url,
      categoria_nombre: catMap.get(p.categoria_id) || 'Sin categoría',
      stock_actual: inv ? inv.stock_actual : (p.stock || 0),
      stock_minimo: inv ? inv.stock_minimo : 5,
      precio: p.precio,
      activo: p.activo,
    };
  });
}

export async function updateInventoryStock(
  productoId: string,
  stockActual: number,
  stockMinimo = 5
) {
  const supabase = getSupabaseClient();
  const cleanActual = Math.max(0, Math.floor(stockActual));
  const cleanMin = Math.max(0, Math.floor(stockMinimo));

  // Update product stock
  await supabase
    .from('productos')
    .update({ stock: cleanActual, updated_at: new Date().toISOString() })
    .eq('id', productoId);

  // Update or insert inventario
  const { data: existing } = await supabase
    .from('inventario')
    .select('id')
    .eq('producto_id', productoId)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('inventario')
      .update({
        stock_actual: cleanActual,
        stock_minimo: cleanMin,
        updated_at: new Date().toISOString(),
      })
      .eq('producto_id', productoId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('inventario').insert([
      {
        producto_id: productoId,
        stock_actual: cleanActual,
        stock_minimo: cleanMin,
      },
    ]);
    if (error) throw new Error(error.message);
  }
}

// ==========================================
// ORDERS CRUD
// ==========================================

export async function getAdminOrders(statusFilter?: EstadoPedido): Promise<Pedido[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('estado', statusFilter);
  }

  const { data: orders, error: oErr } = await query;
  if (oErr) throw new Error(`Error al consultar pedidos: ${oErr.message}`);

  // Fetch clients to cross-reference
  const { data: clients } = await supabase.from('clientes').select('*');
  const clientMap = new Map<string, Cliente>();
  if (clients) clients.forEach((c) => clientMap.set(c.id, c));

  // Fetch detail lines
  const { data: details } = await supabase.from('detalle_pedidos').select('*');
  const { data: prods } = await supabase.from('productos').select('id, nombre, imagen_url, precio');
  const prodMap = new Map<string, Producto>();
  if (prods) prods.forEach((p) => prodMap.set(p.id, p as Producto));

  const detailsByOrder: Record<string, DetallePedido[]> = {};
  if (details) {
    details.forEach((d) => {
      if (!detailsByOrder[d.pedido_id]) {
        detailsByOrder[d.pedido_id] = [];
      }
      detailsByOrder[d.pedido_id].push({
        ...d,
        producto: prodMap.get(d.producto_id),
      });
    });
  }

  return (orders || []).map((o) => ({
    ...o,
    cliente: o.cliente_id ? clientMap.get(o.cliente_id) : undefined,
    detalles: detailsByOrder[o.id] || [],
  }));
}

export async function updateOrderStatus(orderId: string, estado: EstadoPedido) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('pedidos')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(`Error al actualizar estado del pedido: ${error.message}`);
}

// ==========================================
// CLIENTS
// ==========================================

export async function getAdminClients(): Promise<Cliente[]> {
  const supabase = getSupabaseClient();

  const { data: clients, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar clientes: ${error.message}`);

  // Cross-reference with pedidos
  const { data: orders } = await supabase
    .from('pedidos')
    .select('id, cliente_id, total, created_at, estado');

  const statsByClient: Record<string, { count: number; total: number; latest: string }> = {};
  if (orders) {
    orders.forEach((o) => {
      if (o.cliente_id) {
        if (!statsByClient[o.cliente_id]) {
          statsByClient[o.cliente_id] = { count: 0, total: 0, latest: o.created_at || '' };
        }
        statsByClient[o.cliente_id].count += 1;
        if (o.estado !== 'cancelado') {
          statsByClient[o.cliente_id].total += Number(o.total) || 0;
        }
        if ((o.created_at || '') > statsByClient[o.cliente_id].latest) {
          statsByClient[o.cliente_id].latest = o.created_at || '';
        }
      }
    });
  }

  return (clients || []).map((c) => ({
    ...c,
    pedidos_count: statsByClient[c.id]?.count || 0,
    total_gastado: statsByClient[c.id]?.total || 0,
    ultimo_pedido: statsByClient[c.id]?.latest || c.created_at,
  }));
}

// ==========================================
// VENTAS / SALES
// ==========================================

export async function getAdminSales() {
  const supabase = getSupabaseClient();

  const { data: orders, error } = await supabase
    .from('pedidos')
    .select('*')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar ventas: ${error.message}`);

  const { data: clients } = await supabase.from('clientes').select('id, nombre, email, telefono, direccion');
  const clientMap = new Map<string, Cliente>();
  if (clients) clients.forEach((c) => clientMap.set(c.id, c));

  return (orders || []).map((o) => ({
    id: o.id,
    pedido_id: o.id,
    fecha: o.created_at,
    total: Number(o.total) || 0,
    subtotal: Number(o.subtotal) || 0,
    metodo_pago: o.metodo_pago,
    cliente: o.cliente_id ? clientMap.get(o.cliente_id) : undefined,
    estado: o.estado,
  }));
}

// ==========================================
// STORE CONFIGURATION & HERO VIDEO
// ==========================================

const CONFIG_STORAGE_KEY = 'elegance_store_config';

export function getLocalStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure the watch photo is permanently eliminated
      if (parsed.hero_poster_url && parsed.hero_poster_url.includes('1524805444758-089113d48a6d')) {
        parsed.hero_poster_url = '';
      }
      return { ...DEFAULT_STORE_CONFIG, ...parsed, hero_poster_url: '' };
    }
  } catch (e) {}
  return DEFAULT_STORE_CONFIG;
}

export function saveLocalStoreConfig(config: StoreConfig) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

export async function uploadMediaFile(
  bucketName: 'product-images' | 'site-assets',
  file: File
): Promise<string> {
  // 1. Validaciones estrictas por bucket
  if (bucketName === 'product-images') {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(
        `Formato no válido para imagen de producto. Solo se admiten JPG, PNG y WEBP (recibido: ${file.type || file.name}).`
      );
    }

    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `La imagen supera el límite de 5 MB (tamaño actual: ${sizeMB} MB). Por favor comprime o elige otra imagen.`
      );
    }
  } else if (bucketName === 'site-assets') {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
    ];
    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB

    const isSvg = file.name.toLowerCase().endsWith('.svg');
    const isAllowed = allowedTypes.includes(file.type.toLowerCase()) || isSvg;

    if (!isAllowed) {
      throw new Error(
        `Formato no válido para site-assets. Formatos permitidos: JPG, PNG, WEBP, SVG, MP4, WEBM (recibido: ${file.type || file.name}).`
      );
    }

    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `El archivo supera el límite permitido de 50 MB (tamaño actual: ${sizeMB} MB).`
      );
    }
  }

  const supabase = getSupabaseClient();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const fileName = `${Date.now()}_${cleanBaseName}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(
      `Error al subir a Supabase Storage (bucket '${bucketName}'): ${uploadError.message}. Verifica que el usuario administrador tenga sesión iniciada o que las políticas de Storage permitan escritura a 'authenticated'.`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo en Supabase Storage.');
  }

  return publicUrlData.publicUrl;
}
