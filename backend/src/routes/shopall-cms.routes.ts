/**
 * Shop All Page CMS Routes
 * Admin-controlled content management for the Shop All / All Jewellery page
 * 
 * Endpoints:
 *   GET  /api/shopall-cms          — Public: Get active page config
 *   GET  /api/shopall-cms/admin    — Admin: Get full config with inactive sections
 *   PUT  /api/shopall-cms          — Admin: Update full page config
 *   PUT  /api/shopall-cms/:section — Admin: Update a single section
 * 
 * @author ORA Engineering
 */

import { Router, Response, NextFunction } from 'express';
import { authorize, protect, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import fs from 'fs';
import path from 'path';

const router = Router();

// ============================================================
// Default Shop All page config (used as seed / fallback)
// ============================================================

const DEFAULT_CONFIG = {
  hero: {
    enabled: true,
    heading: 'All Jewellery',
    subheading: 'Timeless pieces crafted for her everyday moments.',
    ctaText: 'Explore Collection',
    ctaLink: '#products',
    desktopImage: '',
    mobileImage: '',
    videoUrl: '',
    overlayOpacity: 0.3,
  },
  promiseStrip: {
    enabled: true,
    items: [
      { id: '1', icon: 'gift', text: 'Gift Wrapped with Love', enabled: true },
      { id: '2', icon: 'truck', text: 'Fast Delivery', enabled: true },
      { id: '3', icon: 'refresh', text: 'Easy Returns', enabled: true },
      { id: '4', icon: 'heart', text: 'Loved by Women', enabled: true },
    ],
  },
  moodStrip: {
    enabled: true,
    items: [
      { id: '1', title: 'Everyday Elegance', image: '', filterOrLink: '/collections?availability=in-stock', type: 'link' },
      { id: '2', title: 'Date Night Glow', image: '', filterOrLink: '/collections?category=earrings', type: 'link' },
      { id: '3', title: 'Minimal Chic', image: '', filterOrLink: '/collections?maxPrice=1099', type: 'link' },
      { id: '4', title: 'Statement Love', image: '', filterOrLink: '/collections?category=necklaces', type: 'link' },
    ],
  },
  promoBanners: {
    enabled: true,
    insertAfterEvery: 8,
    banners: [
      { id: '1', image: '', title: 'Best Sellers Loved by Women', link: '/collections?availability=bestseller', enabled: true },
      { id: '2', image: '', title: 'Under ₹1,099 — Thoughtful Gifts', link: '/collections?maxPrice=1099', enabled: true },
    ],
  },
  highlightedCollections: {
    enabled: true,
    heading: 'Shop by Category',
    items: [
      { id: '1', title: 'Earrings', subtitle: 'Elegant everyday sparkle', image: '', ctaText: 'Explore', link: '/collections/earrings' },
      { id: '2', title: 'Necklaces', subtitle: 'Grace around your neck', image: '', ctaText: 'Explore', link: '/collections/necklaces' },
      { id: '3', title: 'Rings', subtitle: 'Rings that speak for you', image: '', ctaText: 'Explore', link: '/collections/rings' },
      { id: '4', title: 'Bracelets', subtitle: 'Wrist candy for every mood', image: '', ctaText: 'Explore', link: '/collections/bracelets' },
    ],
  },
  emotionalPause: {
    enabled: true,
    text: "Jewellery isn't just worn — it's felt.",
    ctaText: 'Continue Exploring',
    ctaLink: '#products',
  },
  trustCta: {
    enabled: true,
    items: [
      { id: '1', icon: 'gift', text: 'Gift Wrap Included' },
      { id: '2', icon: 'refresh', text: 'Easy 5-Day Returns' },
      { id: '3', icon: 'shield', text: 'Quality Guaranteed' },
    ],
    ctaText: 'View All Jewellery',
    ctaLink: '/collections',
  },
  productGrid: {
    defaultSort: 'popularity',
    productsPerPage: 24,
    loadMoreStyle: 'button',
  },
};

// Config storage path
const CONFIG_PATH = path.join(__dirname, '../../data/shopall-config.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read config from file (fallback to defaults)
function readConfig(): typeof DEFAULT_CONFIG {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('[ShopAll CMS] Error reading config:', error);
  }
  return { ...DEFAULT_CONFIG };
}

// Write config to file
function writeConfig(config: typeof DEFAULT_CONFIG) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[ShopAll CMS] Error writing config:', error);
    return false;
  }
}

// ============================================================
// PUBLIC: Get active Shop All page config
// ============================================================

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const config = readConfig();

    // Also fetch banners from Banner model for the shop-all page
    let banners: any[] = [];
    try {
      banners = await prisma.banner.findMany({
        where: {
          page: 'shop-all',
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
      });
    } catch {
      // Banner table might not have shop-all entries yet
    }

    res.json({
      success: true,
      data: {
        ...config,
        // Merge any DB banners into hero section if they exist
        _banners: banners,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN: Get full config (including disabled sections)
// ============================================================

router.get(
  '/admin',
  protect,
  authorize('ADMIN'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const config = readConfig();
      res.json({
        success: true,
        data: config,
        defaults: DEFAULT_CONFIG,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Update full page config
// ============================================================

router.put(
  '/',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const currentConfig = readConfig();
      const updatedConfig = { ...currentConfig, ...req.body };
      
      const success = writeConfig(updatedConfig);
      if (!success) {
        return res.status(500).json({ success: false, message: 'Failed to save config' });
      }

      res.json({
        success: true,
        message: 'Shop All page config updated',
        data: updatedConfig,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMIN: Update a single section
// ============================================================

router.put(
  '/:section',
  protect,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { section } = req.params;
      const config = readConfig();

      if (!(section in config)) {
        return res.status(400).json({
          success: false,
          message: `Invalid section: ${section}. Valid sections: ${Object.keys(config).join(', ')}`,
        });
      }

      (config as any)[section] = { ...(config as any)[section], ...req.body };

      const success = writeConfig(config);
      if (!success) {
        return res.status(500).json({ success: false, message: 'Failed to save config' });
      }

      res.json({
        success: true,
        message: `Section "${section}" updated`,
        data: (config as any)[section],
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
