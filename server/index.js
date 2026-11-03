import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Static site
app.use(express.static(root, { extensions: ['html'] }));
// uploads
app.use('/uploads', express.static(path.join(root, 'uploads')));
// public assets (logo, favicon)
app.use(express.static(path.join(root, 'public')));

// API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// Health
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, time: new Date().toISOString(), db: true });
  } catch {
    res.json({ ok: true, time: new Date().toISOString(), db: false });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Lumora running: http://localhost:${PORT}`);
  if (!process.env.DATABASE_URL) {
    console.warn('[!] DATABASE_URL belum diset - endpoint yang akses DB akan gagal. Jalankan: node server/init-db.js & set DATABASE_URL');
  } else {
    console.log('[OK] Koneksi Postgres via DATABASE_URL');
  }
});
