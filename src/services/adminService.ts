import { supabase } from '../lib/supabase';
import { Categoria, Producto, Pedido, Cliente, Inventario, EstadoPedido, PedidoItem, Novedad } from '../types/database';
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
import { compressImageForUpload } from '../utils/imageCompressor';
import {
  saveNovedadesToIndexedDb,
  getNovedadesFromIndexedDb,
  clearNovedadesInIndexedDb,
} from '../utils/novedadesDb';


/* ==================== SUBIDA DE IMÁGENES A SUPABASE STORAGE ==================== */
export async function uploadProductImageToStorage(file: File): Promise<string> {
  let fileToUpload = file;
  let compressedDataUrl = '';

  try {
    const compressed = await compressImageForUpload(file);
    fileToUpload = compressed.file;
    compressedDataUrl = compressed.dataUrl;
  } catch (err) {
    console.warn('Image compression warning, using raw file:', err);
  }

  const ext = fileToUpload.name ? fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
  const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const mimeType = fileToUpload.type || `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`;
  const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

  // 1. Intentar subir a Supabase Storage
  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileToUpload, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error && data) {
      const { data: pubData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (supabaseErr) {
    console.warn('Supabase product image upload warning:', supabaseErr);
  }

  // 2. Fallback a servidor local (/api/upload-image) si Supabase no está configurado
  if (compressedDataUrl) {
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compressedDataUrl,
          prefix: 'prod',
          filename: file.name,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    } catch (serverErr) {
      console.warn('Local server upload fallback error:', serverErr);
    }
  }

  // 3. Fallback DataURL final
  if (compressedDataUrl) {
    return compressedDataUrl;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
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
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete product warning:', error);
    }
  } catch (err) {
    console.warn('Error deleting product from Supabase:', err);
  }
  try {
    if (typeof window !== 'undefined') {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    }
  } catch {}
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

