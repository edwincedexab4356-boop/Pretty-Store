import { getSupabaseClient } from '../lib/supabase';
import { compressImageFile } from '../utils/imageOptimizer';
import {
  Categoria,
  Producto,
  Inventario,
  Pedido,
  DetallePedido,
  Cliente,
  Venta,
  Perfil,
  StoreConfig,
  DashboardStats,
  EstadoPedido,
  MetodoPago,
  TipoEntrega,
  CourierOption,
} from '../types/database';

// Default configuration fallback
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  nombre_tienda: 'Pretty-Store',
  descripcion: 'Boutique exclusiva de alta relojería, perfumería selecta y accesorios de distinción.',
  logo_url: '/images/logo/logotipo.jpeg',
  hero_video_url: '/videos/hero.mp4',
  hero_poster_url: '',
  catalog_video_url: '',
  telefono: '+507 6890-1234',
  whatsapp: '+507 6890-1234',
  email: 'contacto@pretty-store.com',
  direccion: 'https://maps.app.goo.gl/PxA3suMXNZxuFF5X7',
  instagram: 'https://instagram.com',
  tiktok: 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS',
  facebook: '',
  twitter: '',
  yappy_numero: '+507 6890-1234',
  banco_datos: 'Banco General - Cuenta Corriente #03-01-01-123456-7 a nombre de Pretty-Store Inc.',
  pasarela_tarjeta: 'PagueloFacil',
  link_pago_tarjeta: 'https://checkout.paguelofacil.com/gorras',
};

// ==========================================
// AUTHENTICATION & ROLES
// ==========================================

export async function fetchUserProfile(userId: string): Promise<Perfil | null> {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as Perfil;
    }
  } catch (e) {
    console.warn('Perfil en base de datos no disponible:', e);
  }
  return null;
}

export async function createOrEnsureAdminProfile(
  userId: string,
  email: string,
  name?: string
): Promise<Perfil | null> {
  const supabase = getSupabaseClient();
  const userName = name || email.split('@')[0];

  // Intento 1: insertar con rol 'administrador' (por restricción perfiles_rol_check en español)
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .upsert(
        {
          id: userId,
          nombre: userName,
          rol: 'administrador',
          activo: true,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return data as Perfil;
    }
  } catch (e) {
    console.warn('Intento con administrador falló:', e);
  }

  // Intento 2: si la restricción de la base de datos prefiere 'admin'
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .upsert(
        {
          id: userId,
          nombre: userName,
          rol: 'admin',
          activo: true,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return data as Perfil;
    }
  } catch (e) {
    console.warn('Intento con admin falló:', e);
  }

  return null;
}

async function loginViaProxy(email: string, password: string) {
  const supabase = getSupabaseClient();
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await resp.json();
  if (!resp.ok || json.error) {
    throw new Error(json.error || 'Error al iniciar sesión.');
  }
  if (json.session) {
    await supabase.auth.setSession(json.session);
  }
  return json;
}

export async function loginAdmin(email: string, password: string) {
  const supabase = getSupabaseClient();
  const cleanEmail = email.trim();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return await loginViaProxy(cleanEmail, password);
      }
      throw new Error(error.message || 'Error al iniciar sesión.');
    }

    return data;
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
      return await loginViaProxy(cleanEmail, password);
    }
    throw err;
  }
}

async function registerViaProxy(email: string, password: string, nombre?: string) {
  const supabase = getSupabaseClient();
  const resp = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: nombre }),
  });
  const json = await resp.json();
  if (!resp.ok || json.error) {
    throw new Error(json.error || 'Error al registrar usuario.');
  }
  if (json.session) {
    await supabase.auth.setSession(json.session);
  }
  return json;
}

export async function registerAdmin(
  email: string,
  password: string,
  nombre?: string,
  rol: 'admin' | 'cajero' | 'cliente' = 'admin'
) {
  const supabase = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  let dataResult: any = null;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          nombre: nombre || 'Administrador',
          rol,
        },
      },
    });

    if (error) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        dataResult = await registerViaProxy(cleanEmail, password, nombre);
      } else {
        throw new Error(error.message || 'Error al registrar usuario.');
      }
    } else {
      dataResult = data;
    }
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
      dataResult = await registerViaProxy(cleanEmail, password, nombre);
    } else {
      throw err;
    }
  }

  // Si existe tabla perfiles y el usuario fue creado, registrar o actualizar
  if (dataResult?.user) {
    try {
      await supabase.from('perfiles').upsert({
        id: dataResult.user.id,
        nombre: nombre || cleanEmail.split('@')[0],
        rol,
        activo: true,
      });
    } catch {
      // Ignorar si perfiles se maneja mediante el trigger on_auth_user_created
    }
  }

  return dataResult;
}

export async function logoutAdmin() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('Error al cerrar sesión:', error.message);
  }
}

export async function sendMagicLink(email: string) {
  const supabase = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al enviar enlace de acceso.');
  }

  return data;
}

export async function resetAdminPassword(email: string) {
  const supabase = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
  });

  if (error) {
    throw new Error(error.message || 'Error al solicitar restablecimiento de contraseña.');
  }

  return data;
}

export async function getAdminSession() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAdminAuthChange(callback: (event: string, session: any) => void) {
  const supabase = getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return data.subscription;
}

