// Seed akun demo (Postgres)
import pool from './db.js';
import { hashPassword } from './auth.js';

async function main() {
  const users = [
    { name: 'Admin Lumora', email: 'admin@lumora.id', password: 'admin123', role: 'admin' },
    { name: 'Reza Aditya', email: 'reza@lumora.id', password: 'reza123', role: 'statistician' },
    { name: 'Dewi Mahasiswa', email: 'dewi@mail.com', password: 'dewi123', role: 'client', segment: 'Mahasiswa / Akademisi' }
  ];

  for (const u of users) {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [u.email]);
    if (existing.rows.length) { console.log('skip', u.email); continue; }
    const hash = await hashPassword(u.password);
    const info = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,segment) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [u.name, u.email, hash, u.role, u.segment || null]
    );
    console.log('created', u.email, 'id', info.rows[0].id, u.role);
  }

  // sample order
  const dewi = await pool.query('SELECT id FROM users WHERE email=$1', ['dewi@mail.com']);
  const dewiId = dewi.rows[0]?.id;
  if (dewiId) {
    const existing = await pool.query('SELECT id FROM orders WHERE code=$1', ['LUM-DEMO1']);
    if (!existing.rows.length) {
      await pool.query(
        `INSERT INTO orders (code,user_id,service_id,package_name,total,paid,status,brief,assigned_to,due_date)
         VALUES ('LUM-DEMO1',$1,3,'Paket Tesis & Jurnal',2400000,1200000,'dalam_pengerjaan','Analisis SEM PLS untuk tesis','2','2026-12-15')`,
        [dewiId]
      );
      await pool.query(
        `INSERT INTO order_events (order_id,status,note,actor) VALUES ((SELECT id FROM orders WHERE code='LUM-DEMO1'),'dalam_pengerjaan','Demo seed','admin')`
      );
      await pool.query(
        `INSERT INTO payments (order_id,method,amount,status,reference) VALUES ((SELECT id FROM orders WHERE code='LUM-DEMO1'),'VA',1200000,'paid','REF-DEMO')`
      );
      console.log('created order LUM-DEMO1');
    }
  }
  console.log('seed done');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
