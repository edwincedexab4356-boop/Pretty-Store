/**
 * Almacén persistente de imágenes de comprobantes usando IndexedDB.
 * Permite almacenar comprobantes en alta resolución (MBs de tamaño) sin las restricciones
 * de cuota de 5MB que tiene localStorage, garantizando que NUNCA se pierdan las fotos.
 */

const DB_NAME = 'PrettyStoreVouchersDB';
const DB_VERSION = 1;
const STORE_NAME = 'vouchers';

// Caché en memoria para acceso síncrono ultrarrápido
export const memoryVoucherCache = new Map<string, { url: string; fileName?: string }>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está soportado en este entorno'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda una captura de comprobante en IndexedDB asociada a una clave (orderId, orderNumber o hash)
 */
export async function saveVoucherImageToDb(
  orderKey: string,
  imageDataUrlOrBlob: string,
  fileName?: string
): Promise<boolean> {
  if (!orderKey || !imageDataUrlOrBlob) return false;
  const cleanKey = String(orderKey).trim();
  const cleanWithoutHash = cleanKey.replace(/#/g, '');

  // Guardar de inmediato en memoria
  memoryVoucherCache.set(cleanKey, { url: imageDataUrlOrBlob, fileName });
  memoryVoucherCache.set(cleanWithoutHash, { url: imageDataUrlOrBlob, fileName });

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        key: cleanKey,
        url: imageDataUrlOrBlob,
        fileName: fileName || 'comprobante_pago.jpg',
        updatedAt: new Date().toISOString(),
      };

      store.put(record);

      if (cleanWithoutHash !== cleanKey) {
        store.put({
          ...record,
          key: cleanWithoutHash,
        });
      }

      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };

      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[VoucherDB] Error al guardar en IndexedDB:', err);
    return false;
  }
}

/**
 * Obtiene la imagen del comprobante por su ID o número de pedido
 */
export async function getVoucherImageFromDb(orderKey: string): Promise<string | null> {
  if (!orderKey) return null;
  const cleanKey = String(orderKey).trim();
  const cleanWithoutHash = cleanKey.replace(/#/g, '');

  // Revisar memoria primero
  if (memoryVoucherCache.has(cleanKey)) {
    return memoryVoucherCache.get(cleanKey)!.url;
  }
  if (memoryVoucherCache.has(cleanWithoutHash)) {
    return memoryVoucherCache.get(cleanWithoutHash)!.url;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cleanKey);

      req.onsuccess = () => {
        if (req.result?.url) {
          memoryVoucherCache.set(cleanKey, { url: req.result.url, fileName: req.result.fileName });
          db.close();
          resolve(req.result.url);
          return;
        }

        // Probar sin '#'
        if (cleanWithoutHash !== cleanKey) {
          const req2 = store.get(cleanWithoutHash);
          req2.onsuccess = () => {
            if (req2.result?.url) {
              memoryVoucherCache.set(cleanKey, { url: req2.result.url, fileName: req2.result.fileName });
              db.close();
              resolve(req2.result.url);
              return;
            }
            db.close();
            resolve(null);
          };
          req2.onerror = () => {
            db.close();
            resolve(null);
          };
        } else {
          db.close();
          resolve(null);
        }
      };

      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Obtiene todos los comprobantes guardados en IndexedDB
 */
export async function getAllVouchersFromDb(): Promise<Map<string, { url: string; fileName?: string }>> {
  const result = new Map<string, { url: string; fileName?: string }>();

  // Agregar los que ya están en memoria
  memoryVoucherCache.forEach((val, k) => {
    result.set(k, val);
  });

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        if (Array.isArray(req.result)) {
          req.result.forEach((item) => {
            if (item.key && item.url) {
              result.set(item.key, { url: item.url, fileName: item.fileName });
              memoryVoucherCache.set(item.key, { url: item.url, fileName: item.fileName });
            }
          });
        }
        db.close();
        resolve(result);
      };

      req.onerror = () => {
        db.close();
        resolve(result);
      };
    });
  } catch {
    return result;
  }
}

/**
 * Elimina una captura de comprobante de la base de datos
 */
export async function deleteVoucherFromDb(orderKey: string): Promise<boolean> {
  if (!orderKey) return false;
  const cleanKey = String(orderKey).trim();
  const cleanWithoutHash = cleanKey.replace(/#/g, '');

  memoryVoucherCache.delete(cleanKey);
  memoryVoucherCache.delete(cleanWithoutHash);

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(cleanKey);
      if (cleanWithoutHash !== cleanKey) {
        store.delete(cleanWithoutHash);
      }
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}
