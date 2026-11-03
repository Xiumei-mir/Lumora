import { Router } from 'express';
import pool from '../db.js';
import { auth } from '../middleware.js';

const r = Router();

r.post('/', auth('client', 'statistician', 'admin'), async (req, res) => {
  const { slot, duration = 30, method = 'zoom', name, email } = req.body;
  if (!slot) return res.status(400).json({ error: 'slot_wajib' });
  const info = await pool.query(
    'INSERT INTO bookings (user_id,name,email,slot,duration,method,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.user.id, name || req.user.name, email || req.user.email, slot, duration, method, 'pending']
  );
  res.status(201).json({ booking: info.rows[0] });
});

r.get('/', auth('client', 'statistician', 'admin'), async (req, res) => {
  const q = await pool.query('SELECT * FROM bookings WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ bookings: q.rows });
});

r.get('/all', auth('admin'), async (_req, res) => {
  const q = await pool.query('SELECT b.*, u.name AS user_name FROM bookings b LEFT JOIN users u ON u.id=b.user_id ORDER BY b.created_at DESC');
  res.json({ bookings: q.rows });
});

r.post('/:id/status', auth('admin'), async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE bookings SET status=$1 WHERE id=$2', [status, req.params.id]);
  res.json({ ok: true });
});

export default r;
