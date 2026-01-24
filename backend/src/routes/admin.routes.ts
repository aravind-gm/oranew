import { Router } from 'express';
import {
    addProductImages,
    bulkUpdateInventory,
    cleanupLocks,
    createCategory,
    deleteCategory,
    deleteProductImage,
    getAdminProducts,
    getAllOrders,
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
    setPrimaryImage,
    updateCategory,
    updateInventory,
    updateOrderStatus,
    updateReturnStatus,
} from '../controllers/admin.controller';
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    updateProduct,
} from '../controllers/product.controller';
import { authorize, protect } from '../middleware/auth';

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

export default router;
