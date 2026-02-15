"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanExpiredTokens = exports.revokeRefreshToken = exports.revokeAllUserTokens = exports.rotateRefreshToken = exports.verifyRefreshToken = exports.storeRefreshToken = exports.generateRefreshToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
/**
 * Generate a cryptographically secure refresh token
 * Uses crypto.randomBytes for true randomness
 */
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Store refresh token in database
 * @param userId - User ID to associate token with
 * @param token - The refresh token string
 * @param expiresIn - Expiry duration in milliseconds (default: 7 days)
 */
const storeRefreshToken = async (userId, token, expiresIn = 7 * 24 * 60 * 60 * 1000 // 7 days
) => {
    const expiresAt = new Date(Date.now() + expiresIn);
    await database_1.prisma.refreshToken.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });
};
exports.storeRefreshToken = storeRefreshToken;
/**
 * Verify refresh token exists and is valid
 * @param token - The refresh token to verify
 * @returns User ID if valid, null if invalid/expired
 */
const verifyRefreshToken = async (token) => {
    if (!token)
        return null;
    const refreshToken = await database_1.prisma.refreshToken.findUnique({
        where: { token },
        select: { userId: true, expiresAt: true },
    });
    if (!refreshToken)
        return null;
    // Check if expired
    if (refreshToken.expiresAt < new Date()) {
        // Delete expired token
        await database_1.prisma.refreshToken.delete({ where: { token } });
        return null;
    }
    return refreshToken.userId;
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Rotate refresh token (delete old, create new)
 * Security best practice: rotate tokens on each use
 * @param oldToken - Token to invalidate
 * @param userId - User ID for new token
 * @returns New refresh token
 */
const rotateRefreshToken = async (oldToken, userId) => {
    // Delete old token
    await database_1.prisma.refreshToken.delete({ where: { token: oldToken } });
    // Generate new token
    const newToken = (0, exports.generateRefreshToken)();
    await (0, exports.storeRefreshToken)(userId, newToken);
    return newToken;
};
exports.rotateRefreshToken = rotateRefreshToken;
/**
 * Revoke all refresh tokens for a user (logout all devices)
 * @param userId - User ID to revoke tokens for
 */
const revokeAllUserTokens = async (userId) => {
    await database_1.prisma.refreshToken.deleteMany({
        where: { userId },
    });
};
exports.revokeAllUserTokens = revokeAllUserTokens;
/**
 * Revoke specific refresh token (single device logout)
 * @param token - Token to revoke
 */
const revokeRefreshToken = async (token) => {
    await database_1.prisma.refreshToken.delete({ where: { token } }).catch(() => {
        // Ignore if token doesn't exist
    });
};
exports.revokeRefreshToken = revokeRefreshToken;
/**
 * Clean up expired tokens (run periodically)
 * Should be called by a cron job or scheduler
 */
const cleanExpiredTokens = async () => {
    const result = await database_1.prisma.refreshToken.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
    return result.count;
};
exports.cleanExpiredTokens = cleanExpiredTokens;
//# sourceMappingURL=refreshToken.js.map