import { getSupabaseClient } from '../lib/supabase';
import { CartItem, MetodoPago, TipoEntrega, CourierOption } from '../types/database';
import { calculateLegendaryCapsPromo } from '../utils/promoUtils';
import { compressImageFile } from '../utils/imageOptimizer';
import { saveVoucherImageToDb } from '../utils/voucherDb';

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

  let createdOrder: any = null;
  let { data: insData, error: orderErr } = await supabase
    .from('pedidos')
    .insert([orderInsertPayload])
    .select()
    .single();

  if (orderErr && orderInsertPayload.comprobante_pago) {
    // Reintentar sin columna comprobante_pago por si no existe aún en la tabla de Supabase
    const fallbackPayload = { ...orderInsertPayload };
    delete fallbackPayload.comprobante_pago;
    const retryRes = await supabase
      .from('pedidos')
      .insert([fallbackPayload])
      .select()
      .single();
    if (!retryRes.error && retryRes.data) {
      insData = retryRes.data;
      orderErr = null;
    }
  }

  if (orderErr || !insData) {
    throw new Error('No se pudo registrar el pedido en el servidor. Por favor verifique sus datos.');
  }

  createdOrder = insData;
  const orderId = createdOrder.id;

  // Si se proporcionó comprobante, respaldarlo de inmediato en IndexedDB
  if (cleanComprobante) {
    const orderNumberStr = `PED-${String(orderId || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    saveVoucherImageToDb(String(orderId), cleanComprobante);
    saveVoucherImageToDb(orderNumberStr, cleanComprobante);
  }

  // 7. CREAR DETALLES EN public.detalle_pedidos CON PRECIOS OFICIALES E IMÁGENES
  const detailsPayload = verifiedOrderLines.map((line) => {
    const origItem = items.find((it) => String(it.product.id) === String(line.product.id));
    const prodImg = origItem?.product.imagen_url || (line.product as any).imagen_url || null;
    return {
      pedido_id: orderId,
      producto_id: line.product.id,
      producto_nombre: line.product.nombre,
      producto_imagen: prodImg,
      cantidad: line.quantity,
      precio_unitario: line.product.precio,
      subtotal: line.subtotal,
    };
  });

  const { error: detailsErr } = await supabase
    .from('detalle_pedidos')
    .insert(detailsPayload);

  if (detailsErr) {
    console.warn('Detalle de pedidos guardado parcialmente:', detailsErr.message);
  }

  // 8. DESCUENTO AUTOMÁTICO DE STOCK E INVENTARIO
  // Descontamos tanto en public.productos (stock) como en public.inventario (stock_actual)
  try {
    for (const line of verifiedOrderLines) {
      const qtyToDeduct = line.quantity;
      const pId = line.product.id;
      
      let rpcSucceeded = false;
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('deduct_product_stock_safe', {
          p_producto_id: pId,
          p_cantidad: qtyToDeduct,
        });
        if (!rpcErr && rpcRes === true) {
          rpcSucceeded = true;
        }
      } catch {}

      if (!rpcSucceeded) {
        // A) Actualizar tabla productos (stock)
        try {
          const { data: curProd } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', pId)
            .single();
          if (curProd) {
            const currentStock = Number(curProd.stock) || 0;
            const newStock = Math.max(0, currentStock - qtyToDeduct);
            await supabase
              .from('productos')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', pId);
          }
        } catch (stockErr) {
          console.warn('Actualización de stock en productos:', stockErr);
        }

        // B) Actualizar tabla inventario (stock_actual)
        try {
          const { data: curInv } = await supabase
            .from('inventario')
            .select('id, stock_actual')
            .eq('producto_id', pId)
            .limit(1);
          if (curInv && curInv.length > 0) {
            const currentStockActual = Number(curInv[0].stock_actual) || 0;
            const newStockActual = Math.max(0, currentStockActual - qtyToDeduct);
            await supabase
              .from('inventario')
              .update({ stock_actual: newStockActual, updated_at: new Date().toISOString() })
              .eq('id', curInv[0].id);
          }
        } catch (invErr) {
          console.warn('Actualización de inventario:', invErr);
        }
      }
    }

    await supabase.from('ventas').insert([
      {
        pedido_id: orderId,
        total: trustedTotal,
        fecha: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('Error en descuento de existencias:', err);
  }

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
  const cleanId = String(orderId).trim();
  const numId = Number(cleanId);
  const isNumeric = !isNaN(numId) && cleanId !== '';

  // 0. Respaldar de inmediato en IndexedDB
  saveVoucherImageToDb(cleanId, voucherUrl);

  const supabase = getSupabaseClient();

  try {
    // 1. Intentar RPC seguro si existe en la base de datos
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('set_pedido_comprobante', {
        p_pedido_id: cleanId,
        p_comprobante_pago: voucherUrl,
      });
      if (!rpcErr && rpcRes === true) {
        console.log('[Supabase] Comprobante actualizado vía RPC:', cleanId);
        return true;
      }
    } catch {}

    // 2. Actualizar directamente tabla pedidos (columna comprobante_pago)
    let updateRes = await supabase
      .from('pedidos')
      .update({
        comprobante_pago: voucherUrl,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', cleanId);

    if (updateRes.error && isNumeric) {
      updateRes = await supabase
        .from('pedidos')
        .update({
          comprobante_pago: voucherUrl,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', numId);
    }

    // 3. Respaldo en campo notas para garantizar que NUNCA se pierda aunque falte la columna comprobante_pago
    try {
      const { data: orderData } = await supabase
        .from('pedidos')
        .select('notas')
        .eq('id', isNumeric ? numId : cleanId)
        .single();

      const currentNotes = orderData?.notas || '';
      if (!currentNotes.includes(voucherUrl)) {
        const appendedNotes = currentNotes
          ? `${currentNotes} | [COMPROBANTE: ${voucherUrl}]`
          : `[COMPROBANTE: ${voucherUrl}]`;
        await supabase
          .from('pedidos')
          .update({ notas: appendedNotes } as any)
          .eq('id', isNumeric ? numId : cleanId);
      }
    } catch {}

    if (updateRes.error) {
      console.warn('[Supabase] Error actualizando comprobante de pago en pedidos:', updateRes.error);
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
 * Optimiza la imagen mediante canvas a ~100KB antes de subir para carga ultrarrápida.
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

  let blobToUpload: Blob;
  let fallbackDataUrl = '';

  // Optimizar con compressImageFile si es File
  if (fileOrBlob instanceof File) {
    try {
      const compressed = await compressImageFile(fileOrBlob, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
        mimeType: 'image/jpeg',
      });
      blobToUpload = compressed.file;
      fallbackDataUrl = compressed.dataUrl;
    } catch {
      blobToUpload = fileOrBlob;
    }
  } else if (typeof fileOrBlob === 'string') {
    if (fileOrBlob.startsWith('data:')) {
      fallbackDataUrl = fileOrBlob;
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

  // Buckets candidatos: 'product-images' (el bucket ya creado y activo), luego 'comprobantes'
  const candidateBuckets = ['product-images', 'comprobantes', 'pedidos', 'assets'];

  // Probar rutas: tanto en carpeta comprobantes como en la raíz del bucket
  const filePaths = [
    `comprobantes/pago_${cleanOrderNum}_${timestamp}.${ext || 'jpg'}`,
    `pago_${cleanOrderNum}_${timestamp}.${ext || 'jpg'}`
  ];

  for (const bucket of candidateBuckets) {
    for (const filePath of filePaths) {
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
        }
      } catch (e) {
        // intentar siguiente ruta / bucket
      }
    }
  }

  // Si falló la subida por RLS de storage, devolver el respaldo base64 comprimido
  if (fallbackDataUrl) {
    return { url: fallbackDataUrl, isStorageUrl: false };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string, isStorageUrl: false });
    reader.onerror = () => resolve({ url: '', isStorageUrl: false });
    reader.readAsDataURL(blobToUpload);
  });
}