export async function updateOrderStatus(
  orderId: string | number,
  estado: EstadoPedido,
  existingOrder?: Pedido
): Promise<boolean> {
  const cleanId = String(orderId);
  try {
    const { error } = await supabase.from('pedidos').update({ estado }).eq('id', cleanId);
    if (error) console.warn('Supabase update status error:', error);
  } catch (err) {
    console.warn('Update order status error:', err);
  }

  // 1. SI SE ACEPTA EL PEDIDO (estado === 'confirmado'):
  // Descontar automáticamente del inventario (stock) de cada producto y registrar en ventas
  if (estado === 'confirmado' && existingOrder?.estado !== 'confirmado') {
    const itemsToDeduct = existingOrder?.items || [];
    for (const item of itemsToDeduct) {
      const prodId = String(item.producto_id || item.producto?.id || '');
      const qty = Number(item.cantidad) || 1;
      const prodName = item.producto?.nombre?.trim();

      try {
        let currentStock: number | null = null;
        let targetId = prodId;

        // Buscar producto por ID en Supabase
        if (prodId) {
          const { data: prodData } = await supabase
            .from('productos')
            .select('id, stock')
            .eq('id', prodId)
            .maybeSingle();

          if (prodData) {
            currentStock = Number(prodData.stock) || 0;
            targetId = prodData.id;
          }
        }

        // Si no se encontró por ID, intentar buscar por nombre
        if (currentStock === null && prodName) {
          const { data: prodByName } = await supabase
            .from('productos')
            .select('id, stock')
            .ilike('nombre', prodName)
            .maybeSingle();

          if (prodByName) {
            currentStock = Number(prodByName.stock) || 0;
            targetId = prodByName.id;
          }
        }

        // Si se halló en Supabase o en el objeto del pedido
        if (currentStock === null && item.producto?.stock !== undefined) {
          currentStock = Number(item.producto.stock) || 0;
        }

        if (currentStock !== null) {
          const newStock = Math.max(0, currentStock - qty);
          // Actualizar stock en Supabase
          const { error: stockErr } = await supabase
            .from('productos')
            .update({ stock: newStock })
            .eq('id', targetId);

          if (stockErr) {
            console.warn(`Error al actualizar stock para ${targetId}:`, stockErr);
          } else {
            console.log(`Inventario descontado con éxito para ${targetId}: ${currentStock} -> ${newStock}`);
          }

          // Sincronizar servidor express backup si aplica
          try {
            if (typeof window !== 'undefined') {
              fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: targetId, stock: newStock }),
              }).catch(() => {});
            }
          } catch {}
        }
      } catch (err) {
        console.warn(`Error procesando descuento de inventario para producto ${prodId}:`, err);
      }
    }

    // Invalidar caché del catálogo para que toda la tienda refleje el nuevo stock al instante
    invalidateCatalogCache();

    // Registrar explícitamente en la tabla 'ventas' de Supabase
    try {
      const saleRecord = {
        pedido_id: cleanId,
        total: Number(existingOrder?.total) || 0,
        subtotal: Number(existingOrder?.subtotal) || Number(existingOrder?.total) || 0,
        descuento: Number(existingOrder?.descuento) || 0,
        metodo_pago: existingOrder?.metodo_pago || 'efectivo',
        tipo_entrega: existingOrder?.tipo_entrega || 'delivery',
        estado: 'confirmado',
        fecha: new Date().toISOString(),
      };

      const { error: vErr } = await supabase.from('ventas').insert(saleRecord);
      if (vErr) {
        console.warn('Registro en ventas de Supabase advertencia:', vErr);
      } else {
        console.log('Venta registrada con éxito en Supabase:', cleanId);
      }
    } catch (err) {
      console.warn('Error registrando venta en tabla ventas:', err);
    }
  }

  // 2. SI SE CANCELA UN PEDIDO QUE YA ESTABA CONFIRMADO:
  // Restaurar el stock al inventario
  if (estado === 'cancelado' && existingOrder?.estado === 'confirmado') {
    const itemsToRestore = existingOrder?.items || [];
    for (const item of itemsToRestore) {
      const prodId = String(item.producto_id || item.producto?.id || '');
      const qty = Number(item.cantidad) || 1;
      if (prodId) {
        try {
          const { data: prodData } = await supabase
            .from('productos')
            .select('id, stock')
            .eq('id', prodId)
            .maybeSingle();

          if (prodData) {
            const restoredStock = (Number(prodData.stock) || 0) + qty;
            await supabase.from('productos').update({ stock: restoredStock }).eq('id', prodId);
          }
        } catch {}
      }
    }
    invalidateCatalogCache();
    try {
      await supabase.from('ventas').delete().eq('pedido_id', cleanId);
    } catch {}
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
    totalImagesCount: number;
    productImagesCount: number;
    voucherImagesCount: number;
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
      totalImagesCount: 0,
      productImagesCount: 0,
      voucherImagesCount: 0,
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

  // Contar registros e imágenes reales en Supabase sin alterar nada
  try {
    const [{ count: pCount }, { count: prCount }, { count: cCount }, { data: prodsImages }, { data: ordersVouchers }] = await Promise.all([
      supabase.from('pedidos').select('*', { count: 'exact', head: true }),
      supabase.from('productos').select('*', { count: 'exact', head: true }),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('productos').select('imagen_url, imagenes'),
      supabase.from('pedidos').select('comprobante_pago'),
    ]);

    let productImagesCount = 0;
    if (prodsImages) {
      prodsImages.forEach((p) => {
        if (p.imagen_url && typeof p.imagen_url === 'string' && p.imagen_url.trim()) {
          productImagesCount++;
        }
        if (Array.isArray(p.imagenes)) {
          productImagesCount += p.imagenes.filter((img: any) => typeof img === 'string' && img.trim()).length;
        }
      });
    }

    let voucherImagesCount = stats.storage.filesCount || 0;
    if (ordersVouchers) {
      const dbVouchers = ordersVouchers.filter((o) => o.comprobante_pago && typeof o.comprobante_pago === 'string' && o.comprobante_pago.trim()).length;
      voucherImagesCount = Math.max(voucherImagesCount, dbVouchers);
    }

    const totalImagesCount = productImagesCount + voucherImagesCount;

    // Calcular tamaño real del almacenamiento (Supabase Storage: 1 GB = 1000 MB)
    // Promedio por foto de producto en Supabase Storage: ~380 KB (0.38 MB)
    // Comprobantes y assets: ~300 KB (0.30 MB)
    const estStorageMb = Number(((productImagesCount * 0.38) + (voucherImagesCount * 0.30) + (stats.storage.usedMb || 0)).toFixed(2));
    const storageLimitMb = 1000;
    const storageFreeMb = Math.max(0, Number((storageLimitMb - estStorageMb).toFixed(2)));
    const storagePercent = Number(((estStorageMb / storageLimitMb) * 100).toFixed(2));

    stats.storage = {
      usedMb: estStorageMb,
      freeMb: storageFreeMb,
      totalMb: storageLimitMb,
      percent: storagePercent,
      totalImagesCount,
      productImagesCount,
      voucherImagesCount,
      filesCount: totalImagesCount,
    };

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

/* ==================== NOVEDADES & STORAGE DELETION ==================== */

// Lista vacía por defecto para que no aparezcan fotos demo no deseadas
export const DEFAULT_NOVEDADES: Novedad[] = [];

/**
 * Notifica a toda la aplicación (tienda pública, cabecera, componentes)
 * que las novedades han cambiado para sincronizar la vista al instante.
 */
export function notifyNovedadesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('novedades-updated'));
  }
}

