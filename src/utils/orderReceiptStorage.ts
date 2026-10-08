import { getSupabaseClient } from '../lib/supabase';
import { CreatedOrderResult } from '../services/checkoutService';
import {
  saveVoucherImageToDb,
  getVoucherImageFromDb,
  deleteVoucherFromDb,
  memoryVoucherCache,
} from './voucherDb';

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
 * Obtiene todos los recibos y comprobantes guardados en el almacenamiento local,
 * rehidratando las fotos desde la memoria / IndexedDB
 */
export function getAllOrderReceipts(): StoredOrderReceipt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Rehidratar comprobantes si están almacenados en memoria o IndexedDB
    return parsed.map((receipt) => {
      let vUrl = receipt.comprobanteUrl;
      const cleanId = String(receipt.orderId || '').trim();
      const cleanNum = String(receipt.orderNumber || '').trim();

      if (!vUrl || vUrl.startsWith('indexeddb:')) {
        const memMatch =
          memoryVoucherCache.get(cleanId) ||
          memoryVoucherCache.get(cleanNum) ||
          memoryVoucherCache.get(cleanNum.replace(/#/g, ''));
        if (memMatch?.url) {
          vUrl = memMatch.url;
        }
      }
      return {
        ...receipt,
        comprobanteUrl: vUrl || null,
      };
    });
  } catch (e) {
    console.warn('Error leyendo recibos almacenados:', e);
    return [];
  }
}

/**
 * Guarda o actualiza un recibo oficial con su captura en el almacén persistente.
 * Guarda la foto en IndexedDB (sin límites de tamaño) y la referencia en localStorage sin saturar la cuota.
 */
export function saveOrderReceipt(receipt: StoredOrderReceipt): void {
  if (typeof window === 'undefined') return;

  const cleanId = String(receipt.orderId || receipt.orderNumber || '').trim();
  const cleanNum = String(receipt.orderNumber || '').trim();

  // 1. Si hay captura en formato dataURL o URL grande, archivarla de inmediato en IndexedDB
  if (receipt.comprobanteUrl) {
    saveVoucherImageToDb(cleanId, receipt.comprobanteUrl, receipt.comprobanteFileName || undefined);
    if (cleanNum && cleanNum !== cleanId) {
      saveVoucherImageToDb(cleanNum, receipt.comprobanteUrl, receipt.comprobanteFileName || undefined);
    }
  }

  try {
    const current = getAllOrderReceipts();

    const existingIndex = current.findIndex(
      (r) =>
        (cleanId && r.orderId === cleanId) ||
        (cleanNum && r.orderNumber === cleanNum) ||
        (cleanId && r.orderNumber === cleanId)
    );

    // Preparar objeto para localStorage: si la imagen es un dataURL gigante,
    // guardamos un puntero 'indexeddb:' en localStorage para evitar QuotaExceededError
    const isHeavyDataUrl = Boolean(
      receipt.comprobanteUrl &&
      receipt.comprobanteUrl.startsWith('data:') &&
      receipt.comprobanteUrl.length > 5000
    );

    const receiptForLocalStorage: StoredOrderReceipt = {
      ...receipt,
      comprobanteUrl: isHeavyDataUrl
        ? `indexeddb:${cleanId}`
        : receipt.comprobanteUrl || null,
    };

    if (existingIndex >= 0) {
      const merged: StoredOrderReceipt = {
        ...current[existingIndex],
        ...receiptForLocalStorage,
        comprobanteFileName:
          receipt.comprobanteFileName || current[existingIndex].comprobanteFileName,
      };
      current[existingIndex] = merged;
    } else {
      current.unshift(receiptForLocalStorage);
    }

    // Mantener hasta 250 pedidos
    const trimmed = current.slice(0, 250);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (quotaErr) {
      // Si aún así hay presión de almacenamiento, compactar y guardar
      console.warn('Almacenamiento de recibos lleno, compactando...', quotaErr);
      const stripped = trimmed.map((item) => ({
        ...item,
        comprobanteUrl: item.comprobanteUrl?.startsWith('data:')
          ? `indexeddb:${item.orderId}`
          : item.comprobanteUrl,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped.slice(0, 100)));
    }
  } catch (e) {
    console.warn('Error guardando recibo localmente:', e);
  }
}

/**
 * Actualiza la captura/comprobante de un pedido existente tanto en IndexedDB, localStorage y Supabase
 */
export async function updateOrderVoucher(
  orderIdOrNumber: string,
  voucherUrlOrBase64: string,
  fileName?: string
): Promise<void> {
  const cleanKey = String(orderIdOrNumber || '').trim();
  const cleanWithoutHash = cleanKey.replace(/#/g, '');

  // 1. Guardar de inmediato en IndexedDB
  await saveVoucherImageToDb(cleanKey, voucherUrlOrBase64, fileName);
  if (cleanWithoutHash !== cleanKey) {
    await saveVoucherImageToDb(cleanWithoutHash, voucherUrlOrBase64, fileName);
  }

  // 2. Actualizar recibo en localStorage
  const current = getAllOrderReceipts();
  const target = current.find(
    (r) =>
      r.orderId === cleanKey ||
      r.orderNumber === cleanKey ||
      String(r.orderNumber).replace(/#/g, '') === cleanWithoutHash ||
      (cleanKey.length > 5 && (r.orderId.includes(cleanKey) || cleanKey.includes(r.orderId)))
  );

  if (target) {
    target.comprobanteUrl = voucherUrlOrBase64;
    if (fileName) target.comprobanteFileName = fileName;
    saveOrderReceipt(target);
  }

  // 3. Sincronizar en Supabase
  try {
    const supabase = getSupabaseClient();
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
 * Busca el recibo de un pedido por ID o Número de Pedido, garantizando que incluya la foto
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
    const pedCode = `#PED-${String(r.orderId).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    if (pedCode === clean || pedCode === cleanWithoutHash) return true;
    if (cleanWithoutHash.includes(String(r.orderId).slice(0, 6).toUpperCase())) return true;
    return false;
  });

  if (!found) return null;

  // Si la foto está referenciada por IndexedDB o vacía, buscar en la caché de memoria
  if (!found.comprobanteUrl || found.comprobanteUrl.startsWith('indexeddb:')) {
    const mem =
      memoryVoucherCache.get(clean) ||
      memoryVoucherCache.get(cleanWithoutHash) ||
      memoryVoucherCache.get(found.orderId) ||
      memoryVoucherCache.get(found.orderNumber);
    if (mem?.url) {
      return {
        ...found,
        comprobanteUrl: mem.url,
      };
    }
  }

  return found;
}

/**
 * Elimina un recibo del almacén local e IndexedDB cuando el administrador borra el pedido
 */
export function deleteOrderReceipt(orderIdOrNumber: string): void {
  if (typeof window === 'undefined' || !orderIdOrNumber) return;
  const clean = String(orderIdOrNumber).trim();
  deleteVoucherFromDb(clean);

  try {
    const current = getAllOrderReceipts();
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

