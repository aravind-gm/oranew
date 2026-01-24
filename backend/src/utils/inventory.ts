import { prisma } from '../config/database';
import { AppError } from './helpers';

const INVENTORY_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Validate if product has sufficient stock for purchase
 * Takes into account locked inventory
 * @param productId - Product ID
 * @param quantity - Quantity requested
 * @returns Available quantity for purchase
 */
export async function getAvailableInventory(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Calculate locked quantity (non-expired locks only)
  const lockedQuantity = await prisma.inventoryLock.aggregate({
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
export async function lockInventory(
  orderId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<boolean> {
  try {
    // Validate all items have stock before locking any
    for (const item of items) {
      const available = await getAvailableInventory(item.productId);
      if (available < item.quantity) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stockQuantity: true },
        });
        throw new AppError(
          `Insufficient stock for ${product?.name}. Available: ${available}, Requested: ${item.quantity}`,
          400
        );
      }
    }

    // Lock all items in a transaction
    const expiresAt = new Date(Date.now() + INVENTORY_LOCK_DURATION);

    for (const item of items) {
      await prisma.inventoryLock.create({
        data: {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          expiresAt,
        },
      });
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Inventory lock failed:', error);
    throw new AppError('Failed to lock inventory', 500);
  }
}

/**
 * Deduct inventory from stock after payment confirmed
 * Called by webhook handler after signature verification
 * Removes locks and permanently decreases stock
 * @param orderId - Order ID
 */
export async function confirmInventoryDeduction(orderId: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    console.error('Inventory confirmation failed:', error);
    throw new AppError('Failed to confirm inventory', 500);
  }
}

/**
 * Release inventory locks when payment fails
 * Called when checkout fails or payment is cancelled
 * Stock remains unchanged
 * @param orderId - Order ID
 */
export async function releaseInventoryLocks(orderId: string): Promise<void> {
  try {
    await prisma.inventoryLock.deleteMany({
      where: { orderId },
    });
  } catch (error) {
    console.error('Inventory release failed:', error);
    throw new AppError('Failed to release inventory', 500);
  }
}

/**
 * Restock inventory when order is cancelled or returned
 * @param orderId - Order ID
 */
export async function restockInventory(orderId: string): Promise<void> {
  try {
    // Get all items from the order to restock
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });

    // Increment stock for each product
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }
  } catch (error) {
    console.error('Restock failed:', error);
    throw new AppError('Failed to restock inventory', 500);
  }
}

/**
 * Restore inventory from order items (used when admin cancels order)
 * @param items - Array of order items with productId and quantity
 */
export async function restoreInventory(
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  try {
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }
  } catch (error) {
    console.error('Restore inventory failed:', error);
    throw new AppError('Failed to restore inventory', 500);
  }
}

/**
 * Get all locked inventory for an order
 * @param orderId - Order ID
 * @returns Array of InventoryLock records
 */
export async function getLockedInventory(orderId: string) {
  return prisma.inventoryLock.findMany({
    where: { orderId },
    include: { product: true },
  });
}

/**
 * Cleanup expired inventory locks
 * Should be called by a cron job every 5 minutes
 * Deletes locks that have expired (older than 15 minutes)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const result = await prisma.inventoryLock.deleteMany({
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
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw new AppError('Failed to cleanup locks', 500);
  }
}

/**
 * Get inventory status for dashboard
 * Returns products with low stock
 * @param threshold - Stock threshold (default 10)
 */
export async function getLowStockProducts(threshold: number = 10) {
  try {
    return prisma.product.findMany({
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
  } catch (error) {
    console.error('Get low stock products failed:', error);
    throw new AppError('Failed to get low stock products', 500);
  }
}

/**
 * Get inventory status for a single product
 */
export async function getProductInventoryStatus(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Get all non-expired locks for this product
    const lockedCount = await prisma.inventoryLock.aggregate({
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get product inventory status failed:', error);
    throw new AppError('Failed to get inventory status', 500);
  }
}