/**
 * Elimina físicamente un archivo de Supabase Storage a partir de su URL pública.
 * Soporta cualquier bucket ('novedades', 'product-images', etc.)
 */
export async function deleteSupabaseStorageFile(url?: string | null): Promise<boolean> {
  if (!url || typeof url !== 'string') return false;
  try {
    const marker = '/storage/v1/object/public/';
    if (!url.includes(marker)) return false;

    const parts = url.split(marker)[1];
    if (!parts) return false;

    const slashIdx = parts.indexOf('/');
    if (slashIdx === -1) return false;

    const bucket = parts.substring(0, slashIdx);
    const rawFilePath = parts.substring(slashIdx + 1);
    const filePath = decodeURIComponent(rawFilePath.split('?')[0]); // Quitar query params si existen

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.warn(`Supabase Storage remove warning (${bucket}/${filePath}):`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error deleting file from Supabase Storage:', err);
    return false;
  }
}

/* ==================== NOVEDADES STORAGE & MULTI-TIER SYNC ==================== */
const NOVEDADES_STORAGE_KEY = 'pretty_store_novedades_v2';
let memoryNovedades: Novedad[] = [];

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getApiUrl(apiPath: string): string {
  if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) return apiPath;
  const cleanPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (typeof window !== 'undefined') {
    return cleanPath;
  }
  return `http://127.0.0.1:${process.env.PORT || 3000}${cleanPath}`;
}

export function getLocalNovedades(): Novedad[] {
  if (typeof window === 'undefined') return memoryNovedades;
  try {
    const raw = localStorage.getItem(NOVEDADES_STORAGE_KEY);
    if (!raw) return memoryNovedades;
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    if (list.length > 0) memoryNovedades = list;
    return list;
  } catch {
    return memoryNovedades;
  }
}

export function setLocalNovedades(items: Novedad[]): void {
  memoryNovedades = items;
  if (typeof window === 'undefined') return;

  // 1. Guardar en localStorage
  try {
    localStorage.setItem(NOVEDADES_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage limit note:', e);
  }

  // 2. Guardar en IndexedDB
  saveNovedadesToIndexedDb(items).catch((err) => {
    console.warn('IndexedDB save warning:', err);
  });
}

/**
 * Verifica en tiempo real si la tabla 'novedades' y el bucket 'novedades' existen en Supabase.
 */
export async function checkSupabaseNovedadesStatus(): Promise<{
  tableExists: boolean;
  bucketExists: boolean;
  message?: string;
}> {
  let tableExists = false;
  let bucketExists = false;

  try {
    const { error } = await supabase.from('novedades').select('id').limit(1);
    tableExists = !error;
  } catch {
    tableExists = false;
  }

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (Array.isArray(buckets)) {
      bucketExists = buckets.some((b) => b.name === 'novedades');
    }
  } catch {
    bucketExists = false;
  }

  return { tableExists, bucketExists };
}

/**
 * Sube una foto de novedad desde el dispositivo.
 * Guarda en el servidor permanente (/uploads/images/) y en Supabase Storage si está disponible.
 * Devuelve una URL accesible globalmente desde cualquier dispositivo móvil o computadora.
 */
