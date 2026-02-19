"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueAuthTokens = exports.logout = exports.refreshAccessToken = exports.clearAuthCookies = exports.setAuthCookies = void 0;
const jwt_1 = require("../utils/jwt");
const refreshToken_1 = require("../utils/refreshToken");
const securityLogger_1 = require("../utils/securityLogger");
const database_1 = require("../config/database");
/**
 * Set HttpOnly cookies for access and refresh tokens
 * SECURITY: HttpOnly prevents XSS attacks, Secure ensures HTTPS only
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
    // Access token cookie (30 minutes)
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
        maxAge: 30 * 60 * 1000, // 30 minutes
    });
    // Refresh token cookie (7 days)
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
exports.setAuthCookies = setAuthCookies;
/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res) => {
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
    });
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
    });
};
exports.clearAuthCookies = clearAuthCookies;
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Implements token rotation for security
 */
const refreshAccessToken = async (req, res) => {
    try {
        // Get refresh token from cookie
        const oldRefreshToken = req.cookies?.refresh_token;
        if (!oldRefreshToken) {
            (0, securityLogger_1.logAuthEvent)(securityLogger_1.SecurityEventType.INVALID_TOKEN, 'Refresh token missing', undefined, req.ip);
            (0, exports.clearAuthCookies)(res);
            return res.status(401).json({
                success: false,
                error: 'Refresh token required',
            });
        }
        // Verify refresh token
        const userId = await (0, refreshToken_1.verifyRefreshToken)(oldRefreshToken);
        if (!userId) {
            (0, securityLogger_1.logAuthEvent)(securityLogger_1.SecurityEventType.EXPIRED_TOKEN, 'Refresh token expired or invalid', undefined, req.ip, { token: oldRefreshToken.substring(0, 10) + '...' });
            (0, exports.clearAuthCookies)(res);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token',
            });
        }
        // Get user data
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });
        if (!user) {
            (0, exports.clearAuthCookies)(res);
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }
        // Generate new access token
        const newAccessToken = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        // Rotate refresh token
        const newRefreshToken = await (0, refreshToken_1.rotateRefreshToken)(oldRefreshToken, userId);
        // Set new cookies
        (0, exports.setAuthCookies)(res, newAccessToken, newRefreshToken);
        console.log(`[Auth:Refresh] ✅ Token refreshed for user: ${user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
        });
    }
    catch (error) {
        console.error('[Auth:Refresh] ❌ Error:', error);
        (0, securityLogger_1.logAuthEvent)(securityLogger_1.SecurityEventType.TOKEN_ROTATION_FAILED, 'Token rotation failed', undefined, req.ip, { error: error instanceof Error ? error.message : 'Unknown error' });
        (0, exports.clearAuthCookies)(res);
        return res.status(500).json({
            success: false,
            error: 'Failed to refresh token',
        });
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        const userId = req.user?.id;
        // Revoke refresh token if exists
        if (refreshToken) {
            await (0, refreshToken_1.revokeRefreshToken)(refreshToken);
        }
        // Clear cookies
        (0, exports.clearAuthCookies)(res);
        console.log(`[Auth:Logout] ✅ User logged out: ${userId || 'Unknown'}`);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        console.error('[Auth:Logout] ❌ Error:', error);
        // Clear cookies even on error
        (0, exports.clearAuthCookies)(res);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
};
exports.logout = logout;
/**
 * Helper: Issue tokens on successful authentication
 * Used by login, OTP verify, register, etc.
 */
const issueAuthTokens = async (userId, email, role, res) => {
    // Generate access token (30m)
    const accessToken = (0, jwt_1.generateToken)({
        id: userId,
        email,
        role: role,
    });
    // Generate refresh token (7d)
    const refreshToken = (0, refreshToken_1.generateRefreshToken)();
    await (0, refreshToken_1.storeRefreshToken)(userId, refreshToken);
    // Set HttpOnly cookies
    (0, exports.setAuthCookies)(res, accessToken, refreshToken);
    return { accessToken, refreshToken };
};
exports.issueAuthTokens = issueAuthTokens;
//# sourceMappingURL=authToken.controller.js.map