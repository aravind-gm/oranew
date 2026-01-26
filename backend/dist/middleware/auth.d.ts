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
//# sourceMappingURL=auth.d.ts.map