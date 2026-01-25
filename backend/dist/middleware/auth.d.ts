import { UserRole } from '@prisma/client';
import type { ParamsDictionary } from 'express-serve-static-core';
import { NextFunction, Request, Response } from 'express';
import type { ParsedQs } from 'qs';
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
export interface AuthRequest<Params = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs> extends Request<Params, ResBody, ReqBody, ReqQuery> {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
    params: Params;
    body: ReqBody;
    query: ReqQuery;
    headers: Request['headers'];
    method: Request['method'];
    path: Request['path'];
    files?: any;
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map