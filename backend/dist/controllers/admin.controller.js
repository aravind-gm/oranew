"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReturnStats = exports.updateReturnStatus = exports.getReturnById = exports.getReturns = exports.setPrimaryImage = exports.deleteProductImage = exports.addProductImages = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getOrdersReport = exports.getPaymentsReport = exports.getRevenueReport = exports.cleanupLocks = exports.bulkUpdateInventory = exports.updateInventory = exports.getInventory = exports.getAdminProducts = exports.getLowStockProducts = exports.getCustomers = exports.updateOrderStatus = exports.getOrderById = exports.getAllOrders = exports.getDashboardStats = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const email_service_1 = require("../services/email.service");
const inventory_1 = require("../utils/inventory");
// ============================================
// DASHBOARD
// ============================================
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalOrders, totalRevenue, totalCustomers, pendingOrders, todayOrders, todayRevenue, lowStockCount,] = await Promise.all([
            database_1.prisma.order.count(),
            database_1.prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { paymentStatus: 'CONFIRMED' },
            }),
            database_1.prisma.user.count({ where: { role: 'CUSTOMER' } }),
            database_1.prisma.order.count({ where: { status: 'PENDING' } }),
            database_1.prisma.order.count({
                where: { createdAt: { gte: today } },
            }),
            database_1.prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: {
                    createdAt: { gte: today },
                    paymentStatus: 'CONFIRMED',
                },
            }),
            database_1.prisma.product.count({
                where: {
                    isActive: true,
                    stockQuantity: { lte: 10 },
                },
            }),
        ]);
        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                totalCustomers,
                pendingOrders,
                todayOrders,
                todayRevenue: todayRevenue._sum.totalAmount || 0,
                lowStockCount,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
