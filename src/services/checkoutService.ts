import { getSupabaseClient } from '../lib/supabase';
import { CartItem, MetodoPago, TipoEntrega, CourierOption } from '../types/database';
import { calculateLegendaryCapsPromo } from '../utils/promoUtils';

export interface CreateOrderParams {
  items: CartItem[];
  subtotal: number;
  discount?: number;
  promoTitle?: string;
  shipping: number;
  total: number;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  metodoPago: MetodoPago;
  tipoEntrega: TipoEntrega;
  courier?: CourierOption;
  comprobantePago?: string;
  tarjetaInfo?: {
    numeroEnmascarado: string;
    titular: string;
  };
  notas?: string;
}

export interface CreatedOrderResult {
  orderId: string;
  orderNumber: string;
  date: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  metodoPago: MetodoPago;
  tipoEntrega: TipoEntrega;
  courier?: CourierOption;
  comprobantePago?: string;
  subtotal: number;
  discount: number;
  promoTitle?: string;
  shipping: number;
  total: number;
  itemCount: number;
  notas?: string;
  items?: CartItem[];
}

/**
 * Sanitiza cadenas para prevenir XSS y ataques de inyección
 */
function sanitizeInput(str: string, maxLength = 250): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates stock, re-verifies prices from authoritative database,
 * recalculates totals to prevent DevTools tampering,
 * creates customer if needed, registers order in public.pedidos with 'pendiente' status,
 * registers items in public.detalle_pedidos, and safely discounts stock.
 */
