/**
 * Generate a cryptographically secure refresh token
 * Uses crypto.randomBytes for true randomness
 */
export declare const generateRefreshToken: () => string;
/**
 * Store refresh token in database
 * @param userId - User ID to associate token with
 * @param token - The refresh token string
 * @param expiresIn - Expiry duration in milliseconds (default: 7 days)
 */
export declare const storeRefreshToken: (userId: string, token: string, expiresIn?: number) => Promise<void>;
/**
 * Verify refresh token exists and is valid
 * @param token - The refresh token to verify
 * @returns User ID if valid, null if invalid/expired
 */
export declare const verifyRefreshToken: (token: string) => Promise<string | null>;
/**
 * Rotate refresh token (delete old, create new)
 * Security best practice: rotate tokens on each use
 * @param oldToken - Token to invalidate
 * @param userId - User ID for new token
 * @returns New refresh token
 */
export declare const rotateRefreshToken: (oldToken: string, userId: string) => Promise<string>;
/**
 * Revoke all refresh tokens for a user (logout all devices)
 * @param userId - User ID to revoke tokens for
 */
export declare const revokeAllUserTokens: (userId: string) => Promise<void>;
/**
 * Revoke specific refresh token (single device logout)
 * @param token - Token to revoke
 */
export declare const revokeRefreshToken: (token: string) => Promise<void>;
/**
 * Clean up expired tokens (run periodically)
 * Should be called by a cron job or scheduler
 */
export declare const cleanExpiredTokens: () => Promise<number>;
//# sourceMappingURL=refreshToken.d.ts.map