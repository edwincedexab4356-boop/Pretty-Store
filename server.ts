import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const uploadsDir = path.resolve(__dirname, 'public', 'uploads', 'vouchers');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const imagesDir = path.resolve(__dirname, 'public', 'uploads', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Serve uploads statically with open CORS and cache
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(path.resolve(__dirname, 'public', 'uploads')));

  const dataDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const ordersFilePath = path.join(dataDir, 'orders.json');
  const productsFilePath = path.join(dataDir, 'products.json');
  const novedadesFilePath = path.join(dataDir, 'novedades.json');

  const getStoredOrders = (): any[] => {
    try {
      if (fs.existsSync(ordersFilePath)) {
        return JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error reading orders.json:', e);
    }
    return [];
  };

  const saveStoredOrders = (orders: any[]) => {
    try {
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Error writing orders.json:', e);
    }
  };

  const getStoredProducts = (): any[] => {
    try {
      if (fs.existsSync(productsFilePath)) {
        return JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error reading products.json:', e);
    }
    return [];
  };

  const saveStoredProducts = (products: any[]) => {
    try {
      fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Error writing products.json:', e);
    }
  };

  const getStoredNovedades = (): any[] => {
    try {
      if (fs.existsSync(novedadesFilePath)) {
        return JSON.parse(fs.readFileSync(novedadesFilePath, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error reading novedades.json:', e);
    }
    return [];
  };

  const saveStoredNovedades = (novedades: any[]) => {
    try {
      fs.writeFileSync(novedadesFilePath, JSON.stringify(novedades, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Error writing novedades.json:', e);
    }
  };

  // API endpoint for uploading payment vouchers
  app.post('/api/upload-voucher', (req, res) => {
    try {
      const { image, orderNumber, clientOrigin } = req.body;
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'No image provided' });
      }

      if (image.startsWith('http://') || image.startsWith('https://')) {
        return res.json({ url: image });
      }

      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid image format' });
      }

      const mimeType = matches[1].toLowerCase();
      let ext = 'jpg';
      if (mimeType.includes('pdf')) {
        ext = 'pdf';
      } else if (mimeType.includes('png')) {
        ext = 'png';
      } else if (mimeType.includes('webp')) {
        ext = 'webp';
      } else if (mimeType.includes('gif')) {
        ext = 'gif';
      } else if (mimeType.includes('svg')) {
        ext = 'svg';
      } else {
        ext = 'jpg';
      }
      const buffer = Buffer.from(matches[2], 'base64');
      const safeOrderNum = (orderNumber || 'pago').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `comprobante_${safeOrderNum}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      let publicUrl = '';
      if (clientOrigin && (clientOrigin.startsWith('http://') || clientOrigin.startsWith('https://'))) {
        publicUrl = `${clientOrigin.replace(/\/+$/, '')}/uploads/vouchers/${filename}`;
      } else {
        const proto = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        publicUrl = `${proto}://${host}/uploads/vouchers/${filename}`;
      }

      return res.json({ url: publicUrl, filename });
    } catch (err: any) {
      console.error('Error in /api/upload-voucher:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // API endpoint for uploading product & novedad images from user's device
  app.post('/api/upload-image', (req, res) => {
    try {
      const { image, filename: clientFilename, prefix = 'img' } = req.body;
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'No image provided' });
      }

      if (image.startsWith('http://') || image.startsWith('https://')) {
        return res.json({ url: image });
      }

      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 image format' });
      }

      const mimeType = matches[1].toLowerCase();
      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('svg')) ext = 'svg';

      const buffer = Buffer.from(matches[2], 'base64');
      const safePrefix = (prefix || 'img').replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `${safePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(imagesDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/images/${uniqueFilename}`;
      return res.json({ url: publicUrl, filename: uniqueFilename, success: true });
    } catch (err: any) {
      console.error('Error in /api/upload-image:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Cross-device orders sync backup
  app.get('/api/orders', (_req, res) => {
    res.json(getStoredOrders());
  });

  app.post('/api/orders', (req, res) => {
    try {
      const newOrder = req.body;
      if (!newOrder || !newOrder.id) {
        return res.status(400).json({ error: 'Invalid order data' });
      }
      const orders = getStoredOrders();
      const existingIdx = orders.findIndex((o) => String(o.id) === String(newOrder.id));
      if (existingIdx >= 0) {
        orders[existingIdx] = { ...orders[existingIdx], ...newOrder, updated_at: new Date().toISOString() };
      } else {
        orders.unshift({ ...newOrder, created_at: newOrder.created_at || new Date().toISOString() });
      }
      saveStoredOrders(orders);
      return res.json({ success: true, order: newOrder });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/orders', (_req, res) => {
    try {
      saveStoredOrders([]);
      return res.json({ success: true, count: 0 });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      const orders = getStoredOrders();
      const filtered = orders.filter((o) => String(o.id) !== String(id) && o.numero_orden !== id);
      saveStoredOrders(filtered);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Helper function to persist base64 data to static file if needed
  const persistBase64ImageIfNeeded = (imgUrl: string, prefix = 'nov'): string => {
    if (!imgUrl || typeof imgUrl !== 'string') return imgUrl;
    if (!imgUrl.startsWith('data:image/')) return imgUrl;

    try {
      const matches = imgUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return imgUrl;

      const mimeType = matches[1].toLowerCase();
      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('svg')) ext = 'svg';

      const buffer = Buffer.from(matches[2], 'base64');
      const uniqueFilename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(imagesDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/images/${uniqueFilename}`;
    } catch (e) {
      console.warn('Error saving base64 image to disk:', e);
      return imgUrl;
    }
  };

  // Novedades persistent cross-device endpoints
  app.get('/api/novedades', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
      const list = getStoredNovedades();
      return res.json(list);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/novedades', (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.id) {
        return res.status(400).json({ error: 'Invalid novedad data' });
      }

      // Convert any base64 image to static file on disk
      if (item.imagen_url && item.imagen_url.startsWith('data:image/')) {
        item.imagen_url = persistBase64ImageIfNeeded(item.imagen_url, 'nov');
      }

      const list = getStoredNovedades();
      const idx = list.findIndex((n) => String(n.id) === String(item.id));
      let savedItem: any;
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, updated_at: new Date().toISOString() };
        savedItem = list[idx];
      } else {
        savedItem = { ...item, created_at: item.created_at || new Date().toISOString() };
        list.push(savedItem);
      }
      // Sort by order
      list.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      saveStoredNovedades(list);
      return res.json({ success: true, item: savedItem });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/novedades/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      if (updates.imagen_url && updates.imagen_url.startsWith('data:image/')) {
        updates.imagen_url = persistBase64ImageIfNeeded(updates.imagen_url, 'nov');
      }

      const list = getStoredNovedades();
      const idx = list.findIndex((n) => String(n.id) === String(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, id, updated_at: new Date().toISOString() };
        list.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        saveStoredNovedades(list);
        return res.json({ success: true, item: list[idx] });
      } else {
        const newItem = { ...updates, id, created_at: new Date().toISOString() };
        list.push(newItem);
        list.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        saveStoredNovedades(list);
        return res.json({ success: true, item: newItem });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/novedades/sync', (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items must be an array' });
      }

      const list = getStoredNovedades();
      const map = new Map<string, any>();
      for (const item of list) {
        if (item && item.id) map.set(String(item.id), item);
      }

      for (const clientItem of items) {
        if (!clientItem || !clientItem.id) continue;
        if (clientItem.imagen_url && clientItem.imagen_url.startsWith('data:image/')) {
          clientItem.imagen_url = persistBase64ImageIfNeeded(clientItem.imagen_url, 'nov');
        }
        const existing = map.get(String(clientItem.id));
        map.set(String(clientItem.id), {
          ...existing,
          ...clientItem,
          updated_at: new Date().toISOString(),
        });
      }

      const merged = Array.from(map.values()).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      saveStoredNovedades(merged);
      return res.json({ success: true, items: merged });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/novedades', (_req, res) => {
    try {
      saveStoredNovedades([]);
      return res.json({ success: true, count: 0 });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/novedades/:id', (req, res) => {
    try {
      const { id } = req.params;
      const list = getStoredNovedades();
      const filtered = list.filter((n) => String(n.id) !== String(id));
      saveStoredNovedades(filtered);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Storage and DB capacity endpoint
  app.get('/api/storage-stats', (_req, res) => {
    try {
      const countDirImages = (dir: string): { count: number; bytes: number } => {
        let count = 0;
        let bytes = 0;
        try {
          if (!fs.existsSync(dir)) return { count, bytes };
          const items = fs.readdirSync(dir);
          for (const it of items) {
            const full = path.join(dir, it);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
              const sub = countDirImages(full);
              count += sub.count;
              bytes += sub.bytes;
            } else if (/\.(jpg|jpeg|png|webp|svg|gif|pdf)$/i.test(it)) {
              count += 1;
              bytes += stat.size;
            }
          }
        } catch {}
        return { count, bytes };
      };

      const vouchersStat = countDirImages(uploadsDir);
      const publicImagesStat = countDirImages(path.resolve(__dirname, 'public', 'images'));

      const totalLocalFilesCount = vouchersStat.count + publicImagesStat.count;
      const totalLocalFilesBytes = vouchersStat.bytes + publicImagesStat.bytes;

      const orders = getStoredOrders();
      const products = getStoredProducts();

      // Supabase Free Tier Limits:
      // Database: 500 MB (524,288 KB)
      // Storage: 1 GB (1,048,576 KB)
      const storageUsedMb = totalLocalFilesBytes / (1024 * 1024);
      const storageLimitMb = 1000;
      const storageFreeMb = Math.max(0, storageLimitMb - storageUsedMb);
      const storagePercent = (storageUsedMb / storageLimitMb) * 100;

      // Estimated DB size based on records
      const estimatedDbBytes = (orders.length * 4096) + (products.length * 2048) + 1048576; // base 1MB schema
      const dbUsedMb = estimatedDbBytes / (1024 * 1024);
      const dbLimitMb = 500;
      const dbFreeMb = Math.max(0, dbLimitMb - dbUsedMb);
      const dbPercent = (dbUsedMb / dbLimitMb) * 100;

      return res.json({
        storage: {
          usedMb: Number(storageUsedMb.toFixed(2)),
          freeMb: Number(storageFreeMb.toFixed(2)),
          totalMb: storageLimitMb,
          percent: Number(storagePercent.toFixed(2)),
          filesCount: totalLocalFilesCount,
          vouchersCount: vouchersStat.count,
          localAssetsCount: publicImagesStat.count,
        },
        database: {
          usedMb: Number(dbUsedMb.toFixed(2)),
          freeMb: Number(dbFreeMb.toFixed(2)),
          totalMb: dbLimitMb,
          percent: Number(dbPercent.toFixed(2)),
          ordersCount: orders.length,
          productsCount: products.length,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Cross-device products sync backup
  app.get('/api/products', (_req, res) => {
    res.json(getStoredProducts());
  });

  app.post('/api/products', (req, res) => {
    try {
      const product = req.body;
      if (!product || !product.nombre) {
        return res.status(400).json({ error: 'Product name required' });
      }
      const products = getStoredProducts();
      const id = product.id || `prod_${Date.now()}`;
      const prodWithId = { ...product, id };
      const idx = products.findIndex((p) => String(p.id) === String(id));
      if (idx >= 0) {
        products[idx] = prodWithId;
      } else {
        products.unshift(prodWithId);
      }
      saveStoredProducts(products);
      return res.json({ success: true, product: prodWithId });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const products = getStoredProducts();
      const filtered = products.filter((p) => String(p.id) !== String(id));
      saveStoredProducts(filtered);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