// ============================================
// ORDERS MANAGEMENT
// ============================================
const getAllOrders = async (req, res, next) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [orders, total] = await Promise.all([
            database_1.prisma.order.findMany({
                where,
                include: {
                    user: { select: { fullName: true, email: true, phone: true } },
                    items: {
                        include: {
                            product: {
                                select: { name: true, images: { where: { isPrimary: true }, take: 1 } },
                            },
                        },
                    },
                    shippingAddress: true,
                    billingAddress: true,
                    payments: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            database_1.prisma.order.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllOrders = getAllOrders;
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await database_1.prisma.order.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, fullName: true, email: true, phone: true } },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                images: { where: { isPrimary: true }, take: 1 },
                            },
                        },
                    },
                },
                shippingAddress: true,
                billingAddress: true,
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!order) {
            throw new errorHandler_1.AppError('Order not found', 404);
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, trackingNumber, courierName, shiprocketOrderId, cancelReason } = req.body;
        console.log('[Admin] Updating order status:', { id, status, trackingNumber });
        const existingOrder = await database_1.prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!existingOrder) {
            throw new errorHandler_1.AppError('Order not found', 404);
        }
        const updateData = {
            status,
            ...(trackingNumber !== undefined && { trackingNumber }),
            ...(courierName !== undefined && { courierName }),
            ...(shiprocketOrderId !== undefined && { shiprocketOrderId }),
            ...(status === 'SHIPPED' && {
                shippedAt: new Date(),
                shipmentStatus: 'SHIPPED'
            }),
            ...(status === 'DELIVERED' && {
                deliveredAt: new Date(),
                shipmentStatus: 'DELIVERED'
            }),
            ...(status === 'CANCELLED' && {
                cancelledAt: new Date(),
                cancelReason: cancelReason || 'Cancelled by admin',
            }),
        };
        // If order is being cancelled, restore inventory
        if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
            try {
                // Map items to correct structure for restoreInventory
                const itemsToRestore = existingOrder.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                }));
                console.log('[Admin] Restoring inventory for order:', { orderId: id, items: itemsToRestore });
                await (0, inventory_1.restoreInventory)(itemsToRestore);
            }
            catch (invError) {
                console.error('[Admin] Inventory restore error:', invError);
                throw new errorHandler_1.AppError('Failed to restore inventory during cancellation', 500);
            }
        }
        const order = await database_1.prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                items: {
                    include: {
                        product: {
                            select: { name: true }
                        }
                    }
                },
                shippingAddress: true,
            },
        });
        // Send email notifications based on status change
        try {
            const emailData = {
                orderNumber: order.orderNumber,
                customerName: order.user.fullName,
                customerEmail: order.user.email,
                items: order.items.map(item => ({
                    productName: item.productName || item.product?.name || 'Product',
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                })),
                totalAmount: Number(order.totalAmount),
                shippingAddress: {
                    fullName: order.shippingAddress.fullName,
                    addressLine1: order.shippingAddress.addressLine1,
                    addressLine2: order.shippingAddress.addressLine2 || undefined,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    pincode: order.shippingAddress.pincode,
                },
                trackingNumber: trackingNumber || order.trackingNumber || undefined,
                courierName: courierName || undefined,
            };
            // Send email based on status (fire and forget - don't block response)
            if (status === 'CONFIRMED') {
                (0, email_service_1.sendOrderConfirmedEmail)(emailData).catch(err => console.error('Failed to send confirmed email:', err));
            }
            else if (status === 'SHIPPED') {
                (0, email_service_1.sendOrderShippedEmail)(emailData).catch(err => console.error('Failed to send shipped email:', err));
            }
            else if (status === 'DELIVERED') {
                (0, email_service_1.sendOrderDeliveredEmail)(emailData).catch(err => console.error('Failed to send delivered email:', err));
            }
        }
        catch (emailError) {
            console.error('Email notification error:', emailError);
            // Don't fail the request if email fails
        }
        console.log('[Admin] Order status updated successfully:', { orderId: id, newStatus: status });
        res.json({ success: true, data: order });
    }
    catch (error) {
        console.error('[Admin UpdateOrderStatus Error]:', error);
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
// ============================================
// CUSTOMERS MANAGEMENT
// ============================================
const getCustomers = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = { role: 'CUSTOMER' };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    isVerified: true,
                    orders: {
                        select: { id: true, totalAmount: true, status: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            database_1.prisma.user.count({ where }),
        ]);
        // Calculate total spent per customer
        const customersWithStats = customers.map((customer) => ({
            ...customer,
            totalOrders: customer.orders.length,
            totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
        }));
        res.json({
            success: true,
            data: {
                customers: customersWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomers = getCustomers;
// ============================================
// INVENTORY MANAGEMENT
// ============================================
const getLowStockProducts = async (req, res, next) => {
    try {
        const { threshold = '10' } = req.query;
        const products = await database_1.prisma.product.findMany({
            where: {
                isActive: true,
                stockQuantity: { lte: parseInt(threshold) },
            },
            include: {
                category: { select: { name: true } },
                images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { stockQuantity: 'asc' },
        });
        res.json({ success: true, data: products });
    }
    catch (error) {
        next(error);
    }
};
exports.getLowStockProducts = getLowStockProducts;
// Get all products for admin (including inactive)
const getAdminProducts = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', search, category, isActive, lowStock, outOfStock } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) {
            where.categoryId = category;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        if (lowStock === 'true') {
            where.stockQuantity = { lte: 10 };
        }
        if (outOfStock === 'true') {
            where.stockQuantity = { lte: 0 };
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    images: true,
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.product.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminProducts = getAdminProducts;
const getInventory = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', search, lowStock } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = { isActive: true };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (lowStock === 'true') {
            where.stockQuantity = { lte: 10 };
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    stockQuantity: true,
                    lowStockThreshold: true,
                    price: true,
                    category: { select: { name: true } },
                    images: { where: { isPrimary: true }, take: 1 },
                },
                orderBy: { stockQuantity: 'asc' },
                skip,
                take: parseInt(limit),
            }),
            database_1.prisma.product.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getInventory = getInventory;
const updateInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stockQuantity, lowStockThreshold } = req.body;
        if (stockQuantity !== undefined && stockQuantity < 0) {
            throw new errorHandler_1.AppError('Stock quantity cannot be negative', 400);
        }
        const product = await database_1.prisma.product.update({
            where: { id },
            data: {
                ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
                ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
            },
            select: {
                id: true,
                name: true,
                sku: true,
                stockQuantity: true,
                lowStockThreshold: true,
            },
        });
        res.json({
            success: true,
            data: product,
            message: 'Inventory updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateInventory = updateInventory;
const bulkUpdateInventory = async (req, res, next) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new errorHandler_1.AppError('Updates array is required', 400);
        }
        const results = await Promise.all(updates.map(async (update) => {
            if (update.stockQuantity < 0) {
                return { id: update.id, error: 'Stock cannot be negative' };
            }
            try {
                const product = await database_1.prisma.product.update({
                    where: { id: update.id },
                    data: { stockQuantity: update.stockQuantity },
                    select: { id: true, name: true, stockQuantity: true },
                });
                return { ...product, success: true };
            }
            catch {
                return { id: update.id, error: 'Product not found' };
            }
        }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkUpdateInventory = bulkUpdateInventory;
const cleanupLocks = async (req, res, next) => {
    try {
        const count = await (0, inventory_1.cleanupExpiredLocks)();
        res.json({
            success: true,
            message: `Cleaned up ${count} expired inventory locks`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cleanupLocks = cleanupLocks;
// ============================================
// REPORTS & ANALYTICS
// ============================================
const getRevenueReport = async (req, res, next) => {
    try {
        const { period = 'daily', startDate, endDate } = req.query;
        const now = new Date();
        let start;
        let end = endDate ? new Date(endDate) : now;
        switch (period) {
            case 'weekly':
                start = startDate
                    ? new Date(startDate)
                    : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                start = startDate
                    ? new Date(startDate)
                    : new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'yearly':
                start = startDate
                    ? new Date(startDate)
                    : new Date(now.getFullYear(), 0, 1);
                break;
            default: // daily
                start = startDate
                    ? new Date(startDate)
                    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // Get orders within date range
        const orders = await database_1.prisma.order.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                paymentStatus: 'CONFIRMED',
            },
            select: {
                createdAt: true,
                totalAmount: true,
                status: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        // Group by date
        const revenueByDate = {};
        orders.forEach((order) => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            if (!revenueByDate[dateKey]) {
                revenueByDate[dateKey] = { revenue: 0, orders: 0 };
            }
            revenueByDate[dateKey].revenue += Number(order.totalAmount);
            revenueByDate[dateKey].orders += 1;
        });
        const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            orders: data.orders,
        }));
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        res.json({
            success: true,
            data: {
                period,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                totalRevenue,
                totalOrders: orders.length,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                chartData,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRevenueReport = getRevenueReport;
const getPaymentsReport = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const [payments, total, stats] = await Promise.all([
            database_1.prisma.payment.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            user: { select: { fullName: true, email: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            database_1.prisma.payment.count({ where }),
            database_1.prisma.payment.groupBy({
                by: ['status'],
                _count: { id: true },
                _sum: { amount: true },
            }),
        ]);
        const statusStats = stats.reduce((acc, stat) => {
            acc[stat.status] = {
                count: stat._count.id,
                amount: Number(stat._sum.amount) || 0,
            };
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                payments,
                stats: statusStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentsReport = getPaymentsReport;
const getOrdersReport = async (req, res, next) => {
    try {
        const stats = await database_1.prisma.order.groupBy({
            by: ['status'],
            _count: { id: true },
            _sum: { totalAmount: true },
        });
        const orderStats = stats.reduce((acc, stat) => {
            acc[stat.status] = {
                count: stat._count.id,
                revenue: Number(stat._sum.totalAmount) || 0,
            };
            return acc;
        }, {});
        const totalOrders = stats.reduce((sum, s) => sum + s._count.id, 0);
        const totalRevenue = stats.reduce((sum, s) => sum + (Number(s._sum.totalAmount) || 0), 0);
        res.json({
            success: true,
            data: {
                orderStats,
                totalOrders,
                totalRevenue,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrdersReport = getOrdersReport;
// ============================================
// CATEGORIES (Admin CRUD)
// ============================================
const createCategory = async (req, res, next) => {
    try {
        const { name, description, parentId, imageUrl, sortOrder } = req.body;
        if (!name) {
            throw new errorHandler_1.AppError('Category name is required', 400);
        }
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');
        const category = await database_1.prisma.category.create({
            data: {
                name,
                slug,
                description,
                parentId,
                imageUrl,
                sortOrder: sortOrder || 0,
            },
        });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        if (updateData.name) {
            updateData.slug = updateData.name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');
        }
        const category = await database_1.prisma.category.update({
            where: { id },
            data: updateData,
        });
        res.json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if category has products
        const productCount = await database_1.prisma.product.count({
            where: { categoryId: id },
        });
        if (productCount > 0) {
            throw new errorHandler_1.AppError(`Cannot delete category with ${productCount} products. Move or delete products first.`, 400);
        }
        await database_1.prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
// ============================================
// PRODUCT IMAGES MANAGEMENT
// ============================================
const addProductImages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { images } = req.body;
        if (!images || !Array.isArray(images) || images.length === 0) {
            throw new errorHandler_1.AppError('Images array is required', 400);
        }
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Get current max sort order
        const maxSortOrder = await database_1.prisma.productImage.aggregate({
            where: { productId: id },
            _max: { sortOrder: true },
        });
        let sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;
        const createdImages = await Promise.all(images.map(async (img) => {
            const image = await database_1.prisma.productImage.create({
                data: {
                    productId: id,
                    imageUrl: img.url,
                    altText: img.alt || product.name,
                    sortOrder: sortOrder++,
                    isPrimary: img.isPrimary || false,
                },
            });
            return image;
        }));
        res.json({
            success: true,
            data: createdImages,
            message: `Added ${createdImages.length} images`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addProductImages = addProductImages;
const deleteProductImage = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;
        const image = await database_1.prisma.productImage.findFirst({
            where: { id: imageId, productId: id },
        });
        if (!image) {
            throw new errorHandler_1.AppError('Image not found', 404);
        }
        await database_1.prisma.productImage.delete({ where: { id: imageId } });
        res.json({ success: true, message: 'Image deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProductImage = deleteProductImage;
const setPrimaryImage = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;
        // First, unset all primary images for this product
        await database_1.prisma.productImage.updateMany({
            where: { productId: id },
            data: { isPrimary: false },
        });
        // Set the new primary image
        const image = await database_1.prisma.productImage.update({
            where: { id: imageId },
            data: { isPrimary: true },
        });
        res.json({ success: true, data: image });
    }
    catch (error) {
        next(error);
    }
};
exports.setPrimaryImage = setPrimaryImage;
// ============================================
// RETURNS MANAGEMENT
// ============================================
const getReturns = async (req, res, next) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const [returns, total] = await Promise.all([
            database_1.prisma.return.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            totalAmount: true,
                            items: {
                                include: {
                                    product: {
                                        select: { name: true, images: { where: { isPrimary: true }, take: 1 } },
                                    },
                                },
                            },
                        },
                    },
                    user: {
                        select: { fullName: true, email: true, phone: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            database_1.prisma.return.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                returns,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReturns = getReturns;
const getReturnById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const returnRequest = await database_1.prisma.return.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: { name: true, sku: true, images: { where: { isPrimary: true }, take: 1 } },
                                },
                            },
                        },
                        shippingAddress: true,
                        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
                    },
                },
                user: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
            },
        });
        if (!returnRequest) {
            throw new errorHandler_1.AppError('Return request not found', 404);
        }
        res.json({ success: true, data: returnRequest });
    }
    catch (error) {
        next(error);
    }
};
exports.getReturnById = getReturnById;
const updateReturnStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, refundAmount, restock } = req.body;
        const existingReturn = await database_1.prisma.return.findUnique({
            where: { id },
            include: { order: { include: { items: true } } },
        });
        if (!existingReturn) {
            throw new errorHandler_1.AppError('Return request not found', 404);
        }
        const updateData = {
            status,
            ...(adminNotes && { adminNotes }),
        };
        // Handle approval
        if (status === 'APPROVED') {
            updateData.approvedAt = new Date();
        }
        // Handle rejection
        if (status === 'REJECTED') {
            updateData.resolvedAt = new Date();
        }
        // Handle refund processing
        if (status === 'REFUNDED') {
            updateData.resolvedAt = new Date();
            updateData.refundAmount = refundAmount || existingReturn.order.totalAmount;
            // Restock inventory if requested
            if (restock) {
                await (0, inventory_1.restoreInventory)(existingReturn.order.items);
                updateData.restocked = true;
            }
            // Update order status
            await database_1.prisma.order.update({
                where: { id: existingReturn.orderId },
                data: { status: 'REFUNDED' },
            });
            // Update payment status
            await database_1.prisma.payment.updateMany({
                where: { orderId: existingReturn.orderId },
                data: { status: 'REFUNDED' },
            });
        }
        const updatedReturn = await database_1.prisma.return.update({
            where: { id },
            data: updateData,
            include: {
                order: { select: { orderNumber: true } },
                user: { select: { fullName: true, email: true } },
            },
        });
        res.json({ success: true, data: updatedReturn });
    }
    catch (error) {
        next(error);
    }
};
exports.updateReturnStatus = updateReturnStatus;
const getReturnStats = async (req, res, next) => {
    try {
        const stats = await database_1.prisma.return.groupBy({
            by: ['status'],
            _count: { id: true },
            _sum: { refundAmount: true },
        });
        const returnStats = stats.reduce((acc, stat) => {
            acc[stat.status] = {
                count: stat._count.id,
                refundedAmount: Number(stat._sum.refundAmount) || 0,
            };
            return acc;
        }, {});
        const pendingCount = await database_1.prisma.return.count({
            where: { status: 'REQUESTED' },
        });
        res.json({
            success: true,
            data: {
                stats: returnStats,
                pendingCount,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReturnStats = getReturnStats;
//# sourceMappingURL=admin.controller.js.map