export async function uploadNovedadImageToStorage(file: File): Promise<string> {
  let compressedDataUrl = '';

  try {
    const compressed = await compressImageForUpload(file, 1600, 0.82);
    compressedDataUrl = compressed.dataUrl;
  } catch (err) {
    console.warn('Compression warning in uploadNovedadImageToStorage:', err);
  }

  // Si no se obtuvo dataUrl por compresión, leer directamente del archivo
  if (!compressedDataUrl) {
    compressedDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    });
  }

  // 1. SUBIR AL SERVIDOR LOCAL /api/upload-image (PERSISTENTE EN DISCO PARA TODOS LOS DISPOSITIVOS)
  let serverUploadedUrl: string | null = null;
  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: compressedDataUrl,
        prefix: 'nov',
        filename: file.name,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.url) {
        serverUploadedUrl = json.url;
      }
    }
  } catch (serverErr) {
    console.warn('Server upload error for novedad:', serverErr);
  }

  // 2. INTENTAR SUBIR A SUPABASE STORAGE EN PARALELO
  try {
    const ext = file.name ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const mimeType = file.type || `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`;
    const fileName = `nov_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

    const { data, error } = await supabase.storage
      .from('novedades')
      .upload(fileName, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error && data) {
      const { data: pubData } = supabase.storage.from('novedades').getPublicUrl(fileName);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch {
    // Continuar con el URL del servidor
  }

  // Si el servidor guardó la foto en disco, usar su URL permanente
  if (serverUploadedUrl) {
    return serverUploadedUrl;
  }

  // Fallback si la subida falló: devolver el DataURL comprimido
  return compressedDataUrl;
}

/**
 * Obtiene todas las novedades para el panel de administración y la tienda pública.
 * Sincroniza en tiempo real:
 *  1. Servidor Express (/api/novedades en disco para persistencia multi-dispositivo)
 *  2. Supabase Cloud Database
 *  3. Almacenamiento local (IndexedDB + localStorage)
 */
export async function getAdminNovedades(): Promise<Novedad[]> {
  const localList = getLocalNovedades();
  const idbList = await getNovedadesFromIndexedDb().catch(() => []);

  // 1. Obtener lista desde el servidor en Express (servidor compartido entre todos los dispositivos)
  let serverList: Novedad[] = [];
  try {
    const res = await fetch(`/api/novedades?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Pragma: 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        serverList = data;
      }
    }
  } catch (err) {
    console.warn('Error fetching /api/novedades:', err);
  }

  // 2. Obtener lista desde Supabase Cloud con timeout seguro de 2s
  let supabaseList: Novedad[] = [];
  try {
    const supabasePromise = supabase
      .from('novedades')
      .select('*')
      .order('orden', { ascending: true });

    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase timeout')), 2000)
    );

    const { data, error } = (await Promise.race([supabasePromise, timeoutPromise])) as any;
    if (!error && Array.isArray(data) && data.length > 0) {
      supabaseList = data;
    }
  } catch {
    // Supabase no configurado o permisos no concedidos
  }

  // 3. Fusionar datos de todas las fuentes garantizando persistencia
  const mergedMap = new Map<string, Novedad>();

  // Prioridad 1: Supabase si tiene novedades
  for (const item of supabaseList) {
    if (item && item.id) mergedMap.set(String(item.id), item);
  }

  // Prioridad 2: Servidor permanente
  for (const item of serverList) {
    if (item && item.id) {
      if (!mergedMap.has(String(item.id))) {
        mergedMap.set(String(item.id), item);
      }
    }
  }

  // Prioridad 3: Elementos guardados localmente en este dispositivo que no hayan sincronizado
  const unsyncedItems: Novedad[] = [];
  for (const item of idbList) {
    if (item && item.id && !mergedMap.has(String(item.id))) {
      mergedMap.set(String(item.id), item);
      unsyncedItems.push(item);
    }
  }
  for (const item of localList) {
    if (item && item.id && !mergedMap.has(String(item.id))) {
      mergedMap.set(String(item.id), item);
      unsyncedItems.push(item);
    }
  }

  // Si había elementos locales no sincronizados con el servidor, sincronizarlos ahora
  if (unsyncedItems.length > 0) {
    fetch('/api/novedades/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: unsyncedItems }),
    }).catch(() => {});
  }

  const finalResult = Array.from(mergedMap.values()).sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
  );

  // Actualizar caché local para renderizado instantáneo en este dispositivo
  setLocalNovedades(finalResult);

  return finalResult;
}

/**
 * Obtiene las novedades activas (visibles) para la tienda pública.
 */
export async function getPublicNovedades(): Promise<Novedad[]> {
  const all = await getAdminNovedades();
  return all.filter((n) => Boolean(n && n.activo));
}

/**
 * Crea una nueva novedad y la persiste inmediatamente en el servidor para todos los dispositivos.
 */