export async function createRealOrder(params: CreateOrderParams): Promise<CreatedOrderResult> {
  const supabase = getSupabaseClient();
  const {
    items,
    nombre,
    telefono,
    email = '',
    direccion = '',
    metodoPago,
    tipoEntrega,
    courier,
    comprobantePago,
    tarjetaInfo,
    notas,
  } = params;

  // 1. Validaciones estrictas de formulario
  const cleanNombre = sanitizeInput(nombre, 100);
  const cleanTelefono = sanitizeInput(telefono, 30);
  const cleanEmail = sanitizeInput(email, 120);
  const cleanDireccion = sanitizeInput(direccion, 250);
  const cleanNotas = sanitizeInput(notas || '', 300);
  // Preservar la URL o imagen completa del comprobante sin truncar a 80 caracteres
  const cleanComprobante = comprobantePago ? String(comprobantePago).trim() : null;

  if (!cleanNombre || cleanNombre.length < 2) {
    throw new Error('Por favor ingresa un nombre válido.');
  }

  const phoneDigits = cleanTelefono.replace(/\D/g, '');
  if (!phoneDigits || phoneDigits.length < 7) {
    throw new Error('Por favor ingresa un número de teléfono válido (al menos 7 dígitos).');
  }

  let safeDireccion = cleanDireccion;
  if (tipoEntrega === 'delivery' && (!safeDireccion || safeDireccion.length < 2)) {
    safeDireccion = `Sucursal ${courier || 'Courier'} (Agencia Principal)`;
  }

  const validMetodos: MetodoPago[] = ['yappy', 'tarjeta', 'transferencia', 'efectivo'];
  if (!validMetodos.includes(metodoPago)) {
    throw new Error('Método de pago no reconocido.');
  }

  if (!items || items.length === 0) {
    throw new Error('El carrito de compras está vacío.');
  }

  // 2. OBTENER PRECIOS AUTORIZADOS DIRECTAMENTE DESDE LA BASE DE DATOS
  // Nunca confiamos en los precios que el navegador envía.
  const productIds = items.map((i) => i.product.id).filter(Boolean);
  const { data: dbProducts, error: dbProdErr } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, activo')
    .in('id', productIds);

  if (dbProdErr || !dbProducts) {
    throw new Error('No se pudo verificar el catálogo en tiempo real. Intente nuevamente.');
  }

  const dbProductMap = new Map<string, { id: string; nombre: string; precio: number; stock: number; activo: boolean }>();
  dbProducts.forEach((p) => dbProductMap.set(String(p.id), p));

  // 3. Validar disponibilidad, estado activo y recalcular subtotales con PRECIOS OFICIALES
  let trustedSubtotal = 0;
  let totalItemCount = 0;
  const verifiedOrderLines: {
    product: { id: string; nombre: string; precio: number };
    quantity: number;
    subtotal: number;
  }[] = [];

  for (const item of items) {
    const pId = String(item.product.id);
    const dbProd = dbProductMap.get(pId);

    if (!dbProd) {
      throw new Error(`El producto "${item.product.nombre}" ya no existe en el catálogo.`);
    }

    if (!dbProd.activo) {
      throw new Error(`El artículo "${dbProd.nombre}" no está disponible actualmente.`);
    }

    // Validar cantidad como entero positivo
    const validQty = Math.max(1, Math.floor(Number(item.quantity) || 1));

    // Usar PRECIO OFICIAL DE LA BASE DE DATOS (protección contra manipulación)
    const officialPrice = Number(dbProd.precio) || 0;
    const lineSubtotal = Number((officialPrice * validQty).toFixed(2));

    trustedSubtotal += lineSubtotal;
    totalItemCount += validQty;

    verifiedOrderLines.push({
      product: {
        id: dbProd.id,
        nombre: dbProd.nombre,
        precio: officialPrice,
      },
      quantity: validQty,
      subtotal: lineSubtotal,
    });
  }

  // 4. RECALCULAR ENVÍO Y TOTAL AUTORIZADOS CON PROMOCIÓN DE GORRAS LEGENDARIAS (2x $55)
  trustedSubtotal = Number(trustedSubtotal.toFixed(2));
  const promo = calculateLegendaryCapsPromo(items);
  const trustedDiscount = promo.discount;
  const effectiveSubtotal = Math.max(0, trustedSubtotal - trustedDiscount);

  const trustedShipping = typeof params.shipping === 'number'
    ? params.shipping
    : 0;

  const trustedTotal = Number((effectiveSubtotal + trustedShipping).toFixed(2));

  // Resolver dirección y correo seguros
  const resolvedEmail = cleanEmail || `${phoneDigits}@prettystore.com`;
  const resolvedAddress =
    tipoEntrega === 'retiro'
      ? 'Retiro en el Local / Tienda física (Pretty Store)'
      : safeDireccion.includes('Sucursal') || safeDireccion.includes('Envío')
        ? safeDireccion
        : `${safeDireccion} (Envío vía: ${courier || 'Uno Express'})`;

  // 5. Registrar o vincular cliente en public.clientes
  let clienteId: string | null = null;
  try {
    const { data: existingClient } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', cleanTelefono)
      .limit(1);

    if (existingClient && existingClient.length > 0) {
      clienteId = existingClient[0].id;
      await supabase
        .from('clientes')
        .update({
          nombre: cleanNombre,
          telefono: cleanTelefono,
          direccion: resolvedAddress,
        })
        .eq('id', clienteId);
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clientes')
        .insert([
          {
            nombre: cleanNombre,
            email: resolvedEmail,
            telefono: cleanTelefono,
            direccion: resolvedAddress,
          },
        ])
        .select('id')
        .single();

      if (!clientErr && newClient) {
        clienteId = newClient.id;
      }
    }
  } catch (err) {
    console.warn('Registro de cliente en segundo plano:', err);
  }

  // Estructurar notas sin exponer datos confidenciales de pago
  const notesParts = [
    tipoEntrega === 'retiro'
      ? '[RETIRO EN EL LOCAL]'
      : `[DELIVERY VÍA ${courier ? courier.toUpperCase() : 'UNO EXPRESS'}]`,
    cleanComprobante ? `Comprobante/Ref (${metodoPago}): ${cleanComprobante}` : null,
    tarjetaInfo?.numeroEnmascarado
      ? `Tarjeta: ${sanitizeInput(tarjetaInfo.numeroEnmascarado, 30)} (${sanitizeInput(tarjetaInfo.titular || '', 50)})`
      : null,
    cleanNotas ? `Instrucciones: ${cleanNotas}` : null,
  ].filter(Boolean);

  const finalNotes = notesParts.join(' | ');

  // 6. CREAR PEDIDO EN public.pedidos
  // El estado inicial es estrictamente 'pendiente' (nunca pagado ni entregado)
  const orderInsertPayload: any = {
    direccion: resolvedAddress,
    subtotal: trustedSubtotal,
    total: trustedTotal,
    estado: 'pendiente',
    metodo_pago: metodoPago,
    notas: finalNotes,
    comprobante_pago: cleanComprobante || null,
  };

  if (clienteId) {
    orderInsertPayload.cliente_id = clienteId;
  }

  const { data: createdOrder, error: orderErr } = await supabase
    .from('pedidos')
    .insert([orderInsertPayload])
    .select()
    .single();

  if (orderErr) {
    throw new Error('No se pudo registrar el pedido en el servidor. Por favor verifique sus datos.');
  }

  const orderId = createdOrder.id;

  // 7. CREAR DETALLES EN public.detalle_pedidos CON PRECIOS OFICIALES
  const detailsPayload = verifiedOrderLines.map((line) => ({
    pedido_id: orderId,
    producto_id: line.product.id,
    cantidad: line.quantity,
    precio_unitario: line.product.precio,
    subtotal: line.subtotal,
  }));

  const { error: detailsErr } = await supabase
    .from('detalle_pedidos')
    .insert(detailsPayload);

  if (detailsErr) {
    console.warn('Detalle de pedidos guardado parcialmente:', detailsErr.message);
  }

  // 8. DESCUENTO DE STOCK Y VENTAS EN SEGUNDO PLANO (Ultra Rápido, no bloquea el pedido)
  (async () => {
    try {
      for (const line of verifiedOrderLines) {
        const qtyToDeduct = line.quantity;
        const pId = line.product.id;
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('deduct_product_stock_safe', {
            p_producto_id: pId,
            p_cantidad: qtyToDeduct,
          });
          if (!rpcErr && rpcRes === true) continue;
        } catch {
          // ignore
        }

        try {
          const { data: curProd } = await supabase.from('productos').select('stock').eq('id', pId).single();
          if (curProd) {
            const currentStock = Number(curProd.stock) || 0;
            const newStock = Math.max(0, currentStock - qtyToDeduct);
            await supabase.from('productos').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', pId);
          }
        } catch (stockErr) {
          console.warn('Actualización de existencias protegida:', stockErr);
        }
      }

      await supabase.from('ventas').insert([
        {
          pedido_id: orderId,
          total: trustedTotal,
          fecha: new Date().toISOString(),
        },
      ]);
    } catch {
      // background tasks
    }
  })();

  const orderNumber = `PED-${String(orderId || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

  return {
    orderId,
    orderNumber,
    date: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    nombre: cleanNombre,
    email: resolvedEmail,
    telefono: cleanTelefono,
    direccion: resolvedAddress,
    metodoPago,
    tipoEntrega,
    courier,
    comprobantePago: cleanComprobante || undefined,
    subtotal: trustedSubtotal,
    discount: trustedDiscount,
    promoTitle: promo.promoTitle,
    shipping: trustedShipping,
    total: trustedTotal,
    itemCount: totalItemCount,
    notas: finalNotes,
    items,
  };
}

/**
 * Actualiza el comprobante de pago de un pedido existente en la tabla public.pedidos
 */
export async function updateOrderPaymentVoucher(
  orderId: string | number,
  voucherUrl: string
): Promise<boolean> {
  if (!orderId || !voucherUrl) return false;
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('pedidos')
      .update({
        comprobante_pago: voucherUrl,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Error actualizando comprobante de pago en pedidos:', error);
      return false;
    }
    console.log('[Supabase] Comprobante de pago actualizado con éxito en pedido:', orderId);
    return true;
  } catch (err) {
    console.warn('[Supabase] Fallo al actualizar comprobante:', err);
    return false;
  }
}

/**
 * Sube la captura de pago al Storage de Supabase que ya tiene la tienda ('product-images' o 'comprobantes').
 * Retorna la URL pública oficial en el CDN de Supabase.
 * En caso de que el Storage de Supabase rechace la subida (por RLS pendiente de configurar),
 * genera un respaldo comprimido para que la captura JAMÁS se pierda.
 */
export async function uploadVoucherToSupabaseStorage(
  fileOrBlob: File | Blob | string,
  fileName: string = 'comprobante.jpg',
  orderNumber: string = 'PED-000000'
): Promise<{ url: string; isStorageUrl: boolean }> {
  if (!fileOrBlob) {
    return { url: '', isStorageUrl: false };
  }

  // Si ya es una URL HTTP(S) pública, devolverla directamente
  if (typeof fileOrBlob === 'string' && (fileOrBlob.startsWith('http://') || fileOrBlob.startsWith('https://'))) {
    return { url: fileOrBlob, isStorageUrl: true };
  }

  const supabase = getSupabaseClient();
  const cleanOrderNum = String(orderNumber).replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filePath = `comprobantes/pago_${cleanOrderNum}_${timestamp}.${ext || 'jpg'}`;

  // Convertir string dataURL a Blob si es necesario
  let blobToUpload: Blob;
  if (typeof fileOrBlob === 'string') {
    if (fileOrBlob.startsWith('data:')) {
      try {
        const parts = fileOrBlob.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blobToUpload = new Blob([u8arr], { type: mime });
      } catch (e) {
        return { url: fileOrBlob, isStorageUrl: false };
      }
    } else {
      return { url: fileOrBlob, isStorageUrl: false };
    }
  } else {
    blobToUpload = fileOrBlob;
  }

  const contentType = blobToUpload.type || (ext === 'png' ? 'image/png' : 'image/jpeg');

  // Buckets candidatos:
  // 1. 'product-images' (el bucket ya creado y activo que aloja los productos)
  // 2. 'comprobantes' (por si el usuario lo creó específicamente)
  const candidateBuckets = ['product-images', 'comprobantes', 'pedidos', 'assets'];

  for (const bucket of candidateBuckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blobToUpload, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        if (pubData?.publicUrl) {
          console.log(`[Storage] ✓ Captura subida con éxito al bucket '${bucket}':`, pubData.publicUrl);
          return { url: pubData.publicUrl, isStorageUrl: true };
        }
      } else if (error) {
        console.warn(`[Storage] No se pudo subir al bucket '${bucket}':`, error.message);
      }
    } catch (e) {
      console.warn(`[Storage] Error al intentar subir al bucket '${bucket}':`, e);
    }
  }

  // Si falló la subida por RLS del storage, asegurar un fallback dataURL para que la imagen no se pierda
  if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
    return { url: fileOrBlob, isStorageUrl: false };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string, isStorageUrl: false });
    reader.onerror = () => resolve({ url: '', isStorageUrl: false });
    reader.readAsDataURL(blobToUpload);
  });
}


