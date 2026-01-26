import { Application } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: import('@prisma/client').UserRole;
            };
        }
    }
}
declare const app: Application;
export default app;
//# sourceMappingURL=server.d.ts.map