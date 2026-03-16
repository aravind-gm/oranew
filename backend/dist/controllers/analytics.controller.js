"use strict";
/**
 * Analytics Controller — Phase 3
 * ================================
 *
 * Admin-only endpoints for business intelligence.
 * All routes protected by protect + authorize('ADMIN', 'STAFF').
 * Rate limited to 30 requests/minute.
 * Each endpoint returns cached (60s) pre-computed metrics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsAOV = exports.analyticsCarts = exports.analyticsPayments = exports.analyticsProducts = exports.analyticsOverview = void 0;
const helpers_1 = require("../utils/helpers");
const analytics_service_1 = require("../services/analytics.service");
// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/overview
// Summary cards: revenue, orders, customers, refunds
// ──────────────────────────────────────────────────────────────
exports.analyticsOverview = (0, helpers_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getOverviewAnalytics)();
    res.json({ success: true, data });
});
// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/products
// Top products, category breakdown, low stock
// ──────────────────────────────────────────────────────────────
exports.analyticsProducts = (0, helpers_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getProductAnalytics)();
    res.json({ success: true, data });
});
// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/payments
// Payment health: success rate, failures, retries, gateways
// ──────────────────────────────────────────────────────────────
exports.analyticsPayments = (0, helpers_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getPaymentAnalytics)();
    res.json({ success: true, data });
});
// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/carts
// Abandoned carts, recovery, coupons, revenue chart (30 days)
// ──────────────────────────────────────────────────────────────
exports.analyticsCarts = (0, helpers_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getCartAnalytics)();
    res.json({ success: true, data });
});
// ──────────────────────────────────────────────────────────────
// GET /api/admin/analytics/aov
// AOV metrics: today/7d/30d, bundle rate, items/order, trend
// ──────────────────────────────────────────────────────────────
exports.analyticsAOV = (0, helpers_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getAOVAnalytics)();
    res.json({ success: true, data });
});
//# sourceMappingURL=analytics.controller.js.map