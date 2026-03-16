/**
 * GST Calculation — Configurable per product/category
 *
 * IMPORTANT: For B2C e-commerce in India, all displayed prices are
 * GST-INCLUSIVE (MRP includes GST). The GST amount is extracted from
 * the price for invoice/tax filing purposes, NOT added on top.
 *
 * Priority: Product.gstRate > TaxConfig by category > default 3%
 */
/**
 * Get GST rate for a product.
 * Checks product-level gstRate first, then category-level TaxConfig, then default.
 */
export declare function getGSTRate(productGstRate?: number | null, categorySlug?: string | null): Promise<number>;
/**
 * Calculate GST amount INCLUDED in a given price (reverse calculation).
 * Since prices are GST-inclusive, we extract the GST portion.
 * Formula: GST = amount - (amount / (1 + rate/100))
 * e.g. ₹1,000 at 3% → GST included = ₹1,000 - ₹970.87 = ₹29.13
 */
export declare function calculateGSTAmount(amount: number, gstRate: number): number;
/**
 * Invalidate tax config cache (call after admin updates).
 */
export declare function invalidateTaxCache(): void;
//# sourceMappingURL=tax.d.ts.map