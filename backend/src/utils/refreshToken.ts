import crypto from 'crypto';
import { prisma } from '../config/database';

/**
 * Generate a cryptographically secure refresh token
 * Uses crypto.randomBytes for true randomness
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Store refresh token in database
 * @param userId - User ID to associate token with
 * @param token - The refresh token string
 * @param expiresIn - Expiry duration in milliseconds (default: 7 days)
 */
export const storeRefreshToken = async (
  userId: string,
  token: string,
  expiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 days
) => {
  const expiresAt = new Date(Date.now() + expiresIn);

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

/**
 * Verify refresh token exists and is valid
 * @param token - The refresh token to verify
 * @returns User ID if valid, null if invalid/expired
 */
export const verifyRefreshToken = async (
  token: string
): Promise<string | null> => {
  if (!token) return null;

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!refreshToken) return null;

  // Check if expired
  if (refreshToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({ where: { token } });
    return null;
  }

  return refreshToken.userId;
};

/**
 * Rotate refresh token (delete old, create new)
 * Security best practice: rotate tokens on each use
 * @param oldToken - Token to invalidate
 * @param userId - User ID for new token
 * @returns New refresh token
 */
export const rotateRefreshToken = async (
  oldToken: string,
  userId: string
): Promise<string> => {
  // Delete old token
  await prisma.refreshToken.delete({ where: { token: oldToken } });

  // Generate new token
  const newToken = generateRefreshToken();
  await storeRefreshToken(userId, newToken);

  return newToken;
};

/**
 * Revoke all refresh tokens for a user (logout all devices)
 * @param userId - User ID to revoke tokens for
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

/**
 * Revoke specific refresh token (single device logout)
 * @param token - Token to revoke
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.delete({ where: { token } }).catch(() => {
    // Ignore if token doesn't exist
  });
};

/**
 * Clean up expired tokens (run periodically)
 * Should be called by a cron job or scheduler
 */
export const cleanExpiredTokens = async (): Promise<number> => {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
};
