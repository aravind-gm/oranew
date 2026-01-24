"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableInventory = getAvailableInventory;
exports.lockInventory = lockInventory;
exports.confirmInventoryDeduction = confirmInventoryDeduction;
exports.releaseInventoryLocks = releaseInventoryLocks;
exports.restockInventory = restockInventory;
exports.restoreInventory = restoreInventory;
exports.getLockedInventory = getLockedInventory;
exports.cleanupExpiredLocks = cleanupExpiredLocks;
exports.getLowStockProducts = getLowStockProducts;
exports.getProductInventoryStatus = getProductInventoryStatus;
const database_1 = require("../config/database");
const helpers_1 = require("./helpers");
const INVENTORY_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
/**
 * Validate if product has sufficient stock for purchase
 * Takes into account locked inventory
 * @param productId - Product ID
 * @param quantity - Quantity requested
 * @returns Available quantity for purchase
 */
async function getAvailableInventory(productId) {
    const product = await database_1.prisma.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
    });
    if (!product) {
        throw new helpers_1.AppError('Product not found', 404);
    }
    // Calculate locked quantity (non-expired locks only)
    const lockedQuantity = await database_1.prisma.inventoryLock.aggregate({
        where: {
            productId,
            expiresAt: { gt: new Date() },
        },
        _sum: { quantity: true },
    });
    const available = product.stockQuantity - (lockedQuantity._sum.quantity || 0);
    return Math.max(0, available);
}
/**
 * Lock inventory during checkout
 * Creates InventoryLock records that expire after 15 minutes
 * If not confirmed by webhook, locks are released and inventory is still available
 * @param orderId - Order ID
 * @param items - Array of {productId, quantity}
 * @returns true if all items locked successfully
 */
async function lockInventory(orderId, items) {
    try {
        // Validate all items have stock before locking any
        for (const item of items) {
            const available = await getAvailableInventory(item.productId);
            if (available < item.quantity) {
                const product = await database_1.prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true, stockQuantity: true },
                });
                throw new helpers_1.AppError(`Insufficient stock for ${product?.name}. Available: ${available}, Requested: ${item.quantity}`, 400);
            }
        }
        // Lock all items in a transaction
        const expiresAt = new Date(Date.now() + INVENTORY_LOCK_DURATION);
        for (const item of items) {
            await database_1.prisma.inventoryLock.create({
                data: {
                    orderId,
                    productId: item.productId,
                    quantity: item.quantity,
                    expiresAt,
                },
            });
        }
        return true;
    }
    catch (error) {
        if (error instanceof helpers_1.AppError)
            throw error;
        console.error('Inventory lock failed:', error);
        throw new helpers_1.AppError('Failed to lock inventory', 500);
    }
}
/**
 * Deduct inventory from stock after payment confirmed
 * Called by webhook handler after signature verification
 * Removes locks and permanently decreases stock
 * @param orderId - Order ID
 */
async function confirmInventoryDeduction(orderId) {
    try {
        await database_1.prisma.$transaction(async (tx) => {
            // Get all locks for this order
            const locks = await tx.inventoryLock.findMany({
                where: { orderId },
                select: { productId: true, quantity: true },
            });
            // Deduct from stock for each product
            for (const lock of locks) {
                await tx.product.update({
                    where: { id: lock.productId },
                    data: {
                        stockQuantity: {
                            decrement: lock.quantity,
                        },
                    },
                });
            }
            // Delete the locks (they're now permanent)
            await tx.inventoryLock.deleteMany({
                where: { orderId },
            });
        });
    }
    catch (error) {
        console.error('Inventory confirmation failed:', error);
        throw new helpers_1.AppError('Failed to confirm inventory', 500);
    }
}
/**
 * Release inventory locks when payment fails
 * Called when checkout fails or payment is cancelled
 * Stock remains unchanged
 * @param orderId - Order ID
 */
async function releaseInventoryLocks(orderId) {
    try {
        await database_1.prisma.inventoryLock.deleteMany({
            where: { orderId },
        });
    }
    catch (error) {
        console.error('Inventory release failed:', error);
        throw new helpers_1.AppError('Failed to release inventory', 500);
    }
}
/**
 * Restock inventory when order is cancelled or returned
 * @param orderId - Order ID
 */
async function restockInventory(orderId) {
    try {
        // Get all items from the order to restock
        const orderItems = await database_1.prisma.orderItem.findMany({
            where: { orderId },
            select: { productId: true, quantity: true },
        });
        // Increment stock for each product
        for (const item of orderItems) {
            await database_1.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: {
                        increment: item.quantity,
                    },
                },
            });
        }
    }
    catch (error) {
        console.error('Restock failed:', error);
        throw new helpers_1.AppError('Failed to restock inventory', 500);
    }
}
/**
 * Restore inventory from order items (used when admin cancels order)
 * @param items - Array of order items with productId and quantity
 */
async function restoreInventory(items) {
    try {
        for (const item of items) {
            await database_1.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: {
                        increment: item.quantity,
                    },
                },
            });
        }
    }
    catch (error) {
        console.error('Restore inventory failed:', error);
        throw new helpers_1.AppError('Failed to restore inventory', 500);
    }
}
/**
 * Get all locked inventory for an order
 * @param orderId - Order ID
 * @returns Array of InventoryLock records
 */
async function getLockedInventory(orderId) {
    return database_1.prisma.inventoryLock.findMany({
        where: { orderId },
        include: { product: true },
    });
}
/**
 * Cleanup expired inventory locks
 * Should be called by a cron job every 5 minutes
 * Deletes locks that have expired (older than 15 minutes)
 */
async function cleanupExpiredLocks() {
    try {
        const result = await database_1.prisma.inventoryLock.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        if (result.count > 0) {
            console.log(`[Inventory] Cleaned up ${result.count} expired inventory locks`);
        }
        return result.count;
    }
    catch (error) {
        console.error('Cleanup failed:', error);
        throw new helpers_1.AppError('Failed to cleanup locks', 500);
    }
}
/**
 * Get inventory status for dashboard
 * Returns products with low stock
 * @param threshold - Stock threshold (default 10)
 */
async function getLowStockProducts(threshold = 10) {
    try {
        return database_1.prisma.product.findMany({
            where: {
                stockQuantity: {
                    lte: threshold,
                },
            },
            select: {
                id: true,
                name: true,
                slug: true,
                stockQuantity: true,
                price: true,
            },
            orderBy: {
                stockQuantity: 'asc',
            },
        });
    }
    catch (error) {
        console.error('Get low stock products failed:', error);
        throw new helpers_1.AppError('Failed to get low stock products', 500);
    }
}
/**
 * Get inventory status for a single product
 */
async function getProductInventoryStatus(productId) {
    try {
        const product = await database_1.prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                stockQuantity: true,
            },
        });
        if (!product) {
            throw new helpers_1.AppError('Product not found', 404);
        }
        // Get all non-expired locks for this product
        const lockedCount = await database_1.prisma.inventoryLock.aggregate({
            where: {
                productId,
                expiresAt: { gt: new Date() },
            },
            _sum: { quantity: true },
        });
        const locked = lockedCount._sum.quantity || 0;
        return {
            product,
            available: product.stockQuantity - locked,
            locked,
            total: product.stockQuantity,
        };
    }
    catch (error) {
        if (error instanceof helpers_1.AppError)
            throw error;
        console.error('Get product inventory status failed:', error);
        throw new helpers_1.AppError('Failed to get inventory status', 500);
    }
}
//# sourceMappingURL=inventory.js.map