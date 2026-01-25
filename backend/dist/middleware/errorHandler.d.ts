import { NextFunction, Request, Response } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (err: ApiError, req: Request, res: Response, _next: NextFunction) => void;
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
//# sourceMappingURL=errorHandler.d.ts.map