"use strict";
/**
 * GST Calculation — Configurable per product/category
 *
 * Priority: Product.gstRate > TaxConfig by category > default 3%
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGSTRate = getGSTRate;
exports.calculateGSTAmount = calculateGSTAmount;
exports.invalidateTaxCache = invalidateTaxCache;
const database_1 = require("../config/database");
const DEFAULT_GST_RATE = 3; // 3% for jewellery (India)
let taxConfigCache = new Map();
let taxCacheExpiry = 0;
/**
 * Load all TaxConfig entries from DB (cached for 10 minutes).
 */
async function loadTaxConfigs() {
    const now = Date.now();
    if (taxConfigCache.size > 0 && now < taxCacheExpiry) {
        return taxConfigCache;
    }
    try {
        const configs = await database_1.prisma.taxConfig.findMany({
            where: { isActive: true },
        });
        const map = new Map();
        for (const c of configs) {
            map.set(c.categorySlug, Number(c.gstRate));
        }
        taxConfigCache = map;
        taxCacheExpiry = now + 10 * 60 * 1000; // 10 min cache
        return map;
    }
    catch {
        return taxConfigCache.size > 0 ? taxConfigCache : new Map();
    }
}
/**
 * Get GST rate for a product.
 * Checks product-level gstRate first, then category-level TaxConfig, then default.
 */
async function getGSTRate(productGstRate, categorySlug) {
    // 1. Product-level override
    if (productGstRate !== undefined && productGstRate !== null && productGstRate > 0) {
        return productGstRate;
    }
    // 2. Category-level config
    if (categorySlug) {
        const configs = await loadTaxConfigs();
        const categoryRate = configs.get(categorySlug);
        if (categoryRate !== undefined) {
            return categoryRate;
        }
    }
    // 3. Default
    return DEFAULT_GST_RATE;
}
/**
 * Calculate GST amount given a base amount and rate.
 */
function calculateGSTAmount(amount, gstRate) {
    return Math.round((amount * gstRate) / 100 * 100) / 100; // Round to 2 decimals
}
/**
 * Invalidate tax config cache (call after admin updates).
 */
function invalidateTaxCache() {
    taxConfigCache = new Map();
    taxCacheExpiry = 0;
}
//# sourceMappingURL=tax.js.map