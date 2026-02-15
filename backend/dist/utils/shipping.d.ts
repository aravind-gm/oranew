/**
 * Shipping Logic — Single Source of Truth
 *
 * Rule: FREE shipping for all orders (₹0 shipping fee).
 * This module is the ONLY place shipping is calculated.
 * Structure kept flexible for future shipping rule changes.
 */
/**
 * Calculate shipping fee for any order.
 * Currently always returns 0 (free shipping for all).
 *
 * @param subtotalAfterDiscount - Order subtotal after discounts
 * @returns Shipping fee (always 0)
 */
export declare function calculateShippingFee(subtotalAfterDiscount: number): Promise<number>;
/**
 * Get the current shipping rules (for API responses / frontend display).
 * Returns free shipping info.
 */
export declare function getShippingRules(): Promise<{
    freeShipping: boolean;
    message: string;
}>;
//# sourceMappingURL=shipping.d.ts.map