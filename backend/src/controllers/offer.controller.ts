/**
 * Offer Controller — "Buy Any Necklace, Get a Ring FREE"
 *
 * Admin:
 *   GET  /api/admin/offer/campaign          — Get campaign settings
 *   PUT  /api/admin/offer/campaign          — Update campaign settings
 *   GET  /api/admin/offer/products          — List all products with offer status
 *   PUT  /api/admin/offer/products/:id      — Set product offer eligibility
 *   GET  /api/admin/offer/stats             — Campaign statistics
 *
 * Public:
 *   GET  /api/offer/necklaces               — Eligible necklaces
 *   GET  /api/offer/rings                   — Eligible free rings
 *   POST /api/offer/validate                — Validate cart offer claim
 */

import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import {
  validateOfferCart,
  getEligibleNecklaces,
  getEligibleRings,
} from '../services/offerService';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function mapProduct(p: any) {
  return {
    ...p,
    image: p.images?.[0]?.imageUrl || null,
    images: undefined,
  };
}

// ─── ADMIN: Get Campaign ────────────────────────────────────────────────────────

export const getOfferCampaign = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let campaign = await withRetry(() =>
      prisma.bOGOCampaign.findFirst({ orderBy: { createdAt: 'desc' } })
    );

    if (!campaign) {
      campaign = await prisma.bOGOCampaign.create({
        data: {
          name: 'Buy Any Necklace — Get a Ring FREE',
          isActive: false,
          discountType: 'FREE_CHEAPER',
          discountValue: 0,
          allowedTiers: [],
          allowedCategories: ['necklace', 'ring'],
        },
      });
    }

    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: Update Campaign ────────────────────────────────────────────────────

export const updateOfferCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, isActive, startDate, endDate, maxUsesPerUser, allowedCategories } = req.body;

    let campaign = await prisma.bOGOCampaign.findFirst({ orderBy: { createdAt: 'desc' } });

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (isActive !== undefined) data.isActive = isActive;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (maxUsesPerUser !== undefined) data.maxUsesPerUser = maxUsesPerUser;
    if (allowedCategories !== undefined) data.allowedCategories = allowedCategories;

    if (!campaign) {
      campaign = await prisma.bOGOCampaign.create({
        data: {
          name: name || 'Buy Any Necklace — Get a Ring FREE',
          isActive: isActive ?? false,
          discountType: 'FREE_CHEAPER',
          discountValue: 0,
          allowedTiers: [],
          allowedCategories: allowedCategories || ['necklace', 'ring'],
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          maxUsesPerUser: maxUsesPerUser || 0,
        },
      });
    } else {
      campaign = await prisma.bOGOCampaign.update({
        where: { id: campaign.id },
        data,
      });
    }

    // Sync bogoActive on products when campaign toggled
    if (isActive === true) {
      await prisma.product.updateMany({
        where: { isBOGOEligible: true, deletedAt: null },
        data: { bogoActive: true },
      });
    }
    if (isActive === false) {
      await prisma.product.updateMany({
        where: { bogoActive: true, deletedAt: null },
        data: { bogoActive: false },
      });
    }

    res.json({ success: true, data: campaign, message: 'Campaign updated' });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: List Products ──────────────────────────────────────────────────────

export const getOfferProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      offerOnly,
      offerRole,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (offerOnly === 'true') where.isBOGOEligible = true;
    if (offerRole) where.bogoCategory = offerRole;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true, name: true, slug: true, price: true, finalPrice: true,
          isBOGOEligible: true, bogoCategory: true, bogoActive: true,
          stockQuantity: true, averageRating: true, reviewCount: true, isActive: true,
          images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: [{ isBOGOEligible: 'desc' }, { name: 'asc' }],
      }) as Promise<any[]>,
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: (products as any[]).map(mapProduct),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: Update Product Offer Status ───────────────────────────────────────

export const updateProductOffer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isEligible, offerRole } = req.body; // offerRole: "necklace" | "ring" | null

    const product = await prisma.product.findUnique({ where: { id, deletedAt: null } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const activeCampaign = await prisma.bOGOCampaign.findFirst({ where: { isActive: true } });

    const data: any = {
      isBOGOEligible: isEligible ?? product.isBOGOEligible,
    };
    if (offerRole !== undefined) data.bogoCategory = offerRole;
    if (isEligible === false) {
      data.bogoCategory = null;
      data.bogoActive = false;
    }
    if (isEligible === true) {
      data.bogoActive = !!activeCampaign;
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        finalPrice: true,
        isBOGOEligible: true,
        bogoCategory: true,
        bogoActive: true,
        stockQuantity: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: Stats ──────────────────────────────────────────────────────────────

export const getOfferStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const campaign = await prisma.bOGOCampaign.findFirst({ orderBy: { createdAt: 'desc' } });

    const [necklaces, rings] = await Promise.all([
      prisma.product.count({ where: { isBOGOEligible: true, bogoCategory: 'necklace', deletedAt: null } }),
      prisma.product.count({ where: { isBOGOEligible: true, bogoCategory: 'ring', deletedAt: null } }),
    ]);

    res.json({
      success: true,
      data: {
        campaignActive: campaign?.isActive ?? false,
        campaignName: campaign?.name ?? 'Buy Any Necklace — Get a Ring FREE',
        eligibleNecklaces: necklaces,
        eligibleRings: rings,
        totalEligible: necklaces + rings,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUBLIC: Eligible Necklaces ────────────────────────────────────────────────

export const listEligibleNecklaces = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query as { search?: string };
    const products = await getEligibleNecklaces(search);
    res.json({ success: true, data: (products as any[]).map(mapProduct) });
  } catch (err) {
    next(err);
  }
};

// ─── PUBLIC: Eligible Rings ────────────────────────────────────────────────────

export const listEligibleRings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query as { search?: string };
    const products = await getEligibleRings(search);
    res.json({ success: true, data: (products as any[]).map(mapProduct) });
  } catch (err) {
    next(err);
  }
};

// ─── PUBLIC: Validate Offer Cart ───────────────────────────────────────────────

export const validateOfferCartEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'items array required' });
      return;
    }
    const result = await validateOfferCart(items);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
