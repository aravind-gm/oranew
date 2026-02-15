/**
 * Combo Products Routes — "Combos for Her" BOGO Bundle System
 *
 * Public endpoints:
 *   GET  /api/combos              — List active combos (with filters)
 *   GET  /api/combos/:slug        — Get single combo by slug
 *   GET  /api/combos/stats        — Get combo stats (sold count, etc.)
 *
 * Admin endpoints:
 *   GET  /api/combos/admin/all    — List all combos (including inactive)
 *   POST /api/combos/admin        — Create combo
 *   PUT  /api/combos/admin/:id    — Update combo
 *   DELETE /api/combos/admin/:id  — Delete combo
 *
 * CMS endpoints:
 *   GET  /api/combos/cms          — Get combos page CMS config (public)
 *   GET  /api/combos/cms/admin    — Get full CMS config (admin)
 *   PUT  /api/combos/cms          — Update CMS config (admin)
 *   PUT  /api/combos/cms/:section — Update single CMS section (admin)
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=combo.routes.d.ts.map