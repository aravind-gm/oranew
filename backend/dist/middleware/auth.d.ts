import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
            };
        }
    }
}
export type AuthRequest = Request;
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional auth — attaches user if token exists, but does NOT block unauthenticated requests.
 * Used for guest checkout: allows `req.user` to be undefined.
 */
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map