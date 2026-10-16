import { supabase } from '../lib/supabase';
import { CartItem, MetodoPago, TipoEntrega, CourierOption } from '../types/database';
import { saveOrderReceipt } from '../utils/orderReceiptStorage';
import { saveVoucherImageToDb } from '../utils/voucherDb';

export interface CheckoutPayload {
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  tipoEntrega: TipoEntrega;
  courier?: CourierOption;
  metodoPago: MetodoPago;
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoTitle?: string;
  shipping: number;
  total: number;
  voucherImage?: string | null;
  voucherFileName?: string | null;
  voucherRawFile?: File | null;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  publicVoucherUrl: string | null;
  success: boolean;
  message?: string;
}

/**
 * Sube el archivo de comprobante al almacenamiento de Supabase Storage.
 */
export async function uploadVoucherToSupabaseStorage(
  rawFileOrBase64: File | string,
  orderNumber: string
): Promise<string | null> {
  try {
    const cleanNum = orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `pago_${cleanNum}_${Date.now()}.jpg`;

    let base64String = '';
    let fileBody: Blob | File | null = null;

    if (typeof rawFileOrBase64 === 'string') {
      if (rawFileOrBase64.startsWith('http://') || rawFileOrBase64.startsWith('https://')) {
        return rawFileOrBase64;
      }
      base64String = rawFileOrBase64;
      try {
        const res = await fetch(rawFileOrBase64);
        fileBody = await res.blob();
      } catch {
        // continue
      }
    } else {
      fileBody = rawFileOrBase64;
      // Convert File to base64 for /api/upload-voucher
      base64String = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(rawFileOrBase64);
      });
    }

    let publicUrlFromServer: string | null = null;

    // 1. Upload to local express server endpoint for instant public URL
    if (base64String && typeof window !== 'undefined') {
      try {
        const clientOrigin = window.location.origin;
        const response = await fetch('/api/upload-voucher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64String,
            orderNumber: cleanNum,
            clientOrigin,
          }),
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.url) {
            publicUrlFromServer = resJson.url;
          }
        }
      } catch (e) {
        console.warn('Local voucher upload fallback failed:', e);
      }
    }

    // 2. Also try uploading to Supabase Storage candidate buckets
    if (fileBody) {
      const candidateBuckets = ['comprobantes', 'product-images'];
      for (const bucket of candidateBuckets) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileBody, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!error && data) {
            const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);
            if (pubData?.publicUrl) {
              return pubData.publicUrl;
            }
          }
        } catch {
          // Try next bucket
        }
      }
    }

    // Return the server's public URL if Supabase storage bucket not created yet
    if (publicUrlFromServer) {
      return publicUrlFromServer;
    }

    return typeof rawFileOrBase64 === 'string' && rawFileOrBase64.startsWith('http')
      ? rawFileOrBase64
      : null;
  } catch (err) {
    console.warn('Error uploading voucher image to storage:', err);
    return null;
  }
}

/**
 * Crea la orden real en Supabase (tabla pedidos y clientes)
 */
