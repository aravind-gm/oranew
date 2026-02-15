'use client';

/**
 * Shop All CMS Store — Zustand
 * Fetches and caches the Shop All page configuration from the CMS API.
 */

import { create } from 'zustand';
import api from '@/lib/api';

// ============================================================
// Types
// ============================================================

export interface HeroConfig {
  enabled: boolean;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  desktopImage: string;
  mobileImage: string;
  videoUrl: string;
  overlayOpacity: number;
}

export interface PromiseItem {
  id: string;
  icon: string;
  text: string;
  enabled: boolean;
}

export interface PromiseStripConfig {
  enabled: boolean;
  items: PromiseItem[];
}

export interface MoodItem {
  id: string;
  title: string;
  image: string;
  filterOrLink: string;
  type: 'link' | 'filter';
}

export interface MoodStripConfig {
  enabled: boolean;
  items: MoodItem[];
}

export interface PromoBanner {
  id: string;
  image: string;
  title: string;
  link: string;
  enabled: boolean;
}

export interface PromoBannersConfig {
  enabled: boolean;
  insertAfterEvery: number;
  banners: PromoBanner[];
}

export interface HighlightItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  link: string;
}

export interface HighlightedCollectionsConfig {
  enabled: boolean;
  heading: string;
  items: HighlightItem[];
}

export interface EmotionalPauseConfig {
  enabled: boolean;
  text: string;
  ctaText: string;
  ctaLink: string;
}

export interface TrustCtaConfig {
  enabled: boolean;
  items: Array<{ id: string; icon: string; text: string }>;
  ctaText: string;
  ctaLink: string;
}

export interface ProductGridConfig {
  defaultSort: string;
  productsPerPage: number;
  loadMoreStyle: 'button' | 'infinite';
}

export interface ShopAllCmsConfig {
  hero: HeroConfig;
  promiseStrip: PromiseStripConfig;
  moodStrip: MoodStripConfig;
  promoBanners: PromoBannersConfig;
  highlightedCollections: HighlightedCollectionsConfig;
  emotionalPause: EmotionalPauseConfig;
  trustCta: TrustCtaConfig;
  productGrid: ProductGridConfig;
}

interface ShopAllCmsStore {
  config: ShopAllCmsConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

// ============================================================
// Default config (mirrors backend defaults)
// ============================================================

export const DEFAULT_CMS_CONFIG: ShopAllCmsConfig = {
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
      { id: '2', icon: 'refresh', text: 'Easy 7-Day Returns' },
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

// ============================================================
// Store
// ============================================================

export const useShopAllCmsStore = create<ShopAllCmsStore>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    if (get().config) return; // Already loaded
    set({ loading: true, error: null });

    try {
      const response = await api.get('/shopall-cms');
      if (response.data?.success && response.data?.data) {
        set({ config: { ...DEFAULT_CMS_CONFIG, ...response.data.data }, loading: false });
      } else {
        set({ config: DEFAULT_CMS_CONFIG, loading: false });
      }
    } catch {
      // Fallback to defaults if CMS not available
      console.warn('[ShopAll CMS] API unavailable, using defaults');
      set({ config: DEFAULT_CMS_CONFIG, loading: false });
    }
  },
}));
