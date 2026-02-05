import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const completeProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAddresses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map