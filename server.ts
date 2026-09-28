import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawUrl = (process.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isUsableUrl = (u: string) =>
  Boolean(u && u.startsWith('https://') && !u.includes('placeholder') && !u.includes('your-project-id') && !u.includes('xypdbyccffztaxnvgvrl'));

const isUsableKey = (k: string) =>
  Boolean(k && k.startsWith('eyJ') && !k.includes('placeholder'));

const SUPABASE_URL = isUsableUrl(rawUrl) ? rawUrl : 'https://jlxlbdyerlphrcjxhros.supabase.co';
const SUPABASE_ANON_KEY = isUsableKey(rawKey)
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpseGxiZHllcmxwaHJjanhocm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk1OTEsImV4cCI6MjEwNjE1NTU5MX0.7D8RwYfNs6U3E5wcA-diT8HRvZu6_C2n1CDPJSuyIvc';

const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Max body limit for uploads (up to 15MB base64 for 10MB video)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Auth Proxy: Bypasses browser AdBlockers, Brave Shields, and iframe CORS
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Faltan credenciales requeridas.' });
      }
      const { data, error } = await serverSupabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Error en el servidor de autenticación.' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Faltan credenciales requeridas.' });
      }
      const { data, error } = await serverSupabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nombre: name || email.split('@')[0],
            rol: 'admin',
          },
        },
      });
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Error en el servidor de registro.' });
    }
  });

  // Ensure public/videos directory exists
  const videosDir = path.resolve(__dirname, 'public/videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  // Allowed media extensions for uploads
  const ALLOWED_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp']);

  // Upload endpoint for videos & media
  app.post('/api/upload', (req, res) => {
    try {
      const { filename, base64 } = req.body;
      if (!filename || !base64 || typeof filename !== 'string' || typeof base64 !== 'string') {
        return res.status(400).json({ error: 'Faltan datos de archivo válidos.' });
      }

      const ext = path.extname(filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({
          error: `Formato de archivo "${ext}" no permitido. Formatos permitidos: mp4, webm, mov, jpg, png, webp.`,
        });
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

      const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const safeFilename = `${Date.now()}_${cleanBase}${ext}`;
      const filePath = path.join(videosDir, safeFilename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/videos/${safeFilename}`;
      return res.json({ url: publicUrl, filename: safeFilename, size: buffer.length });
    } catch {
      return res.status(500).json({ error: 'Error procesando archivo en el servidor.' });
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
