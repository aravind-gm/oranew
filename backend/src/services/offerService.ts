/**
 * Offer Service — "Buy Any Necklace, Get a Ring FREE"
 *
 * Central engine for the campaign. Never trust frontend.
 *
 * Business rules:
 *   - Every eligible necklace in the cart unlocks exactly 1 free ring.
 *   - freeRings in cart MUST NOT exceed necklaceCount.
 *   - Free rings MUST have bogoCategory === "ring" AND isBOGOEligible === true.
 *   - Free ring unit price is forced to ₹0 at checkout.
 *   - Future campaigns only need a new OfferType entry — no code change required.
 */

import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';

export type OfferRole = 'necklace' | 'ring';

export interface CartGiftItem {
  productId: string;
  quantity: number;
  isFreeGift: boolean;
  linkedNecklaceProductId?: string; // which necklace triggered this gift
}

export interface OfferValidationResult {
  valid: boolean;
  errorCode?: string;
  message?: string;
  necklaceCount: number;
  freeRingCount: number;
  allowedFreeRings: number;
  freeRingItems: CartGiftItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the active campaign from DB (cached for this request lifetime) */
export async function getActiveCampaign() {
  return withRetry(() =>
    prisma.bOGOCampaign.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  );
}

/** Fetch a product's offer fields in one call */
async function getProductOfferFields(productId: string) {
  return withRetry(() =>
    prisma.product.findUnique({
      where: { id: productId, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        finalPrice: true,
        isBOGOEligible: true,
        bogoCategory: true,
        bogoActive: true,
        stockQuantity: true,
      },
    })
  );
}

// ─── Core Validation ─────────────────────────────────────────────────────────

/**
 * Validate that the cart's free-ring items are correct.
 *
 * @param cartItems  Each item from the checkout payload (productId + quantity + optional isFreeGift flag)
 * @returns          OfferValidationResult — caller should reject if valid === false
 */
export async function validateOfferCart(
  cartItems: Array<{ productId: string; quantity: number; isFreeGift?: boolean }>
): Promise<OfferValidationResult> {
  const campaign = await getActiveCampaign();

  // Campaign off → reject any free-ring attempts
  if (!campaign || !campaign.isActive) {
    const hasFreeRings = cartItems.some((i) => i.isFreeGift);
    if (hasFreeRings) {
      return {
        valid: false,
        errorCode: 'CAMPAIGN_INACTIVE',
        message: 'The offer campaign is not currently active.',
        necklaceCount: 0,
        freeRingCount: 0,
        allowedFreeRings: 0,
        freeRingItems: [],
      };
    }
    return {
      valid: true,
      necklaceCount: 0,
      freeRingCount: 0,
      allowedFreeRings: 0,
      freeRingItems: [],
    };
  }

  // Fetch all product offer fields in a single batch
  const productIds = [...new Set(cartItems.map((i) => i.productId))];
  const products = await withRetry(() =>
    prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        finalPrice: true,
        isBOGOEligible: true,
        bogoCategory: true,
        bogoActive: true,
        stockQuantity: true,
      },
    })
  );
  const productMap = new Map(products.map((p) => [p.id, p]));

  let necklaceCount = 0;
  let freeRingCount = 0;
  const freeRingItems: CartGiftItem[] = [];

  for (const item of cartItems) {
    const product = productMap.get(item.productId);

    if (!product) {
      return {
        valid: false,
        errorCode: 'PRODUCT_NOT_FOUND',
        message: `Product ${item.productId} not found or inactive.`,
        necklaceCount: 0,
        freeRingCount: 0,
        allowedFreeRings: 0,
        freeRingItems: [],
      };
    }

    if (item.isFreeGift) {
      // Must be an eligible ring with campaign active
      if (product.bogoCategory !== 'ring' || !product.isBOGOEligible || !product.bogoActive) {
        return {
          valid: false,
          errorCode: 'INVALID_FREE_GIFT',
          message: `Product "${product.name}" is not eligible as a complimentary ring.`,
          necklaceCount,
          freeRingCount,
          allowedFreeRings: necklaceCount,
          freeRingItems,
        };
      }
      freeRingCount += item.quantity;
      freeRingItems.push({ ...item, isFreeGift: true });
    } else {
      // Eligible necklace?
      if (product.isBOGOEligible && product.bogoCategory === 'necklace' && product.bogoActive) {
        necklaceCount += item.quantity;
      }
    }
  }

  if (freeRingCount > necklaceCount) {
    return {
      valid: false,
      errorCode: 'TOO_MANY_FREE_RINGS',
      message: `You can claim ${necklaceCount} complimentary ring(s) but ${freeRingCount} were requested.`,
      necklaceCount,
      freeRingCount,
      allowedFreeRings: necklaceCount,
      freeRingItems,
    };
  }

  return {
    valid: true,
    necklaceCount,
    freeRingCount,
    allowedFreeRings: necklaceCount,
    freeRingItems,
  };
}

// ─── Eligible Products ────────────────────────────────────────────────────────

export async function getEligibleNecklaces(search?: string) {
  const where: any = {
    isBOGOEligible: true,
    bogoCategory: 'necklace',
    bogoActive: true,
    isActive: true,
    deletedAt: null,
    stockQuantity: { gt: 0 },
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }
  return withRetry(() =>
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        finalPrice: true,
        stockQuantity: true,
        averageRating: true,
        reviewCount: true,
        images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    })
  );
}

export async function getEligibleRings(search?: string) {
  const where: any = {
    isBOGOEligible: true,
    bogoCategory: 'ring',
    bogoActive: true,
    isActive: true,
    deletedAt: null,
    stockQuantity: { gt: 0 },
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  return withRetry(() =>
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        finalPrice: true,
        stockQuantity: true,
        averageRating: true,
        reviewCount: true,
        images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    })
  );
}
