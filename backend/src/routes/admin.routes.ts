import { Router } from 'express';
import {
    addProductImages,
    archiveProduct,
    bulkProductAction,
    bulkUpdateInventory,
    cleanupLocks,
    createCategory,
    deleteCategory,
    deleteProductImage,
    deleteTaxConfig,
    getAdminProducts,
    getAdminShippingConfig,
    getAdminTaxConfigs,
    getAllOrders,
    getAuditLogs,
    getCustomers,
    getDashboardStats,
    getInventory,
    getLowStockProducts,
    getOrderById,
    getOrdersReport,
    getPaymentsReport,
    getReturnById,
    getReturns,
    getReturnStats,
    getRevenueReport,
    restoreProduct,
    setPrimaryImage,
    updateAdminShippingConfig,
    updateCategory,
    updateInventory,
    updateOrderStatus,
    updateReturnStatus,
    upsertTaxConfig,
} from '../controllers/admin.controller';
import {
    getBOGOCampaign,
    updateBOGOCampaign,
    getBOGOProducts,
    updateProductBOGO,
    getBOGOStats,
} from '../controllers/bogo.controller';
import {
    analyticsOverview,
    analyticsProducts,
    analyticsPayments,
    analyticsCarts,
} from '../controllers/analytics.controller';
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    updateProduct,
} from '../controllers/product.controller';
import { authorize, protect } from '../middleware/auth';
import { analyticsLimiter } from '../middleware/rateLimiter';

const router = Router();

// All admin routes require authentication and admin/staff role
router.use(protect, authorize('ADMIN', 'STAFF'));

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard/stats', getDashboardStats);

// ============================================
// ORDERS
// ============================================
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

// ============================================
// CUSTOMERS
// ============================================
router.get('/customers', getCustomers);

// ============================================
// INVENTORY
// ============================================
router.get('/inventory', getInventory);
router.get('/inventory/low-stock', getLowStockProducts);
router.put('/inventory/:id', updateInventory);
router.post('/inventory/bulk-update', bulkUpdateInventory);
router.post('/inventory/cleanup-locks', cleanupLocks);

// ============================================
// PRODUCTS (Admin CRUD)
// ============================================
router.get('/products', getAdminProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', authorize('ADMIN'), deleteProduct);
router.put('/products/:id/archive', archiveProduct);
router.put('/products/:id/restore', restoreProduct);
router.post('/products/bulk-action', bulkProductAction);

// Product Images
router.post('/products/:id/images', addProductImages);
router.delete('/products/:id/images/:imageId', deleteProductImage);
router.put('/products/:id/images/:imageId/primary', setPrimaryImage);

// ============================================
// CATEGORIES (Admin CRUD)
// ============================================
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', authorize('ADMIN'), deleteCategory);

// ============================================
// REPORTS
// ============================================
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/payments', getPaymentsReport);
router.get('/reports/orders', getOrdersReport);

// ============================================
// RETURNS MANAGEMENT
// ============================================
router.get('/returns', getReturns);
router.get('/returns/stats', getReturnStats);
router.get('/returns/:id', getReturnById);
router.put('/returns/:id/status', updateReturnStatus);

// ============================================
// BOGO CAMPAIGN MANAGEMENT
// ============================================
router.get('/bogo/campaign', getBOGOCampaign);
router.put('/bogo/campaign', updateBOGOCampaign);
router.get('/bogo/products', getBOGOProducts);
router.put('/bogo/products/:id', updateProductBOGO);
router.get('/bogo/stats', getBOGOStats);

// ============================================
// SETTINGS: SHIPPING CONFIG
// ============================================
router.get('/settings/shipping', getAdminShippingConfig);
router.put('/settings/shipping', updateAdminShippingConfig);

// ============================================
// SETTINGS: TAX CONFIG
// ============================================
router.get('/settings/taxes', getAdminTaxConfigs);
router.put('/settings/taxes', upsertTaxConfig);
router.delete('/settings/taxes/:id', deleteTaxConfig);

// ============================================
// AUDIT LOG
// ============================================
router.get('/audit-log', getAuditLogs);

// ============================================
// ANALYTICS (Phase 3) — rate limited
// ============================================
router.get('/analytics/overview', analyticsLimiter, analyticsOverview);
router.get('/analytics/products', analyticsLimiter, analyticsProducts);
router.get('/analytics/payments', analyticsLimiter, analyticsPayments);
router.get('/analytics/carts', analyticsLimiter, analyticsCarts);

export default router;