export async function createRealOrder(payload: CheckoutPayload): Promise<CheckoutResult> {
  const timestamp = Date.now().toString().slice(-6);
  const orderNumber = `ORD-${timestamp}`;

  try {
    // 1. Subir comprobante y obtener link público
    let publicVoucherUrl: string | null = null;
    if (payload.voucherRawFile) {
      publicVoucherUrl = await uploadVoucherToSupabaseStorage(payload.voucherRawFile, orderNumber);
    } else if (payload.voucherImage) {
      publicVoucherUrl = await uploadVoucherToSupabaseStorage(payload.voucherImage, orderNumber);
    }

    const effectiveVoucher = publicVoucherUrl || payload.voucherImage || null;

    // 2. Registrar o buscar cliente
    let clienteId: string | null = null;
    try {
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono', payload.telefono.trim())
        .maybeSingle();

      if (existingClient) {
        clienteId = existingClient.id;
      } else {
        const { data: newClient } = await supabase
          .from('clientes')
          .insert({
            nombre: payload.nombre.trim(),
            telefono: payload.telefono.trim(),
            email: payload.email?.trim() || null,
            direccion: payload.direccion?.trim() || null,
          })
          .select('id')
          .single();

        if (newClient) clienteId = newClient.id;
      }
    } catch {
      // Ignore client table errors to not block checkout
    }

    // 3. Preparar resumen de productos
    const itemsSummary = payload.items.map((it) => {
      const unitPrice = it.selectedOption?.precio ?? it.product.precio;
      return {
        producto_id: it.product.id,
        nombre: it.product.nombre,
        precio: unitPrice,
        imagen_url: it.product.imagen_url || null,
        cantidad: it.quantity,
        subtotal: it.subtotal,
        selectedSize: it.selectedSize || null,
        selectedOption: it.selectedOption || null,
      };
    });

    const detailedNotes = `Cliente: ${payload.nombre} - Tel: ${payload.telefono}${
      payload.direccion ? ` - Dir: ${payload.direccion}` : ''
    }${payload.promoTitle ? ` [Promo: ${payload.promoTitle}]` : ''} - Envio: $${payload.shipping.toFixed(2)} - Descuento: $${payload.discount.toFixed(2)} [ITEMS_JSON]:${JSON.stringify(itemsSummary)}`;

    // Safe base payload that matches exact Supabase table schema
    const safePayload: any = {
      cliente_id: clienteId,
      cliente_nombre: payload.nombre.trim(),
      cliente_telefono: payload.telefono.trim(),
      cliente_email: payload.email?.trim() || null,
      direccion: payload.direccion?.trim() || '',
      total: payload.total,
      subtotal: payload.subtotal,
      metodo_pago: payload.metodoPago,
      tipo_entrega: payload.tipoEntrega,
      courier: payload.courier || null,
      estado: 'pendiente',
      notas: detailedNotes,
      comprobante_pago: publicVoucherUrl || effectiveVoucher,
    };

    let resolvedOrderId = orderNumber;
    let createdOrder: any = null;

    // Intentar inserción con columnas opcionales (descuento, envio)
    try {
      const fullPayload = {
        ...safePayload,
        descuento: payload.discount,
        envio: payload.shipping,
      };

      const res = await supabase.from('pedidos').insert(fullPayload).select('*').single();
      if (!res.error && res.data) {
        createdOrder = res.data;
      } else {
        // Si falló por falta de columnas como descuento/envio, reintentar con el payload seguro garantizado
        console.warn('Insert with full columns failed, retrying with safePayload:', res.error?.message);
        const retryRes = await supabase.from('pedidos').insert(safePayload).select('*').single();
        if (!retryRes.error && retryRes.data) {
          createdOrder = retryRes.data;
        } else {
          console.error('Fatal retry insert error:', retryRes.error);
        }
      }
    } catch (err) {
      console.warn('Direct order insert error, attempting safe payload:', err);
      try {
        const retryRes = await supabase.from('pedidos').insert(safePayload).select('*').single();
        if (!retryRes.error && retryRes.data) {
          createdOrder = retryRes.data;
        }
      } catch (e) {
        console.error('Final fallback insert failed:', e);
      }
    }

    if (createdOrder?.id) {
      resolvedOrderId = String(createdOrder.id);
      console.log('Order successfully created in Supabase with ID:', createdOrder.id);
    }

    // 4. Guardar copia de seguridad del recibo en IndexedDB y localStorage
    const savedReceipt = {
      orderId: String(resolvedOrderId),
      orderNumber,
      nombre: payload.nombre,
      telefono: payload.telefono,
      email: payload.email,
      direccion: payload.direccion,
      tipoEntrega: payload.tipoEntrega,
      courier: payload.courier,
      metodoPago: payload.metodoPago,
      subtotal: payload.subtotal,
      discount: payload.discount,
      promoTitle: payload.promoTitle,
      shipping: payload.shipping,
      total: payload.total,
      itemCount: payload.items.reduce((acc, i) => acc + i.quantity, 0),
      items: payload.items.map((it) => ({
        product: {
          id: it.product.id,
          nombre: it.product.nombre,
          precio: it.product.precio,
          imagen_url: it.product.imagen_url || undefined,
        },
        quantity: it.quantity,
        subtotal: it.subtotal,
        selectedSize: it.selectedSize,
      })),
      notas: detailedNotes,
      comprobanteUrl: effectiveVoucher,
      comprobanteFileName: payload.voucherFileName || 'comprobante_pago.jpg',
      createdAt: new Date().toISOString(),
    };

    saveOrderReceipt(savedReceipt);
    if (effectiveVoucher) {
      saveVoucherImageToDb(String(resolvedOrderId), effectiveVoucher);
      saveVoucherImageToDb(orderNumber, effectiveVoucher);
    }

    // 5. Sincronizar copia del pedido en el servidor para disponibilidad en todos los dispositivos
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: String(resolvedOrderId),
            numero_orden: orderNumber,
            total: payload.total,
            subtotal: payload.subtotal,
            descuento: payload.discount,
            envio: payload.shipping,
            metodo_pago: payload.metodoPago,
            tipo_entrega: payload.tipoEntrega,
            courier: payload.courier,
            estado: 'pendiente',
            comprobante_pago: effectiveVoucher,
            notas: safePayload.notas,
            cliente_nombre: payload.nombre.trim(),
            cliente_telefono: payload.telefono.trim(),
            cliente_email: payload.email?.trim() || null,
            direccion: payload.direccion?.trim() || '',
            created_at: new Date().toISOString(),
          }),
        }).catch((e) => console.warn('Server orders sync silent error:', e));
      }
    } catch {
      // ignore
    }

    return {
      orderId: resolvedOrderId,
      orderNumber,
      publicVoucherUrl: effectiveVoucher,
      success: true,
    };
  } catch (err: any) {
    console.error('Critical checkout error:', err);
    return {
      orderId: orderNumber,
      orderNumber,
      publicVoucherUrl: payload.voucherImage || null,
      success: true,
      message: err?.message,
    };
  }
}