// ==========================================
// DASHBOARD STATS & CHARTS
// ==========================================

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Pedidos & Ventas
  let ventas_hoy = 0;
  let ventas_mes = 0;
  let pedidos_hoy = 0;
  let pedidos_pendientes = 0;

  try {
    const { data: orders } = await supabase
      .from('pedidos')
      .select('id, total, estado, created_at');

    if (orders) {
      orders.forEach((o) => {
        const orderDate = o.created_at || '';
        const orderTotal = Number(o.total) || 0;

        if (orderDate >= startOfToday && o.estado !== 'cancelado') {
          ventas_hoy += orderTotal;
          pedidos_hoy += 1;
        }

        if (orderDate >= startOfMonth && o.estado !== 'cancelado') {
          ventas_mes += orderTotal;
        }

        if (o.estado === 'pendiente') {
          pedidos_pendientes += 1;
        }
      });
    }
  } catch (err) {
    console.warn('Error cargando stats de pedidos:', err);
  }

  // 2. Productos & Stock
  let total_productos = 0;
  let productos_agotados = 0;
  let productos_stock_bajo = 0;

  try {
    const { data: prods } = await supabase
      .from('productos')
      .select('id, stock, activo');

    const { data: invs } = await supabase
      .from('inventario')
      .select('producto_id, stock_actual, stock_minimo');

    const invMap = new Map<string, { stock_actual: number; stock_minimo: number }>();
    if (invs) {
      invs.forEach((i) => {
        invMap.set(i.producto_id, {
          stock_actual: i.stock_actual,
          stock_minimo: i.stock_minimo || 5,
        });
      });
    }

    if (prods) {
      total_productos = prods.length;
      prods.forEach((p) => {
        const inv = invMap.get(p.id);
        const resolvedStock = inv ? inv.stock_actual : (p.stock || 0);
        const minStock = inv ? inv.stock_minimo : 5;

        if (resolvedStock <= 0) {
          productos_agotados += 1;
        } else if (resolvedStock <= minStock) {
          productos_stock_bajo += 1;
        }
      });
    }
  } catch (err) {
    console.warn('Error cargando stats de productos:', err);
  }

  return {
    ventas_hoy,
    ventas_mes,
    pedidos_hoy,
    pedidos_pendientes,
    total_productos,
    productos_agotados,
    productos_stock_bajo,
  };
}

export interface ChartDayPoint {
  label: string;
  total: number;
  orders: number;
}

export async function fetchSalesByPeriod(daysCount = 7): Promise<ChartDayPoint[]> {
  const supabase = getSupabaseClient();
  const points: ChartDayPoint[] = [];

  const now = new Date();
  const dayBuckets: Record<string, { total: number; orders: number; label: string }> = {};

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    dayBuckets[key] = { total: 0, orders: 0, label };
  }

  try {
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysCount);

    const { data: orders } = await supabase
      .from('pedidos')
      .select('id, total, estado, created_at')
      .gte('created_at', startDate.toISOString())
      .neq('estado', 'cancelado');

    if (orders) {
      orders.forEach((o) => {
        const key = (o.created_at || '').split('T')[0];
        if (dayBuckets[key]) {
          dayBuckets[key].total += Number(o.total) || 0;
          dayBuckets[key].orders += 1;
        }
      });
    }
  } catch (e) {
    console.warn('Error calculando ventas por periodo:', e);
  }

  Object.keys(dayBuckets).forEach((k) => {
    points.push(dayBuckets[k]);
  });

  return points;
}

export interface TopProductItem {
  id: string;
  nombre: string;
  cantidad: number;
  total_ventas: number;
  imagen_url: string | null;
}

export async function fetchTopProducts(): Promise<TopProductItem[]> {
  const supabase = getSupabaseClient();

  try {
    const { data: details } = await supabase
      .from('detalle_pedidos')
      .select('producto_id, cantidad, subtotal, precio_unitario');

    const { data: prods } = await supabase
      .from('productos')
      .select('id, nombre, imagen_url');

    const prodMap = new Map<string, { nombre: string; imagen_url: string | null }>();
    if (prods) {
      prods.forEach((p) => prodMap.set(p.id, { nombre: p.nombre, imagen_url: p.imagen_url }));
    }

    const counts: Record<string, { cantidad: number; total_ventas: number }> = {};
    if (details) {
      details.forEach((d) => {
        if (!counts[d.producto_id]) {
          counts[d.producto_id] = { cantidad: 0, total_ventas: 0 };
        }
        counts[d.producto_id].cantidad += Number(d.cantidad) || 0;
        counts[d.producto_id].total_ventas += Number(d.subtotal) || (Number(d.cantidad) * Number(d.precio_unitario)) || 0;
      });
    }

    const list: TopProductItem[] = Object.keys(counts).map((prodId) => {
      const p = prodMap.get(prodId);
      return {
        id: prodId,
        nombre: p?.nombre || 'Producto #' + String(prodId).slice(0, 6),
        cantidad: counts[prodId].cantidad,
        total_ventas: counts[prodId].total_ventas,
        imagen_url: p?.imagen_url || null,
      };
    });

    list.sort((a, b) => b.cantidad - a.cantidad);
    return list.slice(0, 5);
  } catch (e) {
    console.warn('Error obteniendo top productos:', e);
    return [];
  }
}

// ==========================================
// STORAGE UPLOAD (SUPABASE STORAGE OPTIMIZADO)
// ==========================================

// Cache for working bucket and status to eliminate redundant slow network attempts
let cachedWorkingBucket: string | null = null;
let storageDisabledForSession = false;

// Helper para subir videos y archivos multimedia directamente al servidor de la tienda
async function uploadToLocalServer(
  file: File,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  onStatusUpdate?.(`Transfiriendo video (${(file.size / (1024 * 1024)).toFixed(1)}MB) al servidor de la tienda...`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            base64,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.url) {
          resolve(data.url);
        } else {
          throw new Error('Respuesta inválida al subir video');
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer archivo local'));
    reader.readAsDataURL(file);
  });
}

