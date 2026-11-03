import { Router } from 'express';
import pool from '../db.js';
import { signToken, comparePassword, hashPassword } from '../auth.js';
import { auth } from '../middleware.js';

const r = Router();

r.post('/register', async (req, res) => {
  const { name, email, password, role = 'client', phone, segment, company } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'data_tidak_lengkap' });
  if (String(password).length < 6) return res.status(400).json({ error: 'password_miny_6_karakter' });
  const allowed = ['client', 'statistician', 'admin'];
  const safeRole = allowed.includes(role) ? role : 'client';
  try {
    const hash = await hashPassword(password);
    const info = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,phone,segment,company) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, role, segment, company',
      [name, email, hash, safeRole, phone || null, segment || null, company || null]
    );
    const user = info.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'email_sudah_daftar' });
    res.status(500).json({ error: 'gagal_daftar' });
  }
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'email_atau_salah_password' });
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'email_atau_salah_password' });
  const { password_hash, ...safe } = user;
  const token = signToken(safe);
  res.json({ token, user: safe });
});

r.get('/me', auth(), (req, res) => {
  pool.query('SELECT id, name, email, role, phone, segment, company FROM users WHERE id=$1', [req.user.id])
    .then((q) => res.json({ user: q.rows[0] }))
    .catch(() => res.status(500).json({ error: 'gagal_muat' }));
});

r.post('/forgot', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email_wajib' });
  // ponytail: tanpa email service - upgrade: SES + reset_token
  res.json({ ok: true });
});

r.post('/reset-password', auth(), async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || String(new_password).length < 6) return res.status(400).json({ error: 'password_miny_6_karakter' });
  const hash = await hashPassword(new_password);
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
  res.json({ ok: true });
});

export default r;
