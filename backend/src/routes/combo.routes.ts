/**
 * Combo Products Routes — "Combos for Her" BOGO Bundle System
 * 
 * Public endpoints:
 *   GET  /api/combos              — List active combos (with filters)
 *   GET  /api/combos/:slug        — Get single combo by slug
 *   GET  /api/combos/stats        — Get combo stats (sold count, etc.)
 * 
 * Admin endpoints:
 *   GET  /api/combos/admin/all    — List all combos (including inactive)
 *   POST /api/combos/admin        — Create combo
 *   PUT  /api/combos/admin/:id    — Update combo
 *   DELETE /api/combos/admin/:id  — Delete combo
 * 
 * CMS endpoints:
 *   GET  /api/combos/cms          — Get combos page CMS config (public)
 *   GET  /api/combos/cms/admin    — Get full CMS config (admin)
 *   PUT  /api/combos/cms          — Update CMS config (admin)
 *   PUT  /api/combos/cms/:section — Update single CMS section (admin)
 */

import { Router, Response, NextFunction } from 'express';
import { authorize, protect, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import fs from 'fs';
import path from 'path';

const router = Router();

// ============================================================
// CMS CONFIG — File-based (same pattern as shopall-cms)
// ============================================================

const DEFAULT_CMS_CONFIG = {
  hero: {
    enabled: true,
    heading: 'Buy 1. Get 1 Free. Because She Deserves More.',
    subheading: 'Curated jewellery combos crafted for gifting, celebrating, and glowing.',
    ctaPrimary: 'Shop Combos',
    ctaPrimaryLink: '#combos',
    ctaSecondary: 'View Best Sellers',
    ctaSecondaryLink: '/collections',
    backgroundImage: '',
    mobileBackgroundImage: '',
    enableCountdown: false,
    countdownEndDate: '',
    overlayOpacity: 0.35,
  },
  valueStrip: {
    enabled: true,
    items: [
      { id: '1', icon: 'gift', text: 'Gift Ready Packaging', enabled: true },
      { id: '2', icon: 'gem', text: '2 Pieces. 1 Price.', enabled: true },
      { id: '3', icon: 'refresh', text: 'Easy Returns', enabled: true },
      { id: '4', icon: 'truck', text: 'Free Shipping', enabled: true },
    ],
  },
  howItWorks: {
    enabled: true,
    heading: 'How It Works',
    steps: [
      { id: '1', number: '1', title: 'Pick Your Combo', description: 'Choose from curated jewellery pairs' },
      { id: '2', number: '2', title: 'Add to Bag', description: 'One click, both pieces added' },
      { id: '3', number: '3', title: 'Get 2 Pieces at 1 Price', description: 'Pay for one, get both delivered' },
    ],
  },
  urgencyBar: {
    enabled: true,
    soldThisWeek: 312,
    leftAtPrice: 18,
    customMessage: '',
  },
  filters: {
    enabled: true,
    categories: [
      { id: '1', label: 'All Combos', value: 'all', enabled: true },
      { id: '2', label: 'Under ₹1999', value: 'under-1999', enabled: true },
      { id: '3', label: 'Under ₹2999', value: 'under-2999', enabled: true },
      { id: '4', label: 'Premium', value: 'premium', enabled: true },
      { id: '5', label: 'Gift for Girlfriend', value: 'gift-girlfriend', enabled: true },
      { id: '6', label: 'Gift for Wife', value: 'gift-wife', enabled: true },
      { id: '7', label: 'Anniversary', value: 'anniversary', enabled: true },
      { id: '8', label: 'Birthday', value: 'birthday', enabled: true },
    ],
  },
  testimonials: {
    enabled: true,
    heading: 'Loved by Women',
    items: [
      { id: '1', name: 'Priya S.', text: 'The combo was perfect for my sister\'s birthday. She loved both pieces!', rating: 5, verified: true },
      { id: '2', name: 'Anita R.', text: 'Amazing value — two beautiful pieces for the price of one. Gift wrapping was lovely.', rating: 5, verified: true },
      { id: '3', name: 'Meera K.', text: 'Bought this as an anniversary gift. My wife was thrilled!', rating: 4, verified: true },
    ],
  },
  newsletter: {
    enabled: true,
    heading: 'Get Exclusive Combo Deals',
    subheading: 'Be the first to know about new BOGO offers & limited edition combos.',
    placeholder: 'Enter your email',
    ctaText: 'Subscribe',
  },
};

const CMS_CONFIG_PATH = path.join(__dirname, '../../data/combos-cms-config.json');

function ensureDataDir() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readCmsConfig(): typeof DEFAULT_CMS_CONFIG {
  try {
    ensureDataDir();
    if (fs.existsSync(CMS_CONFIG_PATH)) {
      const data = fs.readFileSync(CMS_CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CMS_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('[Combos CMS] Error reading config:', error);
  }
  return { ...DEFAULT_CMS_CONFIG };
}

function writeCmsConfig(config: typeof DEFAULT_CMS_CONFIG) {
  try {
    ensureDataDir();
    fs.writeFileSync(CMS_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Combos CMS] Error writing config:', error);
    return false;
  }
}

// ============================================================
// PUBLIC: Get combos page CMS config
// ============================================================

router.get('/cms', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const config = readCmsConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN: Get full CMS config
// ============================================================

router.get(
  '/cms/admin',
  protect,
  authorize('ADMIN'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const config = readCmsConfig();
      res.json({ success: true, data: config, defaults: DEFAULT_CMS_CONFIG });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Update full CMS config
// ============================================================

router.put(
  '/cms',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const currentConfig = readCmsConfig();
      const updatedConfig = { ...currentConfig, ...req.body };
      const success = writeCmsConfig(updatedConfig);
      if (!success) {
        return res.status(500).json({ success: false, message: 'Failed to save config' });
      }
      res.json({ success: true, message: 'Combos page config updated', data: updatedConfig });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Update a single CMS section
// ============================================================

router.put(
  '/cms/:section',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { section } = req.params;
      const config = readCmsConfig();
      if (!(section in config)) {
        return res.status(400).json({
          success: false,
          message: `Invalid section: ${section}. Valid: ${Object.keys(config).join(', ')}`,
        });
      }
      (config as any)[section] = { ...(config as any)[section], ...req.body };
      const success = writeCmsConfig(config);
      if (!success) {
        return res.status(500).json({ success: false, message: 'Failed to save config' });
      }
      res.json({ success: true, message: `Section "${section}" updated`, data: (config as any)[section] });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// PUBLIC: Get combo stats
// ============================================================

const MOCK_COMBOS = [
  { id: '1', soldCount: 128 },
  { id: '2', soldCount: 95 },
  { id: '3', soldCount: 74 },
  { id: '4', soldCount: 63 },
  { id: '5', soldCount: 51 },
];

router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalSold = MOCK_COMBOS.reduce((sum, c) => sum + c.soldCount, 0);
    const totalCombos = MOCK_COMBOS.length;

    res.json({
      success: true,
      data: {
        totalSold,
        totalCombos,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// MOCK DATA — BOGO-Eligible Products (Dynamic Selection)
// ============================================================

const MOCK_BOGO_PRODUCTS = [
  // ₹999 Tier
  {
    id: 'prod-1',
    name: 'Pearl Drop Earrings',
    slug: 'pearl-drop-earrings',
    price: 999,
    finalPrice: 999,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'earrings',
    bogoPriceTier: 999,
    bogoActive: true,
    stockQuantity: 45,
    averageRating: 4.6,
    reviewCount: 34,
  },
  {
    id: 'prod-2',
    name: 'Minimalist Gold Ring',
    slug: 'minimalist-gold-ring',
    price: 999,
    finalPrice: 999,
    image: 'https://images.unsplash.com/photo-1515627243451-f7ed1cf1e6ce?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    isBOGOEligible: true,
    bogoCategory: 'rings',
    bogoPriceTier: 999,
    bogoActive: true,
    stockQuantity: 67,
    averageRating: 4.7,
    reviewCount: 28,
  },
  {
    id: 'prod-3',
    name: 'Delicate Chain Bracelet',
    slug: 'delicate-chain-bracelet',
    price: 999,
    finalPrice: 999,
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    isBOGOEligible: true,
    bogoCategory: 'bracelets',
    bogoPriceTier: 999,
    bogoActive: true,
    stockQuantity: 52,
    averageRating: 4.5,
    reviewCount: 41,
  },

  // ₹1499 Tier
  {
    id: 'prod-4',
    name: 'Rose Gold Hoops',
    slug: 'rose-gold-hoops',
    price: 1499,
    finalPrice: 1499,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'earrings',
    bogoPriceTier: 1499,
    bogoActive: true,
    stockQuantity: 38,
    averageRating: 4.9,
    reviewCount: 89,
  },
  {
    id: 'prod-5',
    name: 'Vintage Charm Locket',
    slug: 'vintage-charm-locket',
    price: 1499,
    finalPrice: 1499,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'necklaces',
    bogoPriceTier: 1499,
    bogoActive: true,
    stockQuantity: 41,
    averageRating: 4.8,
    reviewCount: 67,
  },
  {
    id: 'prod-6',
    name: 'Twisted Band Ring',
    slug: 'twisted-band-ring',
    price: 1499,
    finalPrice: 1499,
    image: 'https://images.unsplash.com/photo-1515627243451-f7ed1cf1e6ce?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    isBOGOEligible: true,
    bogoCategory: 'rings',
    bogoPriceTier: 1499,
    bogoActive: true,
    stockQuantity: 29,
    averageRating: 4.7,
    reviewCount: 52,
  },

  // ₹1999 Tier
  {
    id: 'prod-7',
    name: 'Golden Glow Necklace',
    slug: 'golden-glow-necklace',
    price: 1999,
    finalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'necklaces',
    bogoPriceTier: 1999,
    bogoActive: true,
    stockQuantity: 33,
    averageRating: 4.8,
    reviewCount: 124,
  },
  {
    id: 'prod-8',
    name: 'Statement Drop Earrings',
    slug: 'statement-drop-earrings',
    price: 1999,
    finalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'earrings',
    bogoPriceTier: 1999,
    bogoActive: true,
    stockQuantity: 28,
    averageRating: 4.9,
    reviewCount: 112,
  },
  {
    id: 'prod-9',
    name: 'Layered Chain Bracelet',
    slug: 'layered-chain-bracelet',
    price: 1999,
    finalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    isBOGOEligible: true,
    bogoCategory: 'bracelets',
    bogoPriceTier: 1999,
    bogoActive: true,
    stockQuantity: 22,
    averageRating: 4.8,
    reviewCount: 76,
  },

  // ₹2599 Tier
  {
    id: 'prod-10',
    name: 'Eternal Diamond Pendant',
    slug: 'eternal-diamond-pendant',
    price: 2599,
    finalPrice: 2599,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'necklaces',
    bogoPriceTier: 2599,
    bogoActive: true,
    stockQuantity: 18,
    averageRating: 4.7,
    reviewCount: 56,
  },
  {
    id: 'prod-11',
    name: 'Celestial Star Studs',
    slug: 'celestial-star-studs',
    price: 2599,
    finalPrice: 2599,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1632521554802-5b2629ef1c91?w=400',
    isBOGOEligible: true,
    bogoCategory: 'earrings',
    bogoPriceTier: 2599,
    bogoActive: true,
    stockQuantity: 15,
    averageRating: 4.9,
    reviewCount: 89,
  },
  {
    id: 'prod-12',
    name: 'Luxury Tennis Bracelet',
    slug: 'luxury-tennis-bracelet',
    price: 2599,
    finalPrice: 2599,
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
    hoverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    isBOGOEligible: true,
    bogoCategory: 'bracelets',
    bogoPriceTier: 2599,
    bogoActive: true,
    stockQuantity: 12,
    averageRating: 4.8,
    reviewCount: 43,
  },
];

// ============================================================
// PUBLIC: List BOGO-eligible products
// ============================================================

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tier, category } = req.query as Record<string, string>;

    let data = [...MOCK_BOGO_PRODUCTS];

    // Filter by price tier
    if (tier) {
      const tierNum = parseInt(tier);
      data = data.filter((p) => p.bogoPriceTier === tierNum);
    }

    // Filter by category
    if (category && category !== 'all') {
      data = data.filter((p) => p.bogoCategory === category);
    }

    res.json({
      success: true,
      data,
      campaign: {
        active: true,
        discountType: 'FREE_CHEAPER',
        discountValue: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUBLIC: Get single combo by slug
// ============================================================

router.get('/:slug', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    // Skip CMS/admin/stats routes
    if (['cms', 'admin', 'stats'].includes(slug)) return next();

    const combo = await prisma.comboProduct.findUnique({
      where: { slug },
      include: {
        primaryProduct: {
          include: { images: { orderBy: { sortOrder: 'asc' } } },
        },
        freeProduct: {
          include: { images: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    if (!combo || !combo.isActive) {
      return res.status(404).json({ success: false, message: 'Combo not found' });
    }

    res.json({
      success: true,
      data: {
        id: combo.id,
        title: combo.title,
        slug: combo.slug,
        description: combo.description,
        comboPrice: Number(combo.comboPrice),
        originalTotal: Number(combo.originalTotal),
        savingsAmount: Number(combo.savingsAmount),
        discountPercent: Number(combo.discountPercent),
        badge: combo.badge,
        tag: combo.tag,
        includes: combo.includes,
        averageRating: Number(combo.averageRating),
        reviewCount: combo.reviewCount,
        stockQuantity: combo.stockQuantity,
        soldCount: combo.soldCount,
        isLimited: combo.isLimited,
        images: {
          primary: combo.primaryImage || combo.primaryProduct.images[0]?.imageUrl || '',
          free: combo.freeImage || combo.freeProduct.images[0]?.imageUrl || '',
          hover: combo.hoverImage || '',
        },
        primaryProduct: {
          id: combo.primaryProduct.id,
          name: combo.primaryProduct.name,
          slug: combo.primaryProduct.slug,
          price: Number(combo.primaryProduct.finalPrice),
          images: combo.primaryProduct.images,
        },
        freeProduct: {
          id: combo.freeProduct.id,
          name: combo.freeProduct.name,
          slug: combo.freeProduct.slug,
          price: Number(combo.freeProduct.finalPrice),
          images: combo.freeProduct.images,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN: List all combos (including inactive)
// ============================================================

router.get(
  '/admin/all',
  protect,
  authorize('ADMIN', 'STAFF'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const combos = await prisma.comboProduct.findMany({
        include: {
          primaryProduct: {
            select: { id: true, name: true, slug: true, finalPrice: true },
          },
          freeProduct: {
            select: { id: true, name: true, slug: true, finalPrice: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      res.json({
        success: true,
        data: combos.map((c) => ({
          ...c,
          comboPrice: Number(c.comboPrice),
          originalTotal: Number(c.originalTotal),
          savingsAmount: Number(c.savingsAmount),
          discountPercent: Number(c.discountPercent),
          averageRating: Number(c.averageRating),
          primaryProduct: {
            ...c.primaryProduct,
            finalPrice: Number(c.primaryProduct.finalPrice),
          },
          freeProduct: {
            ...c.freeProduct,
            finalPrice: Number(c.freeProduct.finalPrice),
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Create combo
// ============================================================

router.post(
  '/admin',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        slug,
        description,
        comboPrice,
        primaryProductId,
        freeProductId,
        primaryImage,
        freeImage,
        hoverImage,
        badge,
        tag,
        includes,
        stockQuantity,
        isLimited,
        sortOrder,
      } = req.body;

      // Validate products exist
      const [primary, free] = await Promise.all([
        prisma.product.findUnique({ where: { id: primaryProductId }, select: { finalPrice: true } }),
        prisma.product.findUnique({ where: { id: freeProductId }, select: { finalPrice: true } }),
      ]);

      if (!primary || !free) {
        return res.status(400).json({ success: false, message: 'One or both products not found' });
      }

      const originalTotal = Number(primary.finalPrice) + Number(free.finalPrice);
      const savingsAmount = originalTotal - Number(comboPrice);
      const discountPercent = (savingsAmount / originalTotal) * 100;

      const combo = await prisma.comboProduct.create({
        data: {
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          description,
          comboPrice: Number(comboPrice),
          originalTotal,
          savingsAmount,
          discountPercent,
          primaryProductId,
          freeProductId,
          primaryImage,
          freeImage,
          hoverImage,
          badge,
          tag,
          includes: includes || [],
          stockQuantity: stockQuantity || 0,
          isLimited: isLimited || false,
          sortOrder: sortOrder || 0,
        },
        include: {
          primaryProduct: { select: { id: true, name: true, slug: true, finalPrice: true } },
          freeProduct: { select: { id: true, name: true, slug: true, finalPrice: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Combo created successfully',
        data: {
          ...combo,
          comboPrice: Number(combo.comboPrice),
          originalTotal: Number(combo.originalTotal),
          savingsAmount: Number(combo.savingsAmount),
          discountPercent: Number(combo.discountPercent),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'A combo with this slug already exists' });
      }
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Update combo
// ============================================================

router.put(
  '/admin/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If price or products changed, recalculate savings
      if (updates.comboPrice || updates.primaryProductId || updates.freeProductId) {
        const existing = await prisma.comboProduct.findUnique({ where: { id } });
        if (!existing) {
          return res.status(404).json({ success: false, message: 'Combo not found' });
        }

        const primaryId = updates.primaryProductId || existing.primaryProductId;
        const freeId = updates.freeProductId || existing.freeProductId;
        const price = updates.comboPrice || Number(existing.comboPrice);

        const [primary, free] = await Promise.all([
          prisma.product.findUnique({ where: { id: primaryId }, select: { finalPrice: true } }),
          prisma.product.findUnique({ where: { id: freeId }, select: { finalPrice: true } }),
        ]);

        if (primary && free) {
          const originalTotal = Number(primary.finalPrice) + Number(free.finalPrice);
          updates.originalTotal = originalTotal;
          updates.savingsAmount = originalTotal - Number(price);
          updates.discountPercent = (updates.savingsAmount / originalTotal) * 100;
        }
      }

      const combo = await prisma.comboProduct.update({
        where: { id },
        data: updates,
        include: {
          primaryProduct: { select: { id: true, name: true, slug: true, finalPrice: true } },
          freeProduct: { select: { id: true, name: true, slug: true, finalPrice: true } },
        },
      });

      res.json({
        success: true,
        message: 'Combo updated',
        data: {
          ...combo,
          comboPrice: Number(combo.comboPrice),
          originalTotal: Number(combo.originalTotal),
          savingsAmount: Number(combo.savingsAmount),
          discountPercent: Number(combo.discountPercent),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Delete combo
// ============================================================

router.delete(
  '/admin/:id',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.comboProduct.delete({ where: { id } });
      res.json({ success: true, message: 'Combo deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
