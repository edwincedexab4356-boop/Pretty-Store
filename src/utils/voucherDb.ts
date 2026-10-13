/**
 * Permite almacenar comprobantes en alta resolución (MBs de tamaño) sin las restricciones de localStorage (5MB total)
 */
const DB_NAME = 'pretty_store_vouchers_db';
const DB_VERSION = 1;
const STORE_NAME = 'vouchers';

function openVoucherDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'orderId' });
      }
    };
  });
}

export async function saveVoucherImageToDb(orderId: string, imageBase64OrUrl: string, fileName = 'comprobante.jpg'): Promise<void> {
  try {
    const db = await openVoucherDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ orderId: String(orderId), dataUrl: imageBase64OrUrl, fileName, timestamp: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving voucher to IndexedDB:', err);
  }
}

export async function getVoucherImageFromDb(orderId: string): Promise<string | null> {
  try {
    const db = await openVoucherDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(String(orderId));
    return new Promise((resolve) => {
      req.onsuccess = () => {
        resolve(req.result?.dataUrl || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