export async function uploadProductImageToSupabase(
  file: File,
  onStatusUpdate?: (statusText: string) => void
): Promise<string> {
  const supabase = getSupabaseClient();
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(file.name);

  // 1. RESTRICCIÓN ESTRICTA DE 10MB PARA VIDEOS
  if (isVideo && file.size > 10 * 1024 * 1024) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `El video "${file.name}" pesa ${sizeMB}MB y supera el límite máximo de 10MB. Por rendimiento y velocidad de carga, no se permite agregar videos mayores de 10MB.`
    );
  }

  // 2. PARA VIDEOS: Subida directa al servidor (/api/upload -> public/videos/)
  // Esto garantiza que el video se guarde en menos de 1 segundo, no dependa de políticas RLS externas
  // y genere una URL corta ("/videos/...") que se guarda en Supabase en 0.05 segundos sin saturar la BD
  if (isVideo) {
    try {
      const localUrl = await uploadToLocalServer(file, onStatusUpdate);
      if (localUrl) {
        onStatusUpdate?.('¡Video guardado con éxito!');
        return localUrl;
      }
    } catch (localErr) {
      console.warn('Endpoint /api/upload no disponible, intentando Supabase Storage:', localErr);
    }
  }

  let fileToUpload: File = file;
  let fallbackDataUrl = '';

  // 3. Compresión instantánea en el navegador para imágenes (reduce 5MB a ~120KB)
  if (isImage) {
    onStatusUpdate?.('Optimizando y reduciendo imagen con alta fidelidad...');
    try {
      const optimized = await compressImageFile(file, {
        maxWidth: 1300,
        maxHeight: 1300,
        quality: 0.82,
        mimeType: 'image/jpeg',
      });
      fileToUpload = optimized.file;
      fallbackDataUrl = optimized.dataUrl;
    } catch (e) {
      console.warn('Compresión en canvas no disponible, usando original:', e);
    }
  }

  // Si para imágenes ya se sabe que el storage no tiene RLS público, devolvemos la imagen comprimida (100KB)
  if (isImage && storageDisabledForSession && fallbackDataUrl) {
    onStatusUpdate?.('Guardando imagen ultraligera optimizada...');
    return fallbackDataUrl;
  }

  // 4. Subida a Supabase Storage CDN
  const ext = isImage
    ? 'jpg'
    : (file.name.split('.').pop()?.toLowerCase() || 'mp4');
  const cleanName = file.name
    .substring(0, file.name.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 25);
  const filePath = `${Date.now()}_${cleanName}.${ext}`;

  const candidateBuckets = cachedWorkingBucket
    ? [cachedWorkingBucket]
    : isVideo
    ? ['product-images', 'videos', 'assets']
    : ['product-images', 'productos', 'products'];

  onStatusUpdate?.(
    isVideo
      ? `Subiendo video (${(file.size / (1024 * 1024)).toFixed(1)}MB) a Supabase Storage...`
      : 'Enviando imagen a Supabase Storage CDN...'
  );

  let lastError: any = null;
  const timeoutMs = isVideo ? 60000 : 5000;

  for (const bucket of candidateBuckets) {
    try {
      const mimeType = isVideo
        ? (file.type || 'video/mp4')
        : (fileToUpload.type || 'image/jpeg');

      const uploadPromise = supabase.storage.from(bucket).upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType,
      });

      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                isVideo
                  ? 'Tiempo de espera agotado al subir el video a Supabase Storage.'
                  : 'Timeout en Supabase Storage'
              )
            ),
          timeoutMs
        )
      );

      const { data, error } = (await Promise.race([uploadPromise, timeoutPromise])) as any;

      if (!error && data) {
        cachedWorkingBucket = bucket;
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicData.publicUrl;
      }
      lastError = error;
    } catch (e) {
      lastError = e;
    }
  }

  // 5. MANEJO DE ERRORES:
  // Para imágenes: si falla el bucket, usamos la dataURL comprimida ultraligera (~100KB)
  if (isImage && fallbackDataUrl) {
    storageDisabledForSession = true;
    console.warn('[Supabase Storage no disponible para imágenes, usando versión comprimida]', lastError);
    return fallbackDataUrl;
  }

  // Para VIDEOS: NUNCA convertir a Base64 gigantesco de 15MB que satura y congela la base de datos!
  const errorMsg = lastError?.message || 'Error de permisos o RLS en Supabase Storage';
  throw new Error(
    `No se pudo guardar el video (${errorMsg}). Puedes pegar una URL directa de video (ej. YouTube, Cloudinary o .mp4) en el campo correspondiente.`
  );
}

/**
 * Diagnóstico de rendimiento de la base de datos Supabase
 */
export async function checkDatabaseHealth(): Promise<{
  latencyMs: number;
  totalProducts: number;
  heavyProducts: { id: string | number; nombre: string; payloadSizeKB: number; hasLargeBase64: boolean }[];
  totalPayloadKB: number;
}> {
  const supabase = getSupabaseClient();
  const t0 = performance.now();

  const { data: prods, error } = await supabase.from('productos').select('id, nombre, imagen_url');
  const latencyMs = Math.round(performance.now() - t0);

  if (error || !prods) {
    return { latencyMs, totalProducts: 0, heavyProducts: [], totalPayloadKB: 0 };
  }

  let totalChars = 0;
  const heavyProducts: { id: string | number; nombre: string; payloadSizeKB: number; hasLargeBase64: boolean }[] = [];

  prods.forEach((p) => {
    const imgStr = p.imagen_url || '';
    const chars = imgStr.length;
    totalChars += chars;
    const kb = Math.round(chars / 1024);

    if (kb > 300) {
      heavyProducts.push({
        id: p.id,
        nombre: p.nombre,
        payloadSizeKB: kb,
        hasLargeBase64: imgStr.includes('data:'),
      });
    }
  });

  return {
    latencyMs,
    totalProducts: prods.length,
    heavyProducts,
    totalPayloadKB: Math.round(totalChars / 1024),
  };
}

export interface TableStorageDetail {
  name: string;
  displayName: string;
  rows: number;
  bytes: number;
  sizeKB: number;
  sizeMB: number;
}

export interface BucketStorageDetail {
  name: string;
  files: number;
  bytes: number;
  sizeMB: number;
}

export interface SupabaseQuotaReport {
  storageUsedBytes: number;
  storageUsedMB: number;
  storageLimitMB: number; // 1024 MB (Plan Free)
  storagePercent: number;
  storageFileCount: number;
  buckets: BucketStorageDetail[];
  databaseTables: TableStorageDetail[];
  databaseTotalBytes: number;
  databaseTotalKB: number;
  databaseTotalMB: number;
  databaseLimitMB: number; // 500 MB (Plan Free)
  databasePercent: number;
  totalRecords: number;
  status: 'optimal' | 'warning' | 'alert' | 'critical';
  isApproachingLimit: boolean;
  message: string;
  recommendation: string;
}

/**
 * Consulta en tiempo real las cuotas y almacenamiento exacto de cada tabla y del Storage en Supabase
 */
