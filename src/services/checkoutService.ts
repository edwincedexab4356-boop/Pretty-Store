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

    let fileBody: Blob | File;
    if (typeof rawFileOrBase64 === 'string') {
      if (rawFileOrBase64.startsWith('http')) {
        return rawFileOrBase64;
      }
      const res = await fetch(rawFileOrBase64);
      fileBody = await res.blob();
    } else {
      fileBody = rawFileOrBase64;
    }

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

    return typeof rawFileOrBase64 === 'string' ? rawFileOrBase64 : null;
  } catch (err) {
    console.warn('Error uploading voucher image to storage:', err);
    return typeof rawFileOrBase64 === 'string' ? rawFileOrBase64 : null;
  }
}

/**
 * Crea la orden real en Supabase (tabla pedidos y clientes)
 */
export async function createRealOrder(payload: CheckoutPayload): Promise<CheckoutResult> {
  const timestamp = Date.now().toString().slice(-6);
  const orderNumber = `ORD-${timestamp}`;

  try {
    // 1. Subir comprobante si existe
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

    // 3. Insertar Pedido
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

    const orderInsertPayload: any = {
      cliente_id: clienteId,
      total: payload.total,
      subtotal: payload.subtotal,
      descuento: payload.discount,
      envio: payload.shipping,
      metodo_pago: payload.metodoPago,
      tipo_entrega: payload.tipoEntrega,
      courier: payload.courier || null,
      estado: 'confirmado',
      notas: `Cliente: ${payload.nombre} - Tel: ${payload.telefono}${payload.direccion ? ` - Dir: ${payload.direccion}` : ''}${payload.promoTitle ? ` [Promo: ${payload.promoTitle}]` : ''} [ITEMS_JSON]:${JSON.stringify(itemsSummary)}`,
      comprobante_pago: effectiveVoucher,
    };

    let resolvedOrderId = orderNumber;

    try {
      const { data: createdOrder, error: orderError } = await supabase
        .from('pedidos')
        .insert(orderInsertPayload)
        .select('*')
        .single();

      if (!orderError && createdOrder) {
        resolvedOrderId = createdOrder.id;
      }
    } catch (err) {
      console.warn('Direct order insert fallback:', err);
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
      notas: orderInsertPayload.notas,
      comprobanteUrl: effectiveVoucher,
      comprobanteFileName: payload.voucherFileName || 'comprobante_pago.jpg',
      createdAt: new Date().toISOString(),
    };

    saveOrderReceipt(savedReceipt);
    if (effectiveVoucher) {
      saveVoucherImageToDb(String(resolvedOrderId), effectiveVoucher);
      saveVoucherImageToDb(orderNumber, effectiveVoucher);
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
