import { Router } from 'express';
import pool from '../db.js';
import { auth } from '../middleware.js';

const r = Router();
const guard = auth('admin', 'statistician');

r.get('/stats', guard, async (_req, res) => {
  try {
    const total = (await pool.query('SELECT COUNT(*) c FROM orders')).rows[0].c;
    const byStatus = (await pool.query('SELECT status, COUNT(*) c FROM orders GROUP BY status')).rows;
    const revenue = (await pool.query('SELECT COALESCE(SUM(paid),0) total FROM orders')).rows[0].total;
    const leads = (await pool.query('SELECT status, COUNT(*) c FROM leads GROUP BY status')).rows;
    const recent = (await pool.query(
      `SELECT o.id,o.code,o.status,o.total,u.name AS client FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 8`
    )).rows;
    res.json({ total, byStatus, revenue, leads, recent });
  } catch (e) { res.status(500).json({ error: 'gagal_muat_stats' }); }
});

r.get('/services', guard, async (_req, res) => {
  const q = await pool.query('SELECT * FROM services');
  res.json({ services: q.rows });
});

r.post('/services', guard, async (req, res) => {
  const { key, title, description } = req.body;
  await pool.query('INSERT INTO services (key,title,description) VALUES ($1,$2,$3)', [key, title, description || null]);
  res.status(201).json({ ok: true });
});

r.get('/leads', guard, async (_req, res) => {
  const q = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
  res.json({ leads: q.rows });
});

r.post('/leads/:id/status', guard, async (req, res) => {
  await pool.query('UPDATE leads SET status=$1 WHERE id=$2', [req.body.status || 'new', req.params.id]);
  res.json({ ok: true });
});

r.get('/orders', guard, async (req, res) => {
  const { status, service_id, user_id } = req.query;
  let q = `SELECT o.*, s.title service_title, u.name client_name FROM orders o LEFT JOIN services s ON s.id=o.service_id JOIN users u ON u.id=o.user_id WHERE 1`;
  const args = [];
  if (status) { args.push(status); q += ` AND o.status=$${args.length}`; }
  if (service_id) { args.push(service_id); q += ` AND o.service_id=$${args.length}`; }
  if (user_id) { args.push(user_id); q += ` AND o.user_id=$${args.length}`; }
  q += ' ORDER BY o.created_at DESC';
  const result = await pool.query(q, args);
  res.json({ orders: result.rows });
});

r.get('/clients', guard, async (_req, res) => {
  const q = await pool.query(
    `SELECT u.id,u.name,u.email,u.role,u.segment,u.company,COUNT(o.id) orders_count FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.role='client' GROUP BY u.id ORDER BY u.created_at DESC`
  );
  res.json({ clients: q.rows });
});

r.get('/settings', guard, (_req, res) => res.json({ ok: true }));

export default r;
