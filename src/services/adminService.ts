import { supabase } from '../lib/supabase';
import { Categoria, Producto, Pedido, Cliente, Inventario, EstadoPedido, PedidoItem } from '../types/database';
import {
  getAllSavedOrderReceipts,
  getOrderReceiptById,
  deleteOrderReceipt,
  clearAllSavedOrderReceipts,
} from '../utils/orderReceiptStorage';
import { getVoucherImageFromDb } from '../utils/voucherDb';
import { sortCategoriesByCustomOrder, saveCustomCategoryOrder } from '../utils/categoryOrderUtils';
import { getPrimaryProductImage } from '../utils/productImages';
import {
  decodeProductOptions,
  encodeProductOptions,
  saveLocalProductOptions,
} from '../utils/productOptions';
import { invalidateCatalogCache } from './catalogService';

/* ==================== SUBIDA DE IMÁGENES A SUPABASE STORAGE ==================== */
export async function uploadProductImageToStorage(file: File): Promise<string> {
  try {
    const ext = file.name ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const mimeType = file.type || `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`;
    const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error);
      throw error;
    }

    const { data: pubData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    if (pubData?.publicUrl) {
      return pubData.publicUrl;
    }

    throw new Error('No se pudo generar la URL pública de la imagen.');
  } catch (err: any) {
    console.error('Error in uploadProductImageToStorage, fallback base64:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
      reader.readAsDataURL(file);
    });
  }
}

/* ==================== CATEGORIAS ==================== */
export async function getAdminCategories(): Promise<Categoria[]> {
  try {
    const { data: cats, error } = await supabase
      .from('categorias')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Obtener recuento de productos
    const { data: prods } = await supabase.from('productos').select('categoria_id');
    const counts: Record<string, number> = {};
    if (prods) {
      prods.forEach((p) => {
        if (p.categoria_id) counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1;
      });
    }

    const mapped = (cats || []).map((c) => ({
      ...c,
      total_productos: counts[c.id] || 0,
    }));

    return sortCategoriesByCustomOrder(mapped);
  } catch (err) {
    console.warn('Error fetching admin categories:', err);
    return [];
  }
}

export async function createAdminCategory(category: Partial<Categoria>): Promise<Categoria | null> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({
      nombre: category.nombre,
      descripcion: category.descripcion || null,
      activa: category.activa !== undefined ? category.activa : true,
    })
    .select('*')
    .single();

  if (error) throw error;
  invalidateCatalogCache();
  return data;
}