export async function createAdminNovedad(novedad: Partial<Novedad>): Promise<Novedad> {
  const newId = novedad.id && novedad.id.length >= 10 ? novedad.id : generateUUID();

  let payload: Novedad = {
    id: newId,
    titulo: novedad.titulo || null,
    subtitulo: novedad.subtitulo || null,
    badge: novedad.badge || null,
    imagen_url: novedad.imagen_url || '',
    enlace_url: novedad.enlace_url || '#catalogo',
    orden: typeof novedad.orden === 'number' ? novedad.orden : 0,
    activo: novedad.activo !== undefined ? novedad.activo : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Guardar de inmediato en el servidor Express (para que cualquier otro dispositivo la vea)
  try {
    const res = await fetch('/api/novedades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.item) {
        payload = data.item;
      }
    }
  } catch (serverErr) {
    console.warn('Error saving novelty to server:', serverErr);
  }

  // 2. Guardar en memoria, localStorage e IndexedDB en este dispositivo
  const current = getLocalNovedades();
  const next = [...current.filter((n) => n.id !== payload.id), payload].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
  );
  setLocalNovedades(next);
  notifyNovedadesChanged();

  // 3. Guardar en Supabase Database si está configurada la tabla
  try {
    await supabase.from('novedades').insert(payload);
  } catch (sbErr) {
    console.warn('Supabase insert novedad note:', sbErr);
  }

  notifyNovedadesChanged();
  return payload;
}

/**
 * Actualiza una novedad existente y la sincroniza con el servidor y Supabase.
 */
export async function updateAdminNovedad(id: string, updates: Partial<Novedad>): Promise<Novedad> {
  const current = getLocalNovedades();
  const existing = current.find((n) => n.id === id);

  let payload: Novedad = {
    id,
    titulo: updates.titulo !== undefined ? updates.titulo : existing?.titulo || null,
    subtitulo: updates.subtitulo !== undefined ? updates.subtitulo : existing?.subtitulo || null,
    badge: updates.badge !== undefined ? updates.badge : existing?.badge || null,
    imagen_url: updates.imagen_url !== undefined ? updates.imagen_url : existing?.imagen_url || '',
    enlace_url: updates.enlace_url !== undefined ? updates.enlace_url : existing?.enlace_url || '#catalogo',
    orden: typeof updates.orden === 'number' ? updates.orden : existing?.orden ?? 0,
    activo: updates.activo !== undefined ? updates.activo : existing?.activo ?? true,
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Guardar en servidor Express
  try {
    const res = await fetch(`/api/novedades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.item) {
        payload = data.item;
      }
    }
  } catch (serverErr) {
    console.warn('Error updating novelty on server:', serverErr);
  }

  // 2. Guardar en memoria, localStorage e IndexedDB
  const next = current.map((n) => (n.id === id ? payload : n)).sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
  );
  setLocalNovedades(next);
  notifyNovedadesChanged();

  // 3. Actualizar en Supabase si existe la tabla
  try {
    await supabase.from('novedades').update(payload).eq('id', id);
  } catch {}

  notifyNovedadesChanged();
  return payload;
}

/**
 * Alterna la visibilidad (oculto / visible) de una novedad.
 */
export async function toggleNovedadVisibility(id: string, activo: boolean): Promise<boolean> {
  const current = getLocalNovedades();
  const next = current.map((n) =>
    n.id === id ? { ...n, activo, updated_at: new Date().toISOString() } : n
  );
  setLocalNovedades(next);
  notifyNovedadesChanged();

  try {
    await fetch(`/api/novedades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo, updated_at: new Date().toISOString() }),
    });
  } catch {}

  try {
    await supabase
      .from('novedades')
      .update({ activo, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {}

  notifyNovedadesChanged();
  return true;
}

/**
 * Elimina una novedad de todos los dispositivos (Servidor, IndexedDB, localStorage y Supabase).
 */
export async function deleteAdminNovedad(id: string, imagenUrl?: string | null): Promise<boolean> {
  // 1. Eliminar en memoria y local
  const current = getLocalNovedades();
  const next = current.filter((n) => n.id !== id);
  setLocalNovedades(next);
  notifyNovedadesChanged();

  // 2. Eliminar del servidor permanente
  try {
    await fetch(`/api/novedades/${id}`, { method: 'DELETE' });
  } catch {}

  // 3. Eliminar de Supabase Database
  try {
    await supabase.from('novedades').delete().eq('id', id);
  } catch {}

  // 4. Eliminar imagen de Supabase Storage si aplica
  if (imagenUrl) {
    try {
      await deleteSupabaseStorageFile(imagenUrl);
    } catch {}
  }

  notifyNovedadesChanged();
  return true;
}

/**
 * Elimina todas las novedades de la tienda en todos los dispositivos.
 */
export async function deleteAllAdminNovedades(): Promise<boolean> {
  setLocalNovedades([]);
  clearNovedadesInIndexedDb().catch(() => {});
  notifyNovedadesChanged();

  try {
    await fetch('/api/novedades', { method: 'DELETE' });
  } catch {}

  try {
    await supabase.from('novedades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch {}

  notifyNovedadesChanged();
  return true;
}

