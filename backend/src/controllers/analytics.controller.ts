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
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/helpers';
import {
  getOverviewAnalytics,
  getProductAnalytics,
  getPaymentAnalytics,
  getCartAnalytics,
  getAOVAnalytics,
} from '../services/analytics.service';

// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/overview
// Summary cards: revenue, orders, customers, refunds
// ──────────────────────────────────────────────────────────────
export const analyticsOverview = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getOverviewAnalytics();
  res.json({ success: true, data });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/products
// Top products, category breakdown, low stock
// ──────────────────────────────────────────────────────────────
export const analyticsProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getProductAnalytics();
  res.json({ success: true, data });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/payments
// Payment health: success rate, failures, retries, gateways
// ──────────────────────────────────────────────────────────────
export const analyticsPayments = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getPaymentAnalytics();
  res.json({ success: true, data });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/carts
// Abandoned carts, recovery, coupons, revenue chart (30 days)
// ──────────────────────────────────────────────────────────────
export const analyticsCarts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getCartAnalytics();
  res.json({ success: true, data });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/aov
// AOV metrics: today/7d/30d, bundle rate, items/order, trend
// ──────────────────────────────────────────────────────────────
export const analyticsAOV = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getAOVAnalytics();
  res.json({ success: true, data });
});
