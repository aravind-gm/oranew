/**
 * GST Calculation — Configurable per product/category
 *
 * Priority: Product.gstRate > TaxConfig by category > default 3%
 */
/**
 * Get GST rate for a product.
 * Checks product-level gstRate first, then category-level TaxConfig, then default.
 */
export declare function getGSTRate(productGstRate?: number | null, categorySlug?: string | null): Promise<number>;
/**
 * Calculate GST amount given a base amount and rate.
 */
export declare function calculateGSTAmount(amount: number, gstRate: number): number;
/**
 * Invalidate tax config cache (call after admin updates).
 */
export declare function invalidateTaxCache(): void;
//# sourceMappingURL=tax.d.ts.map