export async function updateAdminCategory(id: string, category: Partial<Categoria>): Promise<Categoria | null> {
  const { data, error } = await supabase
    .from('categorias')
    .update({
      nombre: category.nombre,
      descripcion: category.descripcion,
      activa: category.activa,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  invalidateCatalogCache();
  return data;
}

export async function deleteAdminCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
  invalidateCatalogCache();
  return true;
}

export async function toggleCategoryActive(id: string, activa: boolean): Promise<boolean> {
  const { error } = await supabase.from('categorias').update({ activa }).eq('id', id);
  if (error) throw error;
  invalidateCatalogCache();
  return true;
}

export async function saveAdminCategoriesOrder(categoryIds: string[]): Promise<void> {
  saveCustomCategoryOrder(categoryIds);
}

/* ==================== PRODUCTOS ==================== */
export async function getAdminProducts(): Promise<Producto[]> {
  const mergedMap = new Map<string, Producto>();

  try {
    // 1. Fetch from Supabase
    let dbProducts: any[] = [];
    const { data, error } = await supabase
      .from('productos')
      .select('*, categoria:categorias(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbProducts = data;
    } else {
      const fallback = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (fallback.data) dbProducts = fallback.data;
    }

    for (const p of dbProducts) {
      const { cleanDescription, opciones } = decodeProductOptions(p.descripcion, p.id);
      mergedMap.set(String(p.id), {
        ...p,
        descripcion: cleanDescription,
        opciones,
      });
    }
  } catch (err) {
    console.warn('Error fetching admin products from Supabase:', err);
  }

  // 2. Fetch from server products backup
  try {
    if (typeof window !== 'undefined') {
      const sRes = await fetch('/api/products');
      if (sRes.ok) {
        const sProds = await sRes.json();
        if (Array.isArray(sProds)) {
          for (const sp of sProds) {
            const key = String(sp.id);
            if (!mergedMap.has(key)) {
              const { cleanDescription, opciones } = decodeProductOptions(sp.descripcion, sp.id);
              mergedMap.set(key, {
                ...sp,
                descripcion: cleanDescription,
                opciones: sp.opciones || opciones,
              });
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return Array.from(mergedMap.values());
}

export async function createAdminProduct(product: Partial<Producto>): Promise<Producto | null> {
  const encodedDesc = encodeProductOptions(product.descripcion, product.opciones);
  const payloadToInsert = {
    categoria_id: product.categoria_id || null,
    nombre: product.nombre,
    descripcion: encodedDesc,
    precio: product.precio || 0,
    costo: product.costo !== undefined ? product.costo : 0,
    stock: product.stock !== undefined ? product.stock : 10,
    imagen_url: product.imagen_url || null,
    imagenes: product.imagenes || (product.imagen_url ? [product.imagen_url] : []),
    activo: product.activo !== undefined ? product.activo : true,
  };

  let savedData: any = null;

  try {
    const { data, error } = await supabase
      .from('productos')
      .insert(payloadToInsert)
      .select('*, categoria:categorias(*)')
      .single();

    if (!error && data) {
      savedData = data;
    } else if (error) {
      console.warn('Supabase product insert warning/error:', error.message);
      // Try simple insert without join
      const simpleRes = await supabase.from('productos').insert(payloadToInsert).select('*').single();
      if (!simpleRes.error && simpleRes.data) {
        savedData = simpleRes.data;
      } else {
        throw error;
      }
    }
  } catch (err: any) {
    console.warn('Supabase product insert failed (possible RLS):', err?.message);
    // If Supabase failed (e.g., RLS policy), generate fallback object
    savedData = {
      ...payloadToInsert,
      id: `prod_local_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
  }

  invalidateCatalogCache();

  if (savedData?.id && product.opciones) {
    saveLocalProductOptions(savedData.id, product.opciones);
  }

  const { cleanDescription, opciones } = decodeProductOptions(savedData.descripcion, savedData.id);
  const finalProduct: Producto = {
    ...savedData,
    descripcion: cleanDescription,
    opciones: product.opciones || opciones,
  };

  // Sync to server backup
  try {
    if (typeof window !== 'undefined') {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProduct),
      }).catch((e) => console.warn('Silent product sync to server error:', e));
    }
  } catch {
    // ignore
  }

  return finalProduct;
}

export async function updateAdminProduct(id: string, product: Partial<Producto>): Promise<Producto | null> {
  const encodedDesc = encodeProductOptions(product.descripcion, product.opciones);
  const payloadToUpdate = {
    categoria_id: product.categoria_id,
    nombre: product.nombre,
    descripcion: encodedDesc,
    precio: product.precio,
    costo: product.costo !== undefined ? product.costo : 0,
    stock: product.stock,
    imagen_url: product.imagen_url,
    imagenes: product.imagenes || (product.imagen_url ? [product.imagen_url] : []),
    activo: product.activo,
  };

  let savedData: any = null;

  try {
    const { data, error } = await supabase
      .from('productos')
      .update(payloadToUpdate)
      .eq('id', id)
      .select('*, categoria:categorias(*)')
      .single();

    if (!error && data) {
      savedData = data;
    } else {
      const simple = await supabase.from('productos').update(payloadToUpdate).eq('id', id).select('*').single();
      if (simple.data) savedData = simple.data;
    }
  } catch (err) {
    console.warn('Supabase product update error:', err);
  }

  if (!savedData) {
    savedData = { ...payloadToUpdate, id };
  }

  invalidateCatalogCache();

  if (id && product.opciones) {
    saveLocalProductOptions(id, product.opciones);
  }

  const { cleanDescription, opciones } = decodeProductOptions(savedData.descripcion, savedData.id);
  const finalProduct: Producto = {
    ...savedData,
    descripcion: cleanDescription,
    opciones: product.opciones || opciones,
  };

  try {
    if (typeof window !== 'undefined') {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProduct),
      }).catch((e) => console.warn('Silent product update sync error:', e));
    }
  } catch {
    // ignore
  }

  return finalProduct;
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  try {
    await supabase.from('productos').delete().eq('id', id);
  } catch {
    // ignore
  }
  invalidateCatalogCache();
  return true;
}

/* ==================== PEDIDOS ==================== */
export async function getAdminOrders(): Promise<Pedido[]> {
  try {
    let dbOrders: any[] = [];
    try {
      const res = await supabase.from('pedidos').select('*, cliente:clientes(*)').order('created_at', { ascending: false });
      if (!res.error && res.data) {
        dbOrders = res.data;
      } else {
        const fallbackRes = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
        if (fallbackRes.data) dbOrders = fallbackRes.data;
      }
    } catch (e) {
      console.warn('Supabase fetch pedidos error:', e);
    }

    let serverOrders: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const sRes = await fetch('/api/orders');
        if (sRes.ok) {
          serverOrders = await sRes.json();
        }
      }
    } catch {
      // ignore
    }

    const { data: allProducts } = await supabase.from('productos').select('*');

    // Mapa de productos por ID y nombre para resolver imágenes
    const productMap = new Map<string, Producto>();
    const productByNameMap = new Map<string, Producto>();
    if (allProducts) {
      allProducts.forEach((p) => {
        productMap.set(String(p.id), p);
        if (p.nombre) productByNameMap.set(p.nombre.toLowerCase().trim(), p);
      });
    }

    const localReceipts = getAllSavedOrderReceipts();
    const ordersMap = new Map<string, Pedido>();

    if (dbOrders) {
      for (const o of dbOrders) {
        const orderKey = String(o.id);
        const localRec = getOrderReceiptById(orderKey) || getOrderReceiptById(o.numero_orden || '');
        const matchingServerOrder = serverOrders.find(
          (so) => String(so.id) === orderKey || so.numero_orden === o.numero_orden
        );
        let voucher = o.comprobante_pago || matchingServerOrder?.comprobante_pago || localRec?.comprobanteUrl || null;

        if (!voucher) {
          voucher = await getVoucherImageFromDb(orderKey);
        }
        if (!voucher && o.numero_orden) {
          voucher = await getVoucherImageFromDb(o.numero_orden);
        }

        if (voucher && typeof voucher === 'string' && voucher.startsWith('/') && typeof window !== 'undefined') {
          voucher = `${window.location.origin}${voucher}`;
        }

        // Extraer items guardados en notas si no están en localReceipt
        let itemsFromNotes: any[] = [];
        if (o.notas && o.notas.includes('[ITEMS_JSON]:')) {
          try {
            const rawJson = o.notas.split('[ITEMS_JSON]:')[1]?.trim();
            if (rawJson) {
              const parsed = JSON.parse(rawJson);
              if (Array.isArray(parsed)) itemsFromNotes = parsed;
            }
          } catch {
            // ignore
          }
        }

        const rawItems = localRec?.items || itemsFromNotes;
        const resolvedItems: PedidoItem[] = (rawItems || []).map((it: any) => {
          const prodId = String(it.producto_id || it.product?.id || it.id || '');
          const prodName = it.product?.nombre || it.nombre || '';
          const matchProd = productMap.get(prodId) || productByNameMap.get(prodName.toLowerCase().trim());

          const effectiveImg =
            getPrimaryProductImage(it.product || it) ||
            getPrimaryProductImage(matchProd) ||
            '/images/logo/logotipo.jpeg';

          const mergedProd: Producto = {
            id: prodId,
            nombre: prodName || matchProd?.nombre || 'Producto',
            precio: it.precio_unitario || it.product?.precio || it.precio || matchProd?.precio || 0,
            costo: matchProd?.costo || 0,
            stock: matchProd?.stock || 0,
            activo: true,
            categoria_id: matchProd?.categoria_id || null,
            imagen_url: effectiveImg,
            descripcion: matchProd?.descripcion || null,
          };

          return {
            producto_id: prodId,
            cantidad: it.quantity || it.cantidad || 1,
            precio_unitario: it.precio_unitario || it.product?.precio || it.precio || matchProd?.precio || 0,
            subtotal: it.subtotal || (it.precio_unitario || it.precio || 0) * (it.quantity || 1),
            producto: mergedProd,
            selectedSize: it.selectedSize || it.talla,
            selectedOption: it.selectedOption || undefined,
          };
        });

        const resolvedCliente: Cliente = o.cliente || {
          id: String(o.cliente_id || o.id),
          nombre: o.cliente_nombre || o.cliente?.nombre || 'Cliente',
          telefono: o.cliente_telefono || o.cliente?.telefono || '—',
          email: o.cliente_email || o.cliente?.email || null,
          direccion: o.direccion || o.cliente?.direccion || null,
        };

        ordersMap.set(orderKey, {
          ...o,
          id: orderKey,
          cliente: resolvedCliente,
          comprobante_pago: voucher,
          items: resolvedItems,
        });
      }
    }

    // Agregar pedidos locales que no aparecieron en la BD
    for (const rec of localReceipts) {
      const recKey = String(rec.orderId);
      if (!ordersMap.has(recKey)) {
        let voucher = rec.comprobanteUrl;
        if (!voucher) {
          voucher = await getVoucherImageFromDb(recKey);
        }

        const resolvedItems: PedidoItem[] = (rec.items || []).map((it) => {
          const prodId = String(it.product.id);
          const prodName = it.product.nombre;
          const matchProd = productMap.get(prodId) || productByNameMap.get(prodName.toLowerCase().trim());
          const effectiveImg =
            getPrimaryProductImage(it.product) ||
            getPrimaryProductImage(matchProd) ||
            '/images/logo/logotipo.jpeg';

          return {
            producto_id: prodId,
            cantidad: it.quantity,
            precio_unitario: it.product.precio,
            subtotal: it.subtotal,
            producto: {
              ...(matchProd || it.product),
              id: prodId,
              nombre: prodName,
              precio: it.product.precio,
              costo: matchProd?.costo || 0,
              stock: matchProd?.stock || 0,
              activo: true,
              categoria_id: matchProd?.categoria_id || null,
              imagen_url: effectiveImg,
              descripcion: matchProd?.descripcion || null,
            },
            selectedSize: it.selectedSize,
          };
        });

        ordersMap.set(recKey, {
          id: recKey,
          numero_orden: rec.orderNumber,
          total: rec.total,
          subtotal: rec.subtotal,
          descuento: rec.discount,
          envio: rec.shipping,
          metodo_pago: rec.metodoPago as any,
          tipo_entrega: rec.tipoEntrega as any,
          courier: rec.courier,
          estado: (rec as any).estado || 'pendiente',
          notas: rec.notas,
          comprobante_pago: voucher,
          created_at: rec.createdAt,
          cliente: {
            id: recKey,
            nombre: rec.nombre,
            telefono: rec.telefono,
            email: rec.email || null,
            direccion: rec.direccion || null,
          },
          items: resolvedItems,
        });
      }
    }

    // Agregar pedidos del servidor cross-device que no estén aún en ordersMap
    for (const so of serverOrders) {
      const sKey = String(so.id);
      if (!ordersMap.has(sKey)) {
        let itemsFromNotes: any[] = [];
        if (so.notas && so.notas.includes('[ITEMS_JSON]:')) {
          try {
            const rawJson = so.notas.split('[ITEMS_JSON]:')[1]?.trim();
            if (rawJson) {
              const parsed = JSON.parse(rawJson);
              if (Array.isArray(parsed)) itemsFromNotes = parsed;
            }
          } catch {
            // ignore
          }
        }
        ordersMap.set(sKey, {
          ...so,
          id: sKey,
          cliente: {
            id: sKey,
            nombre: so.cliente_nombre || 'Cliente',
            telefono: so.cliente_telefono || '—',
            email: so.cliente_email || null,
            direccion: so.direccion || null,
          },
          items: itemsFromNotes,
        });
      }
    }

    return Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  } catch (err) {
    console.warn('Error fetching admin orders:', err);
    return [];
  }
}

export async function updateOrderStatus(orderId: string | number, estado: EstadoPedido): Promise<boolean> {
  const cleanId = String(orderId);
  try {
    const { error } = await supabase.from('pedidos').update({ estado }).eq('id', cleanId);
    if (error) console.warn('Supabase update status error:', error);
  } catch (err) {
    console.warn('Update order status error:', err);
  }

  // Cross-device server sync
  try {
    if (typeof window !== 'undefined') {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cleanId, estado }),
      }).catch(() => {});
    }
  } catch {
    // ignore
  }

  return true;
}

export async function deleteAdminOrder(orderId: string | number): Promise<boolean> {
  const cleanId = String(orderId);
  const isNum = !isNaN(Number(cleanId));
  try {
    // 1. Eliminar de Supabase ventas vinculadas
    try {
      if (isNum) {
        await supabase.from('ventas').delete().eq('pedido_id', Number(cleanId));
      }
      await supabase.from('ventas').delete().eq('pedido_id', cleanId);
    } catch {
      // ignore
    }

    // 2. Eliminar de Supabase pedidos
    if (isNum) {
      await supabase.from('pedidos').delete().eq('id', Number(cleanId));
    }
    const { error } = await supabase.from('pedidos').delete().eq('id', cleanId);
    if (error) console.warn('Supabase delete order warning:', error);

    // 3. Eliminar de la copia del servidor
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/orders/${cleanId}`, { method: 'DELETE' });
      }
    } catch {
      // ignore
    }

    // 4. Eliminar de copias locales
    deleteOrderReceipt(cleanId);
    return true;
  } catch (err) {
    console.warn('Error in deleteAdminOrder:', err);
    deleteOrderReceipt(cleanId);
    return true;
  }
}

export async function deleteAllAdminOrders(): Promise<boolean> {
  try {
    // 1. Eliminar ventas asociadas primero
    try {
      const { data: allV } = await supabase.from('ventas').select('id');
      if (allV && allV.length > 0) {
        const ids = allV.map((v) => v.id);
        await supabase.from('ventas').delete().in('id', ids);
      }
      await supabase.from('ventas').delete().not('id', 'is', null);
    } catch {}

    // 2. Obtener y eliminar todos los pedidos en Supabase de forma segura
    try {
      const { data: allP } = await supabase.from('pedidos').select('id');
      if (allP && allP.length > 0) {
        for (const p of allP) {
          await supabase.from('pedidos').delete().eq('id', p.id);
        }
      }
      await supabase.from('pedidos').delete().not('id', 'is', null);
    } catch (e) {
      console.warn('Error clearing pedidos table:', e);
    }

    // 3. Limpiar del servidor express (/api/orders)
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/orders', { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Error clearing server orders:', e);
    }

    // 4. Limpiar almacenamiento local de pedidos e IndexedDB
    clearAllSavedOrderReceipts();
    return true;
  } catch (err) {
    console.warn('Error in deleteAllAdminOrders:', err);
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/orders', { method: 'DELETE' });
      }
    } catch {}
    clearAllSavedOrderReceipts();
    return true;
  }
}

/* ==================== VENTAS ==================== */
export interface VentaRecord {
  id: string;
  pedido_id?: string | null;
  numero_orden?: string;
  total: number;
  subtotal?: number;
  descuento?: number;
  fecha: string;
  created_at?: string;
  metodo_pago?: string;
  tipo_entrega?: string;
  estado?: string;
  cliente: {
    id?: string;
    nombre: string;
    telefono: string;
    email?: string | null;
    direccion?: string | null;
  };
  items: PedidoItem[];
}

export async function getAdminSales(): Promise<VentaRecord[]> {
  try {
    // Obtener pedidos para construir el historial de ventas completo
    const orders = await getAdminOrders();

    // Filtrar solo pedidos aprobados / confirmados por el administrador
    // (NO 'pendiente' y NO 'cancelado')
    const salesList: VentaRecord[] = orders
      .filter((o) => o.estado !== 'pendiente' && o.estado !== 'cancelado')
      .map((o) => {
        const saleId = String(o.id);
        const orderNum = o.numero_orden || (saleId.length > 8 ? saleId.slice(0, 8) : saleId);
        return {
          id: saleId,
          pedido_id: saleId,
          numero_orden: `#${orderNum}`,
          total: Number(o.total) || 0,
          subtotal: Number(o.subtotal) || Number(o.total) || 0,
          descuento: Number(o.descuento) || 0,
          fecha: o.created_at || new Date().toISOString(),
          created_at: o.created_at || new Date().toISOString(),
          metodo_pago: o.metodo_pago || 'efectivo',
          tipo_entrega: o.tipo_entrega || 'delivery',
          estado: o.estado,
          cliente: {
            id: o.cliente?.id || saleId,
            nombre: o.cliente?.nombre || 'Cliente',
            telefono: o.cliente?.telefono || '—',
            email: o.cliente?.email || null,
            direccion: o.cliente?.direccion || null,
          },
          items: o.items || [],
        };
      });

    return salesList.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  } catch (err) {
    console.warn('Error fetching admin sales:', err);
    return [];
  }
}

export async function deleteAdminSale(saleId: string | number, pedidoId?: string | number): Promise<boolean> {
  const targetSaleId = String(saleId);
  const targetOrderId = pedidoId ? String(pedidoId) : targetSaleId;

  try {
    // 1. Eliminar de tabla ventas si existe registro
    try {
      await supabase.from('ventas').delete().eq('id', targetSaleId);
      await supabase.from('ventas').delete().eq('pedido_id', targetOrderId);
    } catch {
      // ignore
    }

    // 2. Eliminar de tabla pedidos
    try {
      await supabase.from('pedidos').delete().eq('id', targetOrderId);
    } catch {
      // ignore
    }

    // 3. Eliminar de servidor express
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/orders/${targetOrderId}`, { method: 'DELETE' });
      }
    } catch {
      // ignore
    }

    // 4. Eliminar de recibos locales
    deleteOrderReceipt(targetOrderId);
    deleteOrderReceipt(targetSaleId);
    return true;
  } catch (err) {
    console.warn('Error deleting admin sale:', err);
    deleteOrderReceipt(targetSaleId);
    return true;
  }
}

export async function deleteAllAdminSales(): Promise<boolean> {
  try {
    // 1. Eliminar todos los registros de la tabla ventas en Supabase
    try {
      const { data: allV } = await supabase.from('ventas').select('id');
      if (allV && allV.length > 0) {
        await supabase.from('ventas').delete().in('id', allV.map((v) => v.id));
      }
      await supabase.from('ventas').delete().not('id', 'is', null);
    } catch {}

    // 2. Las ventas registradas provienen de pedidos confirmados/entregados.
    // Eliminar pedidos confirmados en Supabase:
    try {
      const { data: allP } = await supabase.from('pedidos').select('id, estado');
      if (allP && allP.length > 0) {
        const confirmed = allP.filter((o) => o.estado !== 'pendiente');
        if (confirmed.length > 0) {
          const cIds = confirmed.map((c) => c.id);
          await supabase.from('pedidos').delete().in('id', cIds);
        }
      }
    } catch (e) {
      console.warn('Error clearing confirmed orders for sales:', e);
    }

    // 3. Limpiar pedidos del servidor express
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/orders', { method: 'DELETE' });
      }
    } catch {}

    // 4. Limpiar copias locales
    clearAllSavedOrderReceipts();
    return true;
  } catch (err) {
    console.warn('Error in deleteAllAdminSales:', err);
    clearAllSavedOrderReceipts();
    return true;
  }
}

/* ==================== CLIENTES ==================== */
export async function getAdminClients(): Promise<Cliente[]> {
  try {
    const { data: clients, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular totales desde pedidos
    const { data: orders } = await supabase.from('pedidos').select('cliente_id, total, estado');
    const spentMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};

    if (orders) {
      orders.forEach((o) => {
        if (o.cliente_id && o.estado !== 'cancelado') {
          spentMap[o.cliente_id] = (spentMap[o.cliente_id] || 0) + (o.total || 0);
          countMap[o.cliente_id] = (countMap[o.cliente_id] || 0) + 1;
        }
      });
    }

    return (clients || []).map((c) => ({
      ...c,
      total_pedidos: countMap[c.id] || 0,
      total_gastado: Number((spentMap[c.id] || 0).toFixed(2)),
    }));
  } catch (err) {
    console.warn('Error fetching clients:', err);
    return [];
  }
}

export async function deleteAdminClient(clientId: string | number): Promise<boolean> {
  const cleanId = String(clientId);
  const isNum = !isNaN(Number(cleanId));
  const numericId = isNum ? Number(cleanId) : null;
  try {
    // 1. Desvincular cliente_id en pedidos para evitar restricción de clave foránea
    try {
      if (numericId !== null) {
        await supabase.from('pedidos').update({ cliente_id: null }).eq('cliente_id', numericId);
      }
      await supabase.from('pedidos').update({ cliente_id: null }).eq('cliente_id', cleanId);
    } catch {
      // ignore
    }

    // 2. Eliminar cliente de Supabase
    let error: any = null;
    if (numericId !== null) {
      const res = await supabase.from('clientes').delete().eq('id', numericId);
      error = res.error;
    } else {
      const res = await supabase.from('clientes').delete().eq('id', cleanId);
      error = res.error;
    }

    if (error) {
      console.warn('Supabase delete client error:', error);
      throw error;
    }
    return true;
  } catch (err) {
    console.warn('Error deleting client:', err);
    return false;
  }
}

export async function deleteAllAdminClients(): Promise<boolean> {
  try {
    // 1. Desvincular cliente_id en pedidos primero para evitar violación de FK
    try {
      await supabase.from('pedidos').update({ cliente_id: null }).not('id', 'is', null);
    } catch {}

    // 2. Eliminar todos los clientes en Supabase de forma segura
    try {
      const { data: allC } = await supabase.from('clientes').select('id');
      if (allC && allC.length > 0) {
        for (const c of allC) {
          await supabase.from('clientes').delete().eq('id', c.id);
        }
        const ids = allC.map((c) => c.id);
        await supabase.from('clientes').delete().in('id', ids);
      }
      await supabase.from('clientes').delete().not('id', 'is', null);
    } catch (e) {
      console.warn('Error deleting clients table in Supabase:', e);
    }

    return true;
  } catch (err) {
    console.warn('Error in deleteAllAdminClients:', err);
    return false;
  }
}

/* ==================== CAPACIDAD Y ESPACIO SUPABASE ==================== */
export interface SupabaseCapacityStats {
  storage: {
    usedMb: number;
    freeMb: number;
    totalMb: number;
    percent: number;
    filesCount: number;
  };
  database: {
    usedMb: number;
    freeMb: number;
    totalMb: number;
    percent: number;
    totalRows: number;
    ordersCount: number;
    productsCount: number;
    clientsCount: number;
  };
}

export async function getSupabaseCapacityStats(): Promise<SupabaseCapacityStats> {
  let stats: SupabaseCapacityStats = {
    storage: {
      usedMb: 0.1,
      freeMb: 999.9,
      totalMb: 1000,
      percent: 0.01,
      filesCount: 0,
    },
    database: {
      usedMb: 1.2,
      freeMb: 498.8,
      totalMb: 500,
      percent: 0.24,
      totalRows: 0,
      ordersCount: 0,
      productsCount: 0,
      clientsCount: 0,
    },
  };

  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/storage-stats');
      if (res.ok) {
        const data = await res.json();
        stats = {
          ...stats,
          ...data,
        };
      }
    }
  } catch {}

  // Contar registros reales de Supabase
  try {
    const [{ count: pCount }, { count: prCount }, { count: cCount }] = await Promise.all([
      supabase.from('pedidos').select('*', { count: 'exact', head: true }),
      supabase.from('productos').select('*', { count: 'exact', head: true }),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
    ]);

    const ordersCount = pCount ?? stats.database.ordersCount;
    const productsCount = prCount ?? stats.database.productsCount;
    const clientsCount = cCount ?? stats.database.clientsCount;
    const totalRows = ordersCount + productsCount + clientsCount;

    // Supabase DB storage: 500MB free tier. Estimación precisa de MB ocupados
    const estDbMb = Math.max(1.0, Number(((totalRows * 2.5) / 1024 + 1.2).toFixed(2)));
    const dbLimitMb = 500;
    const dbFreeMb = Math.max(0, Number((dbLimitMb - estDbMb).toFixed(2)));
    const dbPercent = Number(((estDbMb / dbLimitMb) * 100).toFixed(2));

    stats.database = {
      usedMb: estDbMb,
      freeMb: dbFreeMb,
      totalMb: dbLimitMb,
      percent: dbPercent,
      totalRows,
      ordersCount,
      productsCount,
      clientsCount,
    };
  } catch {}

  return stats;
}

/* ==================== INVENTARIO ==================== */
export async function updateAdminStock(productId: string, newStock: number): Promise<boolean> {
  const { error } = await supabase
    .from('productos')
    .update({ stock: Math.max(0, newStock) })
    .eq('id', productId);

  if (error) throw error;
  return true;
}
