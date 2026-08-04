'use client';

/**
 * ORA Premium Home Page — Luxury D2C Conversion Flow
 *
 * Architecture: Inspire → Products → Categories → Brand → Lifestyle → More → Trust → Close
 *
 * Sections:
 *  1. LuxuryHero        — Emotional above-the-fold hook
 *  2. Bestsellers       — First product grid (most loved, 8 items)
 *  3. LuxuryCategories  — 3 categories: Chains, Rings, Bracelets
 *  4. OraPhilosophy     — Brand story & philosophy
 *  5. VideoReelStrip    — The ORA Life lifestyle strip (fast loop)
 *  6. NewArrivals       — Smaller grid (4 items only)
 *  7. BOGOCampaign      — Revenue driver (Buy 1 Get 1 Free)
 *  8. LuxuryTrustStrip  — Trust icons (Gift, Returns, Shipping, Premium)
 *  9. LuxuryNewsletter  — Dark bg, minimal email capture
 * 10. StickyCartBar     — Mobile sticky bottom bar
 */

import Bestsellers from '@/components/home/Bestsellers';
import OfferBanner from '@/components/home/OfferBanner';
import CategoryQuickLinks from '@/components/home/CategoryQuickLinks';
import LuxuryCategories from '@/components/home/LuxuryCategories';
import LuxuryHero from '@/components/home/LuxuryHero';
import LuxuryNewsletter from '@/components/home/LuxuryNewsletter';
import LuxuryTrustStrip from '@/components/home/LuxuryTrustStrip';
import NewArrivals from '@/components/home/NewArrivals';
import OraPhilosophy from '@/components/home/OraPhilosophy';
import StickyCartBar from '@/components/home/StickyCartBar';
import VideoReelStrip from '@/components/home/VideoReelStrip';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      {/* 1. HERO — Emotional hook */}
      <LuxuryHero />

      {/* 2. CATEGORY QUICK-LINKS — GIVA-style horizontal scroll pills */}
      <CategoryQuickLinks />

      {/* 3. LAUNCH OFFER */}
      <OfferBanner />

      {/* 4. TRUST — Dark bar between offer and products */}
      <LuxuryTrustStrip />

      {/* 5. BESTSELLERS — First product grid */}
      <Bestsellers />

      {/* 6. CATEGORIES — Chains, Rings, Bracelets */}
      <LuxuryCategories />

      {/* 7. BRAND STORY — The ORA Philosophy */}
      <OraPhilosophy />

      {/* 8. THE ORA LIFE — Fast infinite lifestyle strip */}
      <VideoReelStrip />

      {/* 9. NEW ARRIVALS — Fresh drops */}
      <NewArrivals />

      {/* 10. NEWSLETTER — Dark bg, minimal */}
      <LuxuryNewsletter />

      {/* 11. STICKY CART BAR — Mobile only */}
      <StickyCartBar />
    </main>
  );
}
