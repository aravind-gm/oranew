import { Request, Response } from 'express';
/**
 * Set HttpOnly cookies for access and refresh tokens
 * SECURITY: HttpOnly prevents XSS attacks, Secure ensures HTTPS only
 */
export declare const setAuthCookies: (res: Response, accessToken: string, refreshToken: string) => void;
/**
 * Clear authentication cookies
 */
export declare const clearAuthCookies: (res: Response) => void;
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Implements token rotation for security
 */
export declare const refreshAccessToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Helper: Issue tokens on successful authentication
 * Used by login, OTP verify, register, etc.
 */
export declare const issueAuthTokens: (userId: string, email: string, role: string, res: Response) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
//# sourceMappingURL=authToken.controller.d.ts.map