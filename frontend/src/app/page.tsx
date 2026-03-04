'use client';

/**
 * ORA Premium Home Page — Luxury D2C Conversion Flow
 *
 * Architecture: Inspire → Bestsellers → Campaign → Categories → Trust → Close
 *
 * Sections:
 *  1. LuxuryHero        — Emotional above-the-fold hook
 *  2. Bestsellers       — First product grid (most loved, 8 items)
 *  3. BOGOCampaign      — Revenue driver (Buy 1 Get 1 Free)
 *  4. LuxuryCategories  — 4 clean category cards (no clutter)
 *  5. SocialProof       — Why Women Love ORA (testimonials + 4.8★)
 *  6. NewArrivals       — Smaller grid (4 items only)
 *  7. LuxuryTrustStrip  — Trust icons (Gift, Returns, Shipping, Premium)
 *  8. LuxuryNewsletter  — Dark bg, minimal email capture
 *  9. StickyCartBar     — Mobile sticky bottom bar
 *
 * Removed:
 *  - BrandManifesto, GiftByPriceHearts, SeasonalCombos, VideoReelStrip
 *  - InfiniteProductCarousel, FinalCTA (clutter / scroll-heavy)
 *  - Duplicate grids, repeated sections, red discount badges
 *
 * Performance: Hero priority-loaded, all else lazy, skeleton loaders
 * Mobile: 2-col grids, sticky cart bar, larger touch targets
 */

import Bestsellers from '@/components/home/Bestsellers';
import BOGOCampaign from '@/components/home/BOGOCampaign';
import LuxuryCategories from '@/components/home/LuxuryCategories';
import LuxuryHero from '@/components/home/LuxuryHero';
import LuxuryNewsletter from '@/components/home/LuxuryNewsletter';
import LuxuryTrustStrip from '@/components/home/LuxuryTrustStrip';
import NewArrivals from '@/components/home/NewArrivals';
import StickyCartBar from '@/components/home/StickyCartBar';
import VideoReelStrip from '@/components/home/VideoReelStrip';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen overflow-x-hidden">
      {/* 1. LUXURY HERO — Emotional hook */}
      <LuxuryHero />

      {/* 2. BESTSELLERS — First product grid customers see */}
      <Bestsellers />

      {/* 3. BOGO CAMPAIGN — Revenue driver, above categories */}
      <BOGOCampaign />

      {/* 4. SHOP BY CATEGORY — 4 clean categories only */}
      <LuxuryCategories />

      {/* 5.5. THE ORA LIFE — Infinite liquid scroll lifestyle strip */}
      <VideoReelStrip />

      {/* 6. NEW ARRIVALS — Smaller grid, limited */}
      <NewArrivals />

      {/* 7. TRUST STRIP — Clean icons, white bg */}
      <LuxuryTrustStrip />

      {/* 8. NEWSLETTER — Dark bg, minimal */}
      <LuxuryNewsletter />

      {/* 9. STICKY CART BAR — Mobile only */}
      <StickyCartBar />
    </main>
  );
}
