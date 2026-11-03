import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'lumora-dev-secret-change-me';

export function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function signToken(user) { return sign(user); }

export function verify(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

export function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}