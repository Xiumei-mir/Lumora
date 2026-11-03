import { verify } from './auth.js';
import pool from './db.js';

export function auth(...roles) {
  return async (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'token_diperlukan' });
    const payload = verify(token);
    if (!payload) return res.status(401).json({ error: 'token_tidak_valid' });
    if (roles.length) {
      try {
        const q = await pool.query('SELECT role FROM users WHERE id=$1', [payload.id]);
        const user = q.rows[0];
        if (!user || !roles.includes(user.role)) {
          return res.status(403).json({ error: 'akses_ditolak' });
        }
      } catch { return res.status(403).json({ error: 'akses_ditolak' }); }
    }
    req.user = { id: payload.id, role: payload.role, email: payload.email, name: payload.name };
    next();
  };
}
