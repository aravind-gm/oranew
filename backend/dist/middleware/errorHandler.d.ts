import { NextFunction, Request, Response } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    category?: string;
}
export declare const errorHandler: (err: ApiError, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    category?: string;
    constructor(message: string, statusCode?: number, category?: string);
}
//# sourceMappingURL=errorHandler.d.ts.map