export async function checkSupabaseStorageAndLimits(): Promise<SupabaseQuotaReport> {
  const supabase = getSupabaseClient();
  const STORAGE_LIMIT_MB = 1024; // 1 GB Límite oficial Supabase Free Tier
  const DATABASE_LIMIT_MB = 500; // 500 MB Límite oficial DB Supabase Free Tier

  let totalStorageBytes = 0;
  let totalFiles = 0;
  const bucketsDetail: BucketStorageDetail[] = [];

  // 1. Escanear buckets de almacenamiento (Storage CDN)
  const bucketsToCheck = ['product-images', 'videos', 'assets'];
  for (const bucket of bucketsToCheck) {
    try {
      const { data: files, error } = await supabase.storage.from(bucket).list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (!error && files) {
        let bBytes = 0;
        let bFiles = 0;
        files.forEach((file) => {
          if (file.name !== '.emptyFolderPlaceholder') {
            bFiles += 1;
            bBytes += file.metadata?.size || 0;
          }
        });
        totalFiles += bFiles;
        totalStorageBytes += bBytes;
        bucketsDetail.push({
          name: bucket,
          files: bFiles,
          bytes: bBytes,
          sizeMB: Number((bBytes / (1024 * 1024)).toFixed(2)),
        });
      }
    } catch (e) {
      // Ignorar si el bucket no existe
    }
  }

  // 2. Medir almacenamiento exacto y filas de cada tabla de la base de datos
  const tablesToScan = [
    { name: 'productos', label: 'Productos (Fotos, precios, descripción)' },
    { name: 'inventario', label: 'Inventario (Existencias y stock)' },
    { name: 'categorias', label: 'Categorías (Colecciones)' },
    { name: 'pedidos', label: 'Pedidos (Órdenes de clientes)' },
    { name: 'clientes', label: 'Clientes (Fichas y contactos)' },
    { name: 'ventas', label: 'Ventas (Asientos contables)' },
  ];

  const databaseTables: TableStorageDetail[] = [];
  let totalDbBytes = 0;
  let totalRecords = 0;

  for (const t of tablesToScan) {
    try {
      const { data, count, error } = await supabase.from(t.name).select('*', { count: 'exact' });
      if (!error && data) {
        const rowCount = count ?? data.length;
        // Calcular bytes serializados de los registros
        const serialized = JSON.stringify(data);
        const bytes = new Blob([serialized]).size;
        const sizeKB = Number((bytes / 1024).toFixed(2));
        const sizeMB = Number((bytes / (1024 * 1024)).toFixed(3));

        totalDbBytes += bytes;
        totalRecords += rowCount;

        databaseTables.push({
          name: t.name,
          displayName: t.label,
          rows: rowCount,
          bytes,
          sizeKB,
          sizeMB,
        });
      } else {
        databaseTables.push({
          name: t.name,
          displayName: t.label,
          rows: 0,
          bytes: 0,
          sizeKB: 0,
          sizeMB: 0,
        });
      }
    } catch {
      databaseTables.push({
        name: t.name,
        displayName: t.label,
        rows: 0,
        bytes: 0,
        sizeKB: 0,
        sizeMB: 0,
      });
    }
  }

  const storageUsedMB = Number((totalStorageBytes / (1024 * 1024)).toFixed(2));
  const storagePercent = Number(((storageUsedMB / STORAGE_LIMIT_MB) * 100).toFixed(1));

  const databaseTotalKB = Number((totalDbBytes / 1024).toFixed(2));
  const databaseTotalMB = Number((totalDbBytes / (1024 * 1024)).toFixed(3));
  const databasePercent = Number(((databaseTotalMB / DATABASE_LIMIT_MB) * 100).toFixed(2));

  // Determinar severidad del estado
  let status: 'optimal' | 'warning' | 'alert' | 'critical' = 'optimal';
  let isApproachingLimit = false;
  let message = `Almacenamiento: ${storageUsedMB} MB de ${STORAGE_LIMIT_MB} MB (${storagePercent}% en uso) en Storage CDN. Tablas BD: ${databaseTotalKB} KB de ${DATABASE_LIMIT_MB} MB. Capacidad óptima.`;
  let recommendation = 'Tus tablas y almacenamiento en Supabase están en óptimas condiciones.';

  if (storagePercent >= 90 || databasePercent >= 90) {
    status = 'critical';
    isApproachingLimit = true;
    message = `🚨 ¡ALERTA CRÍTICA!: Supabase Storage está al ${storagePercent}% (${storageUsedMB} MB / ${STORAGE_LIMIT_MB} MB).`;
    recommendation = 'Acción urgente: Elimina fotos o videos que no utilices para liberar espacio de inmediato.';
  } else if (storagePercent >= 75 || databasePercent >= 75) {
    status = 'alert';
    isApproachingLimit = true;
    message = `⚠️ Advertencia: Supabase Storage está llegando al límite (${storagePercent}% de 1 GB).`;
    recommendation = 'Te recomendamos no subir videos pesados y utilizar enlaces o comprimir archivos.';
  } else if (storagePercent >= 50 || databasePercent >= 50) {
    status = 'warning';
    isApproachingLimit = true;
    message = `Atención: Has consumido la mitad del almacenamiento gratuito (${storageUsedMB} MB de 1,024 MB).`;
    recommendation = 'Mantén tus fotos optimizadas.';
  }

  return {
    storageUsedBytes: totalStorageBytes,
    storageUsedMB,
    storageLimitMB: STORAGE_LIMIT_MB,
    storagePercent,
    storageFileCount: totalFiles,
    buckets: bucketsDetail,
    databaseTables,
    databaseTotalBytes: totalDbBytes,
    databaseTotalKB,
    databaseTotalMB,
    databaseLimitMB: DATABASE_LIMIT_MB,
    databasePercent,
    totalRecords,
    status,
    isApproachingLimit,
    message,
    recommendation,
  };
}

/**
 * Limpia y optimiza productos que tienen imágenes/videos pesados en Base64 en la base de datos
 */
export async function optimizeHeavyProduct(productId: string | number): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data: prod, error } = await supabase
    .from('productos')
    .select('id, nombre, imagen_url')
    .eq('id', productId)
    .single();

  if (error || !prod || !prod.imagen_url) return false;

  let imgUrl = prod.imagen_url.trim();

  // Si es un array JSON
  if (imgUrl.startsWith('[') && imgUrl.endsWith(']')) {
    try {
      const arr = JSON.parse(imgUrl);
      if (Array.isArray(arr)) {
        // Filtrar elementos que son base64 gigantes > 500KB si ya hay una imagen URL válida
        const cleanedArr = arr.filter((item: string) => {
          if (typeof item === 'string' && item.startsWith('data:') && item.length > 500000) {
            return false;
          }
          return true;
        });

        const newPayload = cleanedArr.length > 1
          ? JSON.stringify(cleanedArr)
          : (cleanedArr[0] || '');

        await supabase
          .from('productos')
          .update({ imagen_url: newPayload, updated_at: new Date().toISOString() })
          .eq('id', productId);

        return true;
      }
    } catch (e) {
      console.warn('Error parsing product images during cleanup:', e);
    }
  }

  return false;
}

