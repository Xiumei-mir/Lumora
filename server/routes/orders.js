import { Router } from 'express';
import pool from '../db.js';
import { auth } from '../middleware.js';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const r = Router();

const uploadDir = path.resolve(path.join(process.cwd(), 'uploads'));
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const up = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

r.get('/', auth('client', 'statistician', 'admin'), async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'client') {
      rows = (await pool.query(
        `SELECT o.*, s.title AS service_title FROM orders o LEFT JOIN services s ON s.id=o.service_id WHERE o.user_id=$1 ORDER BY o.created_at DESC`,
        [req.user.id]
      )).rows;
    } else {
      rows = (await pool.query(
        `SELECT o.*, s.title AS service_title, u.name AS client_name FROM orders o LEFT JOIN services s ON s.id=o.service_id JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC`
      )).rows;
    }
    res.json({ orders: rows });
  } catch (e) { res.status(500).json({ error: 'gagal_muat' }); }
});

r.post('/', auth('client'), async (req, res) => {
  const { service_id, package_name, brief, total, due_date } = req.body;
  const code = `LUM-${Date.now().toString(36).toUpperCase()}`;
  const info = await pool.query(
    `INSERT INTO orders (code,user_id,service_id,package_name,brief,total,due_date,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'menunggu_data') RETURNING id`,
    [code, req.user.id, service_id || null, package_name || null, brief || null, total || 0, due_date || null]
  );
  const orderId = info.rows[0].id;
  await pool.query(
    'INSERT INTO order_events (order_id,status,note,actor) VALUES ($1,$2,$3,$4)',
    [orderId, 'menunggu_data', 'Order dibuat', 'client']
  );
  const q = await pool.query(
    `SELECT o.*, s.title AS service_title FROM orders o LEFT JOIN services s ON s.id=o.service_id WHERE o.id=$1`,
    [orderId]
  );
  res.status(201).json({ order: q.rows[0] });
});

r.get('/:id', auth('client', 'statistician', 'admin'), async (req, res) => {
  const q = await pool.query(
    `SELECT o.*, s.title AS service_title, u.name AS client_name FROM orders o LEFT JOIN services s ON s.id=o.service_id LEFT JOIN users u ON u.id=o.user_id WHERE o.id=$1`,
    [req.params.id]
  );
  const order = q.rows[0];
  if (!order) return res.status(404).json({ error: 'order_tidak_ditemukan' });
  if (req.user.role === 'client' && String(order.user_id) !== String(req.user.id))
    return res.status(403).json({ error: 'akses_ditolak' });
  const events = (await pool.query('SELECT * FROM order_events WHERE order_id=$1 ORDER BY created_at DESC', [order.id])).rows;
  const payments = (await pool.query('SELECT * FROM payments WHERE order_id=$1 ORDER BY created_at DESC', [order.id])).rows;
  res.json({ order, events, payments });
});

const FLOW = ['menunggu_pembayaran','menunggu_data','verifikasi_data','dalam_pengerjaan','review_internal','hasil_siap','revisi','selesai'];

r.post('/:id/status', auth('admin', 'statistician'), async (req, res) => {
  const { status, note } = req.body;
  if (!FLOW.includes(status)) return res.status(400).json({ error: 'status_tidak_valid' });
  const q = await pool.query('SELECT id, status FROM orders WHERE id=$1', [req.params.id]);
  if (!q.rows[0]) return res.status(404).json({ error: 'order_tidak_ditemukan' });
  await pool.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', [status, req.params.id]);
  await pool.query('INSERT INTO order_events (order_id,status,note,actor) VALUES ($1,$2,$3,$4)',
    [req.params.id, status, note || null, req.user.role]);
  res.json({ ok: true, status });
});

r.post('/:id/assign', auth('admin'), async (req, res) => {
  const { user_id } = req.body;
  await pool.query('UPDATE orders SET assigned_to=$1 WHERE id=$2', [user_id, req.params.id]);
  res.json({ ok: true });
});

r.post('/:id/files', auth('client', 'statistician', 'admin'), up.array('files', 10), async (req, res) => {
  try {
    const q = await pool.query('SELECT id,user_id,assigned_to FROM orders WHERE id=$1', [req.params.id]);
    const order = q.rows[0];
    if (!order) return res.status(404).json({ error: 'order_tidak_ditemukan' });
    if (req.user.role === 'client' && String(order.user_id) !== String(req.user.id))
      return res.status(403).json({ error: 'akses_ditolak' });
    const files = [];
    for (const f of req.files || []) {
      const info = await pool.query(
        'INSERT INTO files (order_id,user_id,kind,filename,stored_path,size) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [order.id, req.user.id, 'upload', f.originalname, f.path, f.size]
      );
      files.push(info.rows[0]);
    }
    res.status(201).json({ files });
  } catch (e) { res.status(500).json({ error: 'gagal_unggah' }); }
});

r.get('/:id/files', auth('client', 'statistician', 'admin'), async (req, res) => {
  const q = await pool.query(
    'SELECT id,kind,filename,size,version,created_at FROM files WHERE order_id=$1 ORDER BY created_at',
    [req.params.id]
  );
  res.json({ files: q.rows });
});

r.get('/:id/files/:fid', auth('client', 'statistician', 'admin'), async (req, res) => {
  const q = await pool.query('SELECT * FROM files WHERE id=$1 AND order_id=$2', [req.params.fid, req.params.id]);
  const f = q.rows[0];
  if (!f) return res.status(404).json({ error: 'berkas_tidak_ditemukan' });
  res.download(f.stored_path, f.filename);
});

r.get('/:id/messages', auth('client', 'statistician', 'admin'), async (req, res) => {
  const q = await pool.query(
    `SELECT m.id,m.body,m.created_at,u.name AS sender_name,u.role AS sender_role FROM messages m LEFT JOIN users u ON u.id=m.sender_id WHERE m.order_id=$1 ORDER BY m.created_at`,
    [req.params.id]
  );
  res.json({ messages: q.rows });
});

r.post('/:id/messages', auth('client', 'statistician', 'admin'), async (req, res) => {
  const { body, attachment_id } = req.body;
  if (!body && !attachment_id) return res.status(400).json({ error: 'pesan_kosong' });
  const info = await pool.query(
    'INSERT INTO messages (order_id,sender_id,body,attachment_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.params.id, req.user.id, body || null, attachment_id || null]
  );
  res.status(201).json({ message: info.rows[0] });
});

r.post('/:id/payments', auth('client', 'statistician', 'admin'), async (req, res) => {
  const { method, amount } = req.body;
  const info = await pool.query(
    'INSERT INTO payments (order_id,method,amount,status,reference) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.params.id, method, amount, 'paid', `REF-${Date.now().toString(36).toUpperCase()}`]
  );
  await pool.query('UPDATE orders SET paid = COALESCE(paid,0) + $1 WHERE id=$2', [amount, req.params.id]);
  res.status(201).json({ payment: info.rows[0] });
});

export default r;
