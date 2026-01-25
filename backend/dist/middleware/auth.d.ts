import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map