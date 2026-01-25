/**
 * Validate if product has sufficient stock for purchase
 * Takes into account locked inventory
 * @param productId - Product ID
 * @param quantity - Quantity requested
 * @returns Available quantity for purchase
 */
export declare function getAvailableInventory(productId: string): Promise<number>;
/**
 * Lock inventory during checkout
 * Creates InventoryLock records that expire after 15 minutes
 * If not confirmed by webhook, locks are released and inventory is still available
 * @param orderId - Order ID
 * @param items - Array of {productId, quantity}
 * @returns true if all items locked successfully
 */
export declare function lockInventory(orderId: string, items: Array<{
    productId: string;
    quantity: number;
}>): Promise<boolean>;
/**
 * Deduct inventory from stock after payment confirmed
 * Called by webhook handler after signature verification
 * Removes locks and permanently decreases stock
 * @param orderId - Order ID
 */
export declare function confirmInventoryDeduction(orderId: string): Promise<void>;
/**
 * Release inventory locks when payment fails
 * Called when checkout fails or payment is cancelled
 * Stock remains unchanged
 * @param orderId - Order ID
 */
export declare function releaseInventoryLocks(orderId: string): Promise<void>;
/**
 * Restock inventory when order is cancelled or returned
 * @param orderId - Order ID
 */
export declare function restockInventory(orderId: string): Promise<void>;
/**
 * Restore inventory from order items (used when admin cancels order)
 * @param items - Array of order items with productId and quantity
 */
export declare function restoreInventory(items: Array<{
    productId: string;
    quantity: number;
}>): Promise<void>;
/**
 * Get all locked inventory for an order
 * @param orderId - Order ID
 * @returns Array of InventoryLock records
 */
export declare function getLockedInventory(orderId: string): Promise<({
    product: {
        name: string;
        id: string;
        slug: string;
        sku: string;
        description: string | null;
        shortDescription: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        discountPercent: import("@prisma/client/runtime/library").Decimal;
        finalPrice: import("@prisma/client/runtime/library").Decimal;
        categoryId: string;
        material: string | null;
        careInstructions: string | null;
        weight: string | null;
        dimensions: string | null;
        stockQuantity: number;
        lowStockThreshold: number;
        isActive: boolean;
        isFeatured: boolean;
        metaTitle: string | null;
        metaDescription: string | null;
        averageRating: import("@prisma/client/runtime/library").Decimal;
        reviewCount: number;
        createdAt: Date;
        updatedAt: Date;
    };
} & {
    id: string;
    createdAt: Date;
    quantity: number;
    expiresAt: Date;
    productId: string;
    orderId: string | null;
})[]>;
/**
 * Cleanup expired inventory locks
 * Should be called by a cron job every 5 minutes
 * Deletes locks that have expired (older than 15 minutes)
 */
export declare function cleanupExpiredLocks(): Promise<number>;
/**
 * Get inventory status for dashboard
 * Returns products with low stock
 * @param threshold - Stock threshold (default 10)
 */
export declare function getLowStockProducts(threshold?: number): Promise<{
    name: string;
    id: string;
    slug: string;
    price: import("@prisma/client/runtime/library").Decimal;
    stockQuantity: number;
}[]>;
/**
 * Get inventory status for a single product
 */
export declare function getProductInventoryStatus(productId: string): Promise<{
    product: {
        name: string;
        id: string;
        stockQuantity: number;
    };
    available: number;
    locked: number;
    total: number;
}>;
//# sourceMappingURL=inventory.d.ts.map