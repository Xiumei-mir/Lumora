import pg from 'pg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Pool = pg.Pool;

// Koneksi Postgres (via Neon) — ambil dari environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

export default pool;