// ==========================================
// PRODUCTS CRUD
// ==========================================

export async function getAdminProducts(): Promise<Producto[]> {
  const supabase = getSupabaseClient();

  const { data: prods, error: pErr } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (pErr) throw new Error(`Error al cargar productos: ${pErr.message}`);

  const { data: cats } = await supabase.from('categorias').select('*');
  const catMap = new Map<string, Categoria>();
  if (cats) {
    cats.forEach((c) => {
      catMap.set(String(c.id), c);
      catMap.set(String(c.id).toLowerCase(), c);
    });
  }

  const { data: invs } = await supabase.from('inventario').select('*');
  const invMap = new Map<string, Inventario>();
  if (invs) {
    invs.forEach((i) => {
      invMap.set(String(i.producto_id), i);
    });
  }

  return (prods || []).map((p) => {
    const inv = invMap.get(String(p.id));
    const stockResolved = inv && typeof inv.stock_actual === 'number' ? inv.stock_actual : p.stock;

    let imagenes: string[] = [];
    let primaryImageUrl = p.imagen_url;

    if (p.imagen_url && typeof p.imagen_url === 'string') {
      const trimmed = p.imagen_url.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            imagenes = parsed;
            primaryImageUrl = parsed[0];
          }
        } catch {
          imagenes = [trimmed];
        }
      } else if (trimmed.includes('|||')) {
        imagenes = trimmed.split('|||').map((s: string) => s.trim()).filter(Boolean);
        primaryImageUrl = imagenes[0] || trimmed;
      } else if (trimmed.length > 0) {
        imagenes = [trimmed];
      }
    }

    return {
      ...p,
      stock: stockResolved,
      imagen_url: primaryImageUrl,
      imagenes,
      categoria: catMap.get(String(p.categoria_id)),
    };
  });
}

export async function createAdminProduct(productData: {
  categoria_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number;
  stock: number;
  imagen_url: string;
  imagenes?: string[];
  activo: boolean;
}): Promise<Producto> {
  const supabase = getSupabaseClient();

  // If multiple images are provided, serialize to JSON in imagen_url
  let imagePayload = productData.imagen_url?.trim() || null;
  if (productData.imagenes && productData.imagenes.length > 0) {
    if (productData.imagenes.length > 1) {
      imagePayload = JSON.stringify(productData.imagenes);
    } else {
      imagePayload = productData.imagenes[0];
    }
  }

  const insertPayload = {
    categoria_id: productData.categoria_id,
    nombre: productData.nombre.trim(),
    descripcion: productData.descripcion.trim() || null,
    precio: Number(productData.precio) || 0,
    costo: Number(productData.costo) || 0,
    stock: Number(productData.stock) || 0,
    imagen_url: imagePayload,
    activo: Boolean(productData.activo),
  };

  const { data: newProd, error: pErr } = await supabase
    .from('productos')
    .insert([insertPayload])
    .select()
    .single();

  if (pErr) throw new Error(`Error al guardar producto: ${pErr.message}`);

  // Create or update inventario row
  try {
    await supabase.from('inventario').insert([
      {
        producto_id: newProd.id,
        stock_actual: Number(productData.stock) || 0,
        stock_minimo: 5,
      },
    ]);
  } catch (invErr) {
    console.warn('Inventario sync warning:', invErr);
  }

  return newProd;
}

