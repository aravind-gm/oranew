import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAddresses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteAddress: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map