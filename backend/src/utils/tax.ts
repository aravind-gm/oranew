/**
 * GST Calculation — Configurable per product/category
 * 
 * Priority: Product.gstRate > TaxConfig by category > default 3%
 */

import { prisma } from '../config/database';

const DEFAULT_GST_RATE = 3; // 3% for jewellery (India)

let taxConfigCache: Map<string, number> = new Map();
let taxCacheExpiry = 0;

/**
 * Load all TaxConfig entries from DB (cached for 10 minutes).
 */
async function loadTaxConfigs(): Promise<Map<string, number>> {
  const now = Date.now();
  if (taxConfigCache.size > 0 && now < taxCacheExpiry) {
    return taxConfigCache;
  }

  try {
    const configs = await prisma.taxConfig.findMany({
      where: { isActive: true },
    });

    const map = new Map<string, number>();
    for (const c of configs) {
      map.set(c.categorySlug, Number(c.gstRate));
    }
    taxConfigCache = map;
    taxCacheExpiry = now + 10 * 60 * 1000; // 10 min cache
    return map;
  } catch {
    return taxConfigCache.size > 0 ? taxConfigCache : new Map();
  }
}

/**
 * Get GST rate for a product.
 * Checks product-level gstRate first, then category-level TaxConfig, then default.
 */
export async function getGSTRate(productGstRate?: number | null, categorySlug?: string | null): Promise<number> {
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
export function calculateGSTAmount(amount: number, gstRate: number): number {
  return Math.round((amount * gstRate) / 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Invalidate tax config cache (call after admin updates).
 */
export function invalidateTaxCache(): void {
  taxConfigCache = new Map();
  taxCacheExpiry = 0;
}