export async function updateAdminProduct(
  id: string,
  productData: {
    categoria_id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number;
    stock: number;
    imagen_url: string;
    imagenes?: string[];
    activo: boolean;
  }
): Promise<Producto> {
  const supabase = getSupabaseClient();

  // If multiple images are provided, serialize to JSON in imagen_url
  let imagePayload = productData.imagen_url?.trim() || null;
  if (productData.imagenes && productData.imagenes.length > 0) {
    if (productData.imagenes.length > 1) {
      imagePayload = JSON.stringify(productData.imagenes);
    } else {
      imagePayload = productData.imagenes[0];
    }
  }

  const updatePayload = {
    categoria_id: productData.categoria_id,
    nombre: productData.nombre.trim(),
    descripcion: productData.descripcion.trim() || null,
    precio: Number(productData.precio) || 0,
    costo: Number(productData.costo) || 0,
    stock: Number(productData.stock) || 0,
    imagen_url: imagePayload,
    activo: Boolean(productData.activo),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedProd, error: pErr } = await supabase
    .from('productos')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (pErr) throw new Error(`Error al actualizar producto: ${pErr.message}`);

  // Sync inventario
  try {
    const { data: existingInv } = await supabase
      .from('inventario')
      .select('id')
      .eq('producto_id', id)
      .limit(1);

    if (existingInv && existingInv.length > 0) {
      await supabase
        .from('inventario')
        .update({
          stock_actual: Number(productData.stock) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('producto_id', id);
    } else {
      await supabase.from('inventario').insert([
        {
          producto_id: id,
          stock_actual: Number(productData.stock) || 0,
          stock_minimo: 5,
        },
      ]);
    }
  } catch (e) {
    console.warn('Inventario update error:', e);
  }

  return updatedProd;
}

export async function toggleProductActive(id: string, activo: boolean) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('productos')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`);
}

export async function updateProductStock(id: string, newStock: number) {
  const supabase = getSupabaseClient();
  const cleanStock = Math.max(0, Math.floor(newStock));

  const { error: pErr } = await supabase
    .from('productos')
    .update({ stock: cleanStock, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (pErr) throw new Error(`Error al actualizar stock: ${pErr.message}`);

  try {
    await supabase
      .from('inventario')
      .update({ stock_actual: cleanStock, updated_at: new Date().toISOString() })
      .eq('producto_id', id);
  } catch (e) {
    // Ignore if table has strict RLS
  }
}

export async function deleteAdminProduct(id: string | number): Promise<{ success: boolean }> {
  const supabase = getSupabaseClient();
  const cleanId = String(id).trim();
  const numId = Number(cleanId);
  const isNumeric = !isNaN(numId) && cleanId !== '';

  // 1. Eliminar o desvincular referencias en detalle_pedidos para evitar violación de Foreign Key
  try {
    await supabase.from('detalle_pedidos').delete().eq('producto_id', cleanId);
    if (isNumeric) {
      await supabase.from('detalle_pedidos').delete().eq('producto_id', numId);
    }
  } catch (e) {
    console.warn('Aviso detalle_pedidos:', e);
  }

  // 2. Eliminar registros vinculados en inventario
  try {
    await supabase.from('inventario').delete().eq('producto_id', cleanId);
    if (isNumeric) {
      await supabase.from('inventario').delete().eq('producto_id', numId);
    }
  } catch (e) {
    console.warn('Aviso inventario:', e);
  }

  // 3. Eliminar físicamente el producto de la tabla productos en Supabase
  let res = await supabase.from('productos').delete().eq('id', cleanId);
  if (res.error && isNumeric) {
    res = await supabase.from('productos').delete().eq('id', numId);
  }

  if (res.error) {
    console.error('Error al eliminar producto en Supabase:', res.error);
    // Fallback: si RLS o un constraint bloquea el DELETE físico, desactivarlo
    try {
      await supabase.from('productos').update({ activo: false, updated_at: new Date().toISOString() }).eq('id', cleanId);
    } catch {}
    throw new Error(`Error al eliminar de Supabase: ${res.error.message}`);
  }

  return { success: true };
}

export async function deleteAdminSale(orderId: string | number): Promise<{ success: boolean }> {
  const supabase = getSupabaseClient();
  const cleanId = String(orderId).trim();
  const numId = Number(cleanId);
  const isNumeric = !isNaN(numId) && cleanId !== '';

  // 1. Eliminar items de detalle_pedidos asociados a este pedido
  try {
    await supabase.from('detalle_pedidos').delete().eq('pedido_id', cleanId);
    if (isNumeric) {
      await supabase.from('detalle_pedidos').delete().eq('pedido_id', numId);
    }
  } catch (e) {
    console.warn('Aviso detalle_pedidos:', e);
  }

  // 2. Eliminar de tabla ventas si existiese
  try {
    await supabase.from('ventas').delete().eq('pedido_id', cleanId);
    await supabase.from('ventas').delete().eq('id', cleanId);
    if (isNumeric) {
      await supabase.from('ventas').delete().eq('pedido_id', numId);
      await supabase.from('ventas').delete().eq('id', numId);
    }
  } catch {}

  // 3. Eliminar pedido de la tabla pedidos en Supabase
  let res = await supabase.from('pedidos').delete().eq('id', cleanId);
  if (res.error && isNumeric) {
    res = await supabase.from('pedidos').delete().eq('id', numId);
  }

  if (res.error) {
    console.error('Error al eliminar pedido en Supabase:', res.error);
    throw new Error(`Error al eliminar pedido en Supabase: ${res.error.message}`);
  }

  return { success: true };
}

// ==========================================
// CATEGORIES CRUD
// ==========================================

export async function getAdminCategories(): Promise<Categoria[]> {
  const supabase = getSupabaseClient();

  const { data: cats, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al cargar categorías: ${error.message}`);

  // Count products per category
  try {
    const { data: prods } = await supabase.from('productos').select('categoria_id');
    const countMap: Record<string, number> = {};
    if (prods) {
      prods.forEach((p) => {
        countMap[p.categoria_id] = (countMap[p.categoria_id] || 0) + 1;
      });
    }

    return (cats || []).map((c) => ({
      ...c,
      total_productos: countMap[c.id] || 0,
    }));
  } catch (e) {
    return cats || [];
  }
}

