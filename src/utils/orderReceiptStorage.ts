import { saveVoucherImageToDb, getVoucherImageFromDb } from './voucherDb';

export interface SavedOrderReceipt {
  orderId: string;
  orderNumber: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  tipoEntrega: string;
  courier?: string;
  metodoPago: string;
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
    selectedSize?: string;
  }>;
  notas?: string;
  comprobanteUrl?: string | null;
  comprobanteFileName?: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'pretty_store_client_order_receipts_v1';

export function getAllSavedOrderReceipts(): SavedOrderReceipt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrderReceipt(receipt: SavedOrderReceipt) {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllSavedOrderReceipts();
    const existingIdx = all.findIndex(
      (r) => String(r.orderId) === String(receipt.orderId) || String(r.orderNumber) === String(receipt.orderNumber)
    );

    if (existingIdx > -1) {
      all[existingIdx] = receipt;
    } else {
      all.unshift(receipt);
    }

    if (all.length > 50) {
      all.splice(50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    if (receipt.comprobanteUrl) {
      saveVoucherImageToDb(String(receipt.orderId), receipt.comprobanteUrl, receipt.comprobanteFileName || undefined);
      saveVoucherImageToDb(String(receipt.orderNumber), receipt.comprobanteUrl, receipt.comprobanteFileName || undefined);
    }
  } catch (err) {
    console.warn('Error saving order receipt:', err);
  }
}

export function getOrderReceiptById(idOrOrderNum: string): SavedOrderReceipt | null {
  const all = getAllSavedOrderReceipts();
  const found = all.find(
    (r) => String(r.orderId) === String(idOrOrderNum) || String(r.orderNumber) === String(idOrOrderNum)
  );
  return found || null;
}

export function deleteOrderReceipt(idOrOrderNum: string) {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllSavedOrderReceipts();
    const filtered = all.filter(
      (r) => String(r.orderId) !== String(idOrOrderNum) && String(r.orderNumber) !== String(idOrOrderNum)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Error deleting order receipt:', err);
  }
}

export function clearAllSavedOrderReceipts() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Error clearing all order receipts:', err);
  }
}
