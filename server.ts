import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Max body limit for uploads (up to 15MB base64 for 10MB video)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Ensure public/videos directory exists
  const videosDir = path.resolve(__dirname, 'public/videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  // Upload endpoint for videos & media
  app.post('/api/upload', (req, res) => {
    try {
      const { filename, base64 } = req.body;
      if (!filename || !base64) {
        return res.status(400).json({ error: 'Faltan datos de archivo (filename o base64).' });
      }

      // Extract raw base64 data if it has data URL prefix
      const matches = base64.match(/^data:([A-Za-z-+\/0-9]+);base64,(.+)$/);
      const rawBase64 = matches ? matches[2] : base64;
      const buffer = Buffer.from(rawBase64, 'base64');

      // Check max size 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: `El archivo supera el límite de 10MB (${(buffer.length / (1024 * 1024)).toFixed(1)}MB).`,
        });
      }

      const ext = path.extname(filename) || '.mp4';
      const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const safeFilename = `${Date.now()}_${cleanBase}${ext}`;
      const filePath = path.join(videosDir, safeFilename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/videos/${safeFilename}`;
      console.log(`[Upload API] Video guardado exitosamente: ${publicUrl} (${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`);
      return res.json({ url: publicUrl, filename: safeFilename, size: buffer.length });
    } catch (err: any) {
      console.error('[Upload API] Error guardando archivo:', err);
      return res.status(500).json({ error: err?.message || 'Error al guardar archivo en el servidor.' });
    }
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
