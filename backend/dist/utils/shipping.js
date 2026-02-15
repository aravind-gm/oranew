"use strict";
/**
 * Shipping Logic — Single Source of Truth
 *
 * Rule: FREE shipping for all orders (₹0 shipping fee).
 * This module is the ONLY place shipping is calculated.
 * Structure kept flexible for future shipping rule changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateShippingFee = calculateShippingFee;
exports.getShippingRules = getShippingRules;
/**
 * Calculate shipping fee for any order.
 * Currently always returns 0 (free shipping for all).
 *
 * @param subtotalAfterDiscount - Order subtotal after discounts
 * @returns Shipping fee (always 0)
 */
async function calculateShippingFee(subtotalAfterDiscount) {
    // Business rule: All orders have free shipping
    return 0;
}
/**
 * Get the current shipping rules (for API responses / frontend display).
 * Returns free shipping info.
 */
async function getShippingRules() {
    return {
        freeShipping: true,
        message: 'Free delivery across India',
    };
}
//# sourceMappingURL=shipping.js.map