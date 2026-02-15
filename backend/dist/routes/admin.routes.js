"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const bogo_controller_1 = require("../controllers/bogo.controller");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin/staff role
router.use(auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'));
// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard/stats', admin_controller_1.getDashboardStats);
// ============================================
// ORDERS
// ============================================
router.get('/orders', admin_controller_1.getAllOrders);
router.get('/orders/:id', admin_controller_1.getOrderById);
router.put('/orders/:id/status', admin_controller_1.updateOrderStatus);
// ============================================
// CUSTOMERS
// ============================================
router.get('/customers', admin_controller_1.getCustomers);
// ============================================
// INVENTORY
// ============================================
router.get('/inventory', admin_controller_1.getInventory);
router.get('/inventory/low-stock', admin_controller_1.getLowStockProducts);
router.put('/inventory/:id', admin_controller_1.updateInventory);
router.post('/inventory/bulk-update', admin_controller_1.bulkUpdateInventory);
router.post('/inventory/cleanup-locks', admin_controller_1.cleanupLocks);
// ============================================
// PRODUCTS (Admin CRUD)
// ============================================
router.get('/products', admin_controller_1.getAdminProducts);
router.get('/products/:id', product_controller_1.getProductById);
router.post('/products', product_controller_1.createProduct);
router.put('/products/:id', product_controller_1.updateProduct);
router.delete('/products/:id', (0, auth_1.authorize)('ADMIN'), product_controller_1.deleteProduct);
router.put('/products/:id/archive', admin_controller_1.archiveProduct);
router.put('/products/:id/restore', admin_controller_1.restoreProduct);
router.post('/products/bulk-action', admin_controller_1.bulkProductAction);
// Product Images
router.post('/products/:id/images', admin_controller_1.addProductImages);
router.delete('/products/:id/images/:imageId', admin_controller_1.deleteProductImage);
router.put('/products/:id/images/:imageId/primary', admin_controller_1.setPrimaryImage);
// ============================================
// CATEGORIES (Admin CRUD)
// ============================================
router.post('/categories', admin_controller_1.createCategory);
router.put('/categories/:id', admin_controller_1.updateCategory);
router.delete('/categories/:id', (0, auth_1.authorize)('ADMIN'), admin_controller_1.deleteCategory);
// ============================================
// REPORTS
// ============================================
router.get('/reports/revenue', admin_controller_1.getRevenueReport);
router.get('/reports/payments', admin_controller_1.getPaymentsReport);
router.get('/reports/orders', admin_controller_1.getOrdersReport);
// ============================================
// RETURNS MANAGEMENT
// ============================================
router.get('/returns', admin_controller_1.getReturns);
router.get('/returns/stats', admin_controller_1.getReturnStats);
router.get('/returns/:id', admin_controller_1.getReturnById);
router.put('/returns/:id/status', admin_controller_1.updateReturnStatus);
// ============================================
// BOGO CAMPAIGN MANAGEMENT
// ============================================
router.get('/bogo/campaign', bogo_controller_1.getBOGOCampaign);
router.put('/bogo/campaign', bogo_controller_1.updateBOGOCampaign);
router.get('/bogo/products', bogo_controller_1.getBOGOProducts);
router.put('/bogo/products/:id', bogo_controller_1.updateProductBOGO);
router.get('/bogo/stats', bogo_controller_1.getBOGOStats);
// ============================================
// SETTINGS: SHIPPING CONFIG
// ============================================
router.get('/settings/shipping', admin_controller_1.getAdminShippingConfig);
router.put('/settings/shipping', admin_controller_1.updateAdminShippingConfig);
// ============================================
// SETTINGS: TAX CONFIG
// ============================================
router.get('/settings/taxes', admin_controller_1.getAdminTaxConfigs);
router.put('/settings/taxes', admin_controller_1.upsertTaxConfig);
router.delete('/settings/taxes/:id', admin_controller_1.deleteTaxConfig);
// ============================================
// AUDIT LOG
// ============================================
router.get('/audit-log', admin_controller_1.getAuditLogs);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map