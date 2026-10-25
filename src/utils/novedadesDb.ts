/**
 * Almacén persistente en IndexedDB para Novedades y Banners.
 * No tiene la restricción de 5MB de localStorage, por lo que nunca falla
 * por cuota al almacenar imágenes de alta resolución desde dispositivos móviles o PC.
 */
import { Novedad } from '../types/database';

const DB_NAME = 'pretty_store_novedades_db';
const DB_VERSION = 1;
const STORE_NAME = 'novedades';

function openNovedadesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveNovedadesToIndexedDb(items: Novedad[]): Promise<void> {
  try {
    const db = await openNovedadesDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Limpiar y resincronizar
    store.clear();
    for (const item of items) {
      if (item && item.id) {
        store.put(item);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving novedades to IndexedDB:', err);
  }
}

export async function getNovedadesFromIndexedDb(): Promise<Novedad[]> {
  try {
    const db = await openNovedadesDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const list = Array.isArray(req.result) ? req.result : [];
        resolve(list.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function clearNovedadesInIndexedDb(): Promise<void> {
  try {
    const db = await openNovedadesDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB novedades:', err);
  }
}
