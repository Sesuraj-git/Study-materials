import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devsecret';

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}
export function verifyToken<T = any>(token: string): T | null {
  try { return jwt.verify(token, SECRET) as T; } catch { return null; }
}