export async function createAdminCategory(categoryData: {
  nombre: string;
  descripcion?: string;
  activa: boolean;
}): Promise<Categoria> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('categorias')
    .insert([
      {
        nombre: categoryData.nombre.trim(),
        descripcion: categoryData.descripcion?.trim() || null,
        activa: Boolean(categoryData.activa),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error al crear categoría: ${error.message}`);
  return data;
}

export async function updateAdminCategory(
  id: string,
  categoryData: {
    nombre: string;
    descripcion?: string;
    activa: boolean;
  }
): Promise<Categoria> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('categorias')
    .update({
      nombre: categoryData.nombre.trim(),
      descripcion: categoryData.descripcion?.trim() || null,
      activa: Boolean(categoryData.activa),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar categoría: ${error.message}`);
  return data;
}

export async function toggleCategoryActive(id: string, activa: boolean) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('categorias')
    .update({ activa })
    .eq('id', id);

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`);
}

export async function deleteAdminCategory(id: string) {
  const supabase = getSupabaseClient();

  // Check if products exist in category
  const { data: prods } = await supabase
    .from('productos')
    .select('id')
    .eq('categoria_id', id)
    .limit(1);

  if (prods && prods.length > 0) {
    throw new Error('No se puede eliminar la categoría porque tiene productos asociados. Reasigna o elimina los productos primero.');
  }

  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw new Error(`Error al eliminar categoría: ${error.message}`);
}

// ==========================================
// INVENTORY CRUD
// ==========================================

export interface InventoryItemRow {
  id: string; // Inventario ID or Product ID
  producto_id: string;
  nombre_producto: string;
  imagen_url: string | null;
  categoria_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
  activo: boolean;
}

export async function getAdminInventory(): Promise<InventoryItemRow[]> {
  const supabase = getSupabaseClient();

  const { data: prods, error: pErr } = await supabase
    .from('productos')
    .select('id, nombre, imagen_url, precio, stock, activo, categoria_id');

  if (pErr) throw new Error(`Error cargando inventario: ${pErr.message}`);

  const { data: cats } = await supabase.from('categorias').select('id, nombre');
  const catMap = new Map<string, string>();
  if (cats) cats.forEach((c) => catMap.set(c.id, c.nombre));

  const { data: invs } = await supabase.from('inventario').select('*');
  const invMap = new Map<string, { id: string; stock_actual: number; stock_minimo: number }>();
  if (invs) {
    invs.forEach((i) => {
      invMap.set(i.producto_id, {
        id: i.id,
        stock_actual: i.stock_actual,
        stock_minimo: i.stock_minimo || 5,
      });
    });
  }

  return (prods || []).map((p) => {
    const inv = invMap.get(p.id);
    return {
      id: inv?.id || p.id,
      producto_id: p.id,
      nombre_producto: p.nombre,
      imagen_url: p.imagen_url,
      categoria_nombre: catMap.get(p.categoria_id) || 'Sin categoría',
      stock_actual: inv ? inv.stock_actual : (p.stock || 0),
      stock_minimo: inv ? inv.stock_minimo : 5,
      precio: p.precio,
      activo: p.activo,
    };
  });
}

export async function updateInventoryStock(
  productoId: string,
  stockActual: number,
  stockMinimo = 5
) {
  const supabase = getSupabaseClient();
  const cleanActual = Math.max(0, Math.floor(stockActual));
  const cleanMin = Math.max(0, Math.floor(stockMinimo));

  // Update product stock
  await supabase
    .from('productos')
    .update({ stock: cleanActual, updated_at: new Date().toISOString() })
    .eq('id', productoId);

  // Update or insert inventario
  const { data: existing } = await supabase
    .from('inventario')
    .select('id')
    .eq('producto_id', productoId)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('inventario')
      .update({
        stock_actual: cleanActual,
        stock_minimo: cleanMin,
        updated_at: new Date().toISOString(),
      })
      .eq('producto_id', productoId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('inventario').insert([
      {
        producto_id: productoId,
        stock_actual: cleanActual,
        stock_minimo: cleanMin,
      },
    ]);
    if (error) throw new Error(error.message);
  }
}

// ==========================================
// ORDERS CRUD
// ==========================================

export async function getAdminOrders(statusFilter?: EstadoPedido): Promise<Pedido[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('estado', statusFilter);
  }

  const { data: orders, error: oErr } = await query;
  if (oErr) throw new Error(`Error al consultar pedidos: ${oErr.message}`);

  // Fetch clients to cross-reference
  const { data: clients } = await supabase.from('clientes').select('*');
  const clientMap = new Map<string, Cliente>();
  if (clients) clients.forEach((c) => clientMap.set(c.id, c));

  // Fetch detail lines
  const { data: details } = await supabase.from('detalle_pedidos').select('*');
  const { data: prods } = await supabase.from('productos').select('id, nombre, imagen_url, precio');
  const prodMap = new Map<string, Producto>();
  if (prods) prods.forEach((p) => prodMap.set(p.id, p as Producto));

  const detailsByOrder: Record<string, DetallePedido[]> = {};
  if (details) {
    details.forEach((d) => {
      if (!detailsByOrder[d.pedido_id]) {
        detailsByOrder[d.pedido_id] = [];
      }
      detailsByOrder[d.pedido_id].push({
        ...d,
        producto: prodMap.get(d.producto_id),
      });
    });
  }

  return (orders || []).map((o) => ({
    ...o,
    cliente: o.cliente_id ? clientMap.get(o.cliente_id) : undefined,
    detalles: detailsByOrder[o.id] || [],
  }));
}

export async function updateOrderStatus(orderId: string, estado: EstadoPedido) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('pedidos')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(`Error al actualizar estado del pedido: ${error.message}`);
}

// ==========================================
// CLIENTS
// ==========================================

export async function getAdminClients(): Promise<Cliente[]> {
  const supabase = getSupabaseClient();

  const { data: clients, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar clientes: ${error.message}`);

  // Cross-reference with pedidos
  const { data: orders } = await supabase
    .from('pedidos')
    .select('id, cliente_id, total, created_at, estado');

  const statsByClient: Record<string, { count: number; total: number; latest: string }> = {};
  if (orders) {
    orders.forEach((o) => {
      if (o.cliente_id !== null && o.cliente_id !== undefined) {
        const cKey = String(o.cliente_id);
        if (!statsByClient[cKey]) {
          statsByClient[cKey] = { count: 0, total: 0, latest: o.created_at || '' };
        }
        statsByClient[cKey].count += 1;
        if (o.estado !== 'cancelado') {
          statsByClient[cKey].total += Number(o.total) || 0;
        }
        if ((o.created_at || '') > statsByClient[cKey].latest) {
          statsByClient[cKey].latest = o.created_at || '';
        }
      }
    });
  }

  return (clients || []).map((c) => {
    const cId = String(c.id);
    return {
      ...c,
      id: cId,
      nombre: c.nombre || 'Cliente sin nombre',
      email: c.email || '',
      telefono: c.telefono || '',
      pedidos_count: statsByClient[cId]?.count || 0,
      total_gastado: statsByClient[cId]?.total || 0,
      ultimo_pedido: statsByClient[cId]?.latest || c.created_at,
    };
  });
}

export async function deleteAdminClient(clientId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const cId = String(clientId);

  // Desvincular pedidos del cliente primero para evitar restricción de clave foránea
  try {
    await supabase
      .from('pedidos')
      .update({ cliente_id: null })
      .eq('cliente_id', cId);
  } catch (unlinkErr) {
    console.warn('Advertencia desvinculando pedidos del cliente:', unlinkErr);
  }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', cId);

  if (error) {
    throw new Error(`Error al eliminar cliente: ${error.message}`);
  }
}

// ==========================================
// VENTAS / SALES
// ==========================================

