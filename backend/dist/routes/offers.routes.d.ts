/**
 * Offers Routes — Campaign management + public offer endpoints
 *
 * Public:
 *   GET  /api/offers/campaign        — Get active campaign info
 *   GET  /api/offers/products        — Get all on-offer products
 *
 * Admin:
 *   GET  /api/offers/admin/campaign  — Get campaign settings
 *   PUT  /api/offers/admin/campaign  — Update campaign settings
 *   GET  /api/offers/admin/products  — List products with offer status
 *   PUT  /api/offers/admin/products/:id — Update offer settings on a product
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=offers.routes.d.ts.map