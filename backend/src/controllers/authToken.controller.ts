import { Request, Response } from 'express';
import { generateToken } from '../utils/jwt';
import {
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../utils/refreshToken';
import { logAuthEvent, SecurityEventType } from '../utils/securityLogger';
import { prisma } from '../config/database';

/**
 * Set HttpOnly cookies for access and refresh tokens
 * SECURITY: HttpOnly prevents XSS attacks, Secure ensures HTTPS only
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  // Access token cookie (30 minutes)
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
    path: '/',
    maxAge: 30 * 60 * 1000, // 30 minutes
  });

  // Refresh token cookie (7 days)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
    path: '/',
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
    path: '/',
  });
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Implements token rotation for security
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const oldRefreshToken = req.cookies?.refresh_token;

    if (!oldRefreshToken) {
      logAuthEvent(
        SecurityEventType.INVALID_TOKEN,
        'Refresh token missing',
        undefined,
        req.ip
      );

      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    // Verify refresh token
    const userId = await verifyRefreshToken(oldRefreshToken);

    if (!userId) {
      logAuthEvent(
        SecurityEventType.EXPIRED_TOKEN,
        'Refresh token expired or invalid',
        undefined,
        req.ip,
        { token: oldRefreshToken.substring(0, 10) + '...' }
      );

      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Generate new access token
    const newAccessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Rotate refresh token
    const newRefreshToken = await rotateRefreshToken(oldRefreshToken, userId);

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    console.log(`[Auth:Refresh] ✅ Token refreshed for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('[Auth:Refresh] ❌ Error:', error);

    logAuthEvent(
      SecurityEventType.TOKEN_ROTATION_FAILED,
      'Token rotation failed',
      undefined,
      req.ip,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );

    clearAuthCookies(res);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    const userId = (req as any).user?.id;

    // Revoke refresh token if exists
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Clear cookies
    clearAuthCookies(res);

    console.log(`[Auth:Logout] ✅ User logged out: ${userId || 'Unknown'}`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Auth:Logout] ❌ Error:', error);

    // Clear cookies even on error
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
};

/**
 * Helper: Issue tokens on successful authentication
 * Used by login, OTP verify, register, etc.
 */
export const issueAuthTokens = async (
  userId: string,
  email: string,
  role: string,
  res: Response
) => {
  // Generate access token (30m)
  const accessToken = generateToken({
    id: userId,
    email,
    role: role as any,
  });

  // Generate refresh token (7d)
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(userId, refreshToken);

  // Set HttpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  return { accessToken, refreshToken };
};
