/**
 * Shop All Page CMS Routes
 * Admin-controlled content management for the Shop All / All Jewellery page
 *
 * Endpoints:
 *   GET  /api/shopall-cms          — Public: Get active page config
 *   GET  /api/shopall-cms/admin    — Admin: Get full config with inactive sections
 *   PUT  /api/shopall-cms          — Admin: Update full page config
 *   PUT  /api/shopall-cms/:section — Admin: Update a single section
 *
 * @author ORA Engineering
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=shopall-cms.routes.d.ts.map