export interface ManualSaleItem {
  producto_id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CreateManualSalePayload {
  cliente_id?: string | null;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  items: ManualSaleItem[];
  subtotal: number;
  total: number;
  metodo_pago: MetodoPago;
  tipo_entrega?: TipoEntrega;
  courier?: CourierOption;
  notas?: string;
  fecha?: string;
  estado?: EstadoPedido;
}

export async function createManualSale(payload: CreateManualSalePayload): Promise<{ orderId: string }> {
  const supabase = getSupabaseClient();

  let resolvedClientId: string | null = payload.cliente_id ? String(payload.cliente_id) : null;

  // Si no se seleccionó un cliente existente pero se ingresó información, buscar o crear cliente
  if (!resolvedClientId && (payload.cliente_nombre || payload.cliente_email || payload.cliente_telefono)) {
    try {
      const emailTrimmed = (payload.cliente_email || '').trim().toLowerCase();
      if (emailTrimmed) {
        const { data: existing } = await supabase
          .from('clientes')
          .select('id')
          .eq('email', emailTrimmed)
          .limit(1);
        if (existing && existing.length > 0) {
          resolvedClientId = String(existing[0].id);
        }
      }

      if (!resolvedClientId) {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert([
            {
              nombre: (payload.cliente_nombre || 'Cliente Venta Directa').trim(),
              email: emailTrimmed || `cliente-${Date.now()}@aura.local`,
              telefono: (payload.cliente_telefono || '').trim(),
              direccion: (payload.cliente_direccion || 'Venta en tienda').trim(),
            },
          ])
          .select('id')
          .single();

        if (!clientErr && newClient) {
          resolvedClientId = String(newClient.id);
        }
      }
    } catch (cErr) {
      console.warn('Error gestionando cliente para venta manual:', cErr);
    }
  }

  const saleDate = payload.fecha ? new Date(payload.fecha).toISOString() : new Date().toISOString();

  // 1. Crear el pedido
  const { data: orderData, error: orderErr } = await supabase
    .from('pedidos')
    .insert([
      {
        cliente_id: resolvedClientId,
        subtotal: Number(payload.subtotal) || 0,
        total: Number(payload.total) || 0,
        estado: payload.estado || 'entregado',
        metodo_pago: payload.metodo_pago || 'efectivo',
        tipo_entrega: payload.tipo_entrega || 'retiro',
        courier: payload.courier || null,
        notas: payload.notas ? `[Venta Manual] ${payload.notas}` : '[Venta Manual]',
        direccion: payload.cliente_direccion || 'Venta directa en tienda',
        created_at: saleDate,
        updated_at: saleDate,
      },
    ])
    .select()
    .single();

  if (orderErr) {
    throw new Error(`Error al registrar venta en pedidos: ${orderErr.message}`);
  }

  const orderId = orderData.id;

  // 2. Crear registros de detalle si hay productos
  if (payload.items && payload.items.length > 0) {
    const details = payload.items
      .filter((it) => it.producto_id)
      .map((it) => ({
        pedido_id: orderId,
        producto_id: it.producto_id,
        cantidad: Number(it.cantidad) || 1,
        precio_unitario: Number(it.precio_unitario) || 0,
        subtotal: Number(it.subtotal) || (Number(it.cantidad) * Number(it.precio_unitario)),
      }));

    if (details.length > 0) {
      const { error: detailsErr } = await supabase.from('detalle_pedidos').insert(details);
      if (detailsErr) {
        console.warn('Error al registrar detalle_pedidos en venta manual:', detailsErr.message);
      }
    }

    // 3. Descontar stock
    for (const it of payload.items) {
      if (!it.producto_id) continue;
      const qty = Number(it.cantidad) || 1;
      try {
        const { data: curInv } = await supabase
          .from('inventario')
          .select('id, stock_actual')
          .eq('producto_id', it.producto_id)
          .limit(1);

        if (curInv && curInv.length > 0) {
          const newStock = Math.max(0, (curInv[0].stock_actual || 0) - qty);
          await supabase
            .from('inventario')
            .update({ stock_actual: newStock, updated_at: new Date().toISOString() })
            .eq('producto_id', it.producto_id);
          await supabase
            .from('productos')
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', it.producto_id);
        } else {
          const { data: curProd } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', it.producto_id)
            .single();
          if (curProd) {
            const newStock = Math.max(0, (curProd.stock || 0) - qty);
            await supabase
              .from('productos')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', it.producto_id);
          }
        }
      } catch (stkErr) {
        console.warn('Error actualizando stock en venta manual:', stkErr);
      }
    }
  }

  // 4. Registrar en la tabla ventas si está disponible
  try {
    await supabase.from('ventas').insert([
      {
        pedido_id: orderId,
        total: Number(payload.total) || 0,
        fecha: saleDate,
        created_at: saleDate,
      },
    ]);
  } catch (vErr) {
    console.warn('Tabla ventas no disponible o restringida:', vErr);
  }

  return { orderId };
}

export async function getAdminSales() {
  const supabase = getSupabaseClient();

  const { data: orders, error } = await supabase
    .from('pedidos')
    .select('*')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar ventas: ${error.message}`);

  const { data: clients } = await supabase.from('clientes').select('id, nombre, email, telefono, direccion');
  const clientMap = new Map<string, Cliente>();
  if (clients) clients.forEach((c) => clientMap.set(c.id, c));

  return (orders || []).map((o) => ({
    id: o.id,
    pedido_id: o.id,
    fecha: o.created_at,
    total: Number(o.total) || 0,
    subtotal: Number(o.subtotal) || 0,
    metodo_pago: o.metodo_pago,
    cliente: o.cliente_id ? clientMap.get(o.cliente_id) : undefined,
    estado: o.estado,
  }));
}

// ==========================================
// STORE CONFIGURATION & HERO VIDEO
// ==========================================

const CONFIG_STORAGE_KEY = 'elegance_store_config';

export function getLocalStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure the watch photo is permanently eliminated
      if (parsed.hero_poster_url) {
        parsed.hero_poster_url = '';
      }
      if (!parsed.hero_video_url || parsed.hero_video_url.includes('mixkit') || parsed.hero_video_url.includes('2026-09-23')) {
        parsed.hero_video_url = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';
      }
      if (!parsed.logo_url || parsed.logo_url === '/images/logo/logo.png') {
        parsed.logo_url = '/images/logo/logotipo.jpeg';
      }
      return { ...DEFAULT_STORE_CONFIG, ...parsed, hero_poster_url: '' };
    }
  } catch (e) {}
  return DEFAULT_STORE_CONFIG;
}

export function saveLocalStoreConfig(config: StoreConfig) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

export interface ProjectMediaOption {
  label: string;
  value: string;
}

export const PROJECT_MEDIA_OPTIONS = {
  products: [] as ProjectMediaOption[],
  categories: [] as ProjectMediaOption[],
  logo: [
    { label: 'Logotipo Oficial Aura (/images/logo/logotipo.jpeg)', value: '/images/logo/logotipo.jpeg' },
    { label: 'Logo PNG Aura (/images/logo/logo.png)', value: '/images/logo/logo.png' },
  ],
  banners: [
    { label: 'Banner 1 (/images/banners/banner-1.jpg)', value: '/images/banners/banner-1.jpg' },
    { label: 'Banner 2 (/images/banners/banner-2.jpg)', value: '/images/banners/banner-2.jpg' },
  ],
  videos: [
    { label: 'Video WhatsApp Oficial (/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4)', value: '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4' },
    { label: 'Video Hero Alias (/videos/hero.mp4)', value: '/videos/hero.mp4' },
  ],
};
