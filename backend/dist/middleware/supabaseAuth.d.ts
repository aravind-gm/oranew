/**
 * Supabase JWT Authentication Middleware
 * Validates tokens issued by Supabase Auth
 */
import { NextFunction, Request, Response } from 'express';
declare global {
    namespace Express {
        interface Request {
            supabaseUser?: {
                id: string;
                email?: string;
                phone?: string;
            };
        }
    }
}
export declare const protectSupabase: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=supabaseAuth.d.ts.map