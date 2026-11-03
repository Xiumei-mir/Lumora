import pool from './db.js';

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client',
        phone TEXT,
        segment TEXT,
        company TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        segment TEXT,
        service TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        service_id INTEGER REFERENCES services(id),
        package_name TEXT,
        status TEXT NOT NULL DEFAULT 'menunggu_pembayaran',
        priority TEXT DEFAULT 'normal',
        total NUMERIC,
        paid NUMERIC DEFAULT 0,
        brief TEXT,
        assigned_to INTEGER REFERENCES users(id),
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS order_events (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        status TEXT NOT NULL,
        note TEXT,
        actor TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        method TEXT,
        amount NUMERIC,
        status TEXT DEFAULT 'pending',
        reference TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        user_id INTEGER REFERENCES users(id),
        kind TEXT DEFAULT 'upload',
        filename TEXT NOT NULL,
        stored_path TEXT NOT NULL,
        size INTEGER,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        sender_id INTEGER REFERENCES users(id),
        body TEXT NOT NULL,
        attachment_id INTEGER REFERENCES files(id),
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT,
        email TEXT,
        slot TEXT,
        duration INTEGER DEFAULT 30,
        method TEXT DEFAULT 'zoom',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Seed services
    const svc = [
      ['olah-data', 'Olah Data & Analisis Statistik'],
      ['desain-penelitian', 'Desain Penelitian & Survei'],
      ['pendampingan', 'Pendampingan Skripsi & Jurnal'],
      ['data-science', 'Data Science & BI'],
      ['pelatihan', 'Pelatihan & Workshop'],
      ['custom', 'Penawaran Custom']
    ];
    for (const [k, t] of svc) {
      await client.query(
        'INSERT INTO services (key, title) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [k, t]
      );
    }

    console.log('Schema + seed OK.');
  } finally {
    client.release();
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});