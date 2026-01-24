import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const forgotPassword: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteAccount: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map