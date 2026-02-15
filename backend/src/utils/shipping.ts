/**
 * Shipping Logic — Single Source of Truth
 * 
 * Rule: FREE shipping for all orders (₹0 shipping fee).
 * This module is the ONLY place shipping is calculated.
 * Structure kept flexible for future shipping rule changes.
 */

import { prisma } from '../config/database';

/**
 * Calculate shipping fee for any order.
 * Currently always returns 0 (free shipping for all).
 * 
 * @param subtotalAfterDiscount - Order subtotal after discounts
 * @returns Shipping fee (always 0)
 */
export async function calculateShippingFee(subtotalAfterDiscount: number): Promise<number> {
  // Business rule: All orders have free shipping
  return 0;
}

/**
 * Get the current shipping rules (for API responses / frontend display).
 * Returns free shipping info.
 */
export async function getShippingRules(): Promise<{ 
  freeShipping: boolean;
  message: string;
}> {
  return {
    freeShipping: true,
    message: 'Free delivery across India',
  };
}
