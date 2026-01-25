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
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
    params: Record<string, any>;
    body: Record<string, any>;
    query: Record<string, any>;
    headers: Request['headers'];
    method: Request['method'];
    path: Request['path'];
    files?: any;
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map