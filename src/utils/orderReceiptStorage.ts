import { getSupabaseClient } from '../lib/supabase';
import { CreatedOrderResult } from '../services/checkoutService';

export interface StoredOrderReceipt {
  orderId: string;
  orderNumber: string;
  date: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  metodoPago: string;
  tipoEntrega: string;
  courier?: string;
  subtotal: number;
  discount: number;
  promoTitle?: string;
  shipping: number;
  total: number;
  itemCount: number;
  items: Array<{
    product: {
      id: string;
      nombre: string;
      precio: number;
      imagen_url?: string;
    };
    quantity: number;
    subtotal: number;
  }>;
  notas?: string;
  comprobanteUrl?: string | null;
  comprobanteFileName?: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'pretty_store_orders_receipts_v2';

/**
 * Obtiene todos los recibos y comprobantes guardados en el almacenamiento local
 */
export function getAllOrderReceipts(): StoredOrderReceipt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error leyendo recibos almacenados:', e);
    return [];
  }
}

/**
 * Guarda o actualiza un recibo oficial con su captura en el almacén persistente
 */
export function saveOrderReceipt(receipt: StoredOrderReceipt): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllOrderReceipts();
    const cleanId = String(receipt.orderId || receipt.orderNumber || '').trim();
    const cleanNum = String(receipt.orderNumber || '').trim();

    const existingIndex = current.findIndex(
      (r) =>
        (cleanId && r.orderId === cleanId) ||
        (cleanNum && r.orderNumber === cleanNum) ||
        (cleanId && r.orderNumber === cleanId)
    );

    if (existingIndex >= 0) {
      // Actualizar preservando datos de comprobante si el nuevo no tiene
      const merged: StoredOrderReceipt = {
        ...current[existingIndex],
        ...receipt,
        comprobanteUrl: receipt.comprobanteUrl || current[existingIndex].comprobanteUrl,
        comprobanteFileName: receipt.comprobanteFileName || current[existingIndex].comprobanteFileName,
      };
      current[existingIndex] = merged;
    } else {
      current.unshift(receipt);
    }

    // Mantener hasta 250 pedidos recientes en caché
    let trimmed = current.slice(0, 250);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (quotaErr) {
      // Si el localStorage está lleno por imágenes base64, recortar a 50 más recientes
      console.warn('Almacenamiento de recibos lleno, compactando...', quotaErr);
      trimmed = current.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (e) {
    console.warn('Error guardando recibo localmente:', e);
  }
}

/**
 * Actualiza la captura/comprobante de un pedido existente
 */
export async function updateOrderVoucher(
  orderIdOrNumber: string,
  voucherUrlOrBase64: string,
  fileName?: string
): Promise<void> {
  const current = getAllOrderReceipts();
  const cleanKey = String(orderIdOrNumber || '').trim();

  const target = current.find(
    (r) =>
      r.orderId === cleanKey ||
      r.orderNumber === cleanKey ||
      String(r.orderNumber).replace(/#/g, '') === cleanKey.replace(/#/g, '') ||
      (cleanKey.length > 5 && (r.orderId.includes(cleanKey) || cleanKey.includes(r.orderId)))
  );

  if (target) {
    target.comprobanteUrl = voucherUrlOrBase64;
    if (fileName) target.comprobanteFileName = fileName;
    saveOrderReceipt(target);
  }

  // Sincronizar en Supabase
  try {
    const supabase = getSupabaseClient();
    // Probar actualizar directamente por ID original (UUID o texto o número)
    const { error: err1 } = await supabase
      .from('pedidos')
      .update({
        comprobante_pago: voucherUrlOrBase64,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', cleanKey);

    if (err1 && !cleanKey.includes('-')) {
      const numOnly = cleanKey.replace(/\D/g, '');
      if (numOnly) {
        await supabase
          .from('pedidos')
          .update({
            comprobante_pago: voucherUrlOrBase64,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', numOnly);
      }
    }
  } catch (err) {
    console.warn('Sync voucher with supabase:', err);
  }
}

/**
 * Busca el recibo de un pedido por ID o Número de Pedido
 */
export function getOrderReceipt(orderIdOrNumber: string): StoredOrderReceipt | null {
  if (!orderIdOrNumber) return null;
  const current = getAllOrderReceipts();
  const clean = String(orderIdOrNumber).trim();
  const cleanWithoutHash = clean.replace(/#/g, '').toUpperCase();

  const found = current.find((r) => {
    if (r.orderId === clean) return true;
    if (r.orderNumber === clean) return true;
    if (r.orderNumber.replace(/#/g, '').toUpperCase() === cleanWithoutHash) return true;
    // Chequear si el ID de supabase contiene el prefijo
    const pedCode = `#PED-${String(r.orderId).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    if (pedCode === clean || pedCode === cleanWithoutHash) return true;
    if (cleanWithoutHash.includes(String(r.orderId).slice(0, 6).toUpperCase())) return true;
    return false;
  });
  return found || null;
}

/**
 * Elimina un recibo del almacén local cuando el administrador borra el pedido
 */
export function deleteOrderReceipt(orderIdOrNumber: string): void {
  if (typeof window === 'undefined' || !orderIdOrNumber) return;
  try {
    const current = getAllOrderReceipts();
    const clean = String(orderIdOrNumber).trim();
    const cleanWithoutHash = clean.replace(/#/g, '').toUpperCase();
    const filtered = current.filter((r) => {
      if (r.orderId === clean) return false;
      if (r.orderNumber === clean) return false;
      if (r.orderNumber.replace(/#/g, '').toUpperCase() === cleanWithoutHash) return false;
      const pedCode = `#PED-${String(r.orderId).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
      if (pedCode === clean || pedCode === cleanWithoutHash) return false;
      return true;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Error eliminando recibo local:', e);
  }
}

/**
 * Obtiene todos los pedidos y comprobantes de un cliente específico por teléfono, nombre o email
 */
export function getClientReceipts(telefono?: string, nombre?: string, email?: string): StoredOrderReceipt[] {
  const all = getAllOrderReceipts();
  const cleanPhone = telefono ? telefono.replace(/\D/g, '') : '';
  const cleanName = nombre ? nombre.trim().toLowerCase() : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  return all.filter((r) => {
    const rPhone = r.telefono ? r.telefono.replace(/\D/g, '') : '';
    const rEmail = r.email ? r.email.trim().toLowerCase() : '';
    const rName = r.nombre ? r.nombre.trim().toLowerCase() : '';

    if (cleanPhone && (rPhone.includes(cleanPhone) || cleanPhone.includes(rPhone))) return true;
    if (cleanEmail && cleanEmail !== '—' && rEmail === cleanEmail) return true;
    if (cleanName && cleanName.length > 2 && (rName.includes(cleanName) || cleanName.includes(rName))) return true;
    return false;
  });
}
