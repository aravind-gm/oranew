// backend/lib/auth.ts
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;

export function createJWT(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJWT(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function requireAuth(authHeader?: string): JwtPayload {
  const token = extractToken(authHeader);
  if (!token) {
    throw new Error('Missing authorization token');
  }
  return verifyJWT(token);
}

export function requireAdmin(authHeader?: string): JwtPayload {
  const user = requireAuth(authHeader);
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}
