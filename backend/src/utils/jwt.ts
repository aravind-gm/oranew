import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

/**
 * Generate short-lived access token (30 minutes)
 * Used for API authentication
 */
export const generateToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  // SECURITY: No fallback - must be explicitly set
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  // SECURITY: Default to 30m if not set (was 24h before hardening)
  const expiresIn = process.env.JWT_EXPIRES_IN || '30m';

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
};

/**
 * Verify JWT token
 * Returns decoded payload if valid, null if invalid/expired
 */
export const verifyToken = (token: string) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
