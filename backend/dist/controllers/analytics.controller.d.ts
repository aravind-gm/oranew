/**
 * Analytics Controller — Phase 3
 * ================================
 *
 * Admin-only endpoints for business intelligence.
 * All routes protected by protect + authorize('ADMIN', 'STAFF').
 * Rate limited to 30 requests/minute.
 * Each endpoint returns cached (60s) pre-computed metrics.
 */
import { Response } from 'express';
export declare const analyticsOverview: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const analyticsProducts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const analyticsPayments: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const analyticsCarts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const analyticsAOV: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=analytics.controller.d.ts.map