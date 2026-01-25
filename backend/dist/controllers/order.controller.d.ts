import { Response } from 'express';
export declare const checkout: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getOrders: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getOrderById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const cancelOrder: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const requestReturn: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * ADMIN ONLY: Process refund and restock inventory
 * Called by admin after approving a return request
 */
export declare const processRefund: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=order.controller.d.ts.map