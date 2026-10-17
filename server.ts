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
