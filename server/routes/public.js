import { Router } from 'express';
import pool from '../db.js';

const r = Router();

r.post('/lead', async (req, res) => {
  const { name, email, phone, segment, service, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'nama_dan_email_wajib' });
  const info = await pool.query(
    'INSERT INTO leads (name,email,phone,segment,service,message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [name, email, phone || null, segment || null, service || null, message || null]
  );
  res.status(201).json({ ok: true, id: info.rows[0].id });
});

export default r;
