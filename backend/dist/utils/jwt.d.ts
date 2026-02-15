import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
/**
 * Generate short-lived access token (30 minutes)
 * Used for API authentication
 */
export declare const generateToken: (payload: {
    id: string;
    email: string;
    role: UserRole;
}) => string;
/**
 * Verify JWT token
 * Returns decoded payload if valid, null if invalid/expired
 */
export declare const verifyToken: (token: string) => string | jwt.JwtPayload;
//# sourceMappingURL=jwt.d.ts.map