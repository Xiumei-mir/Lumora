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
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [u.email]);
    if (exists.rows.length) { console.log('skip', u.email); continue; }
    const hash = await hashPassword(u.password);
    const info = await pool.query('INSERT INTO users (name,email,password_hash,role,segment) VALUES ($1,$2,$3,$4,$5) RETURNING id', [u.name,u.email,hash,u.role,u.segment||null]);
    console.log('created', u.email, 'id', info.rows[0].id, u.role);
  }
  // sample order milik dewi (id 3)
  const orders = [
    { code:'LUM-DEMO1', user_id:3, service_id:3, package_name:'Paket Tesis & Jurnal', total:2400000, paid:1200000, status:'dalam_pengerjaan', brief:'Analisis SEM PLS untuk tesis', assigned_to:2, due_date:'2026-12-15' },
    { code:'LUM-DEMO2', user_id:3, service_id:1, package_name:'Paket Skripsi', total:850000, paid:0, status:'menunggu_pembayaran', brief:'Uji regresi sederhana skripsi' }
  ];
  for (const o of orders) {
    const ex = await pool.query('SELECT id FROM orders WHERE code=$1', [o.code]);
    if (ex.rows.length) continue;
    const info = await pool.query(`INSERT INTO orders (code,user_id,service_id,package_name,total,paid,status,brief,assigned_to,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [o.code,o.user_id,o.service_id,o.package_name,o.total,o.paid,o.status,o.brief,o.assigned_to||null,o.due_date||null]);
    await pool.query('INSERT INTO order_events (order_id,status,note,actor) VALUES ($1,$2,$3,$4)', [info.rows[0].id,o.status,'Demo seed','admin']);
    if (o.paid > 0) await pool.query('INSERT INTO payments (order_id,method,amount,status,reference) VALUES ($1,$2,$3,$4,$5)', [info.rows[0].id,'VA',o.paid,'paid','REF-DEMO']);
    console.log('created order', o.code);
  }
  console.log('seed done');
}
main().catch(e => { console.error(e); process.exit(1); });