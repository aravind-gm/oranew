'use client';

/**
 * ORA Premium Home Page — Luxury D2C Conversion Flow
 *
 * Optimised Section Order:
 *  1. LuxuryHero          — Campaign banner first, then brand slides
 *  2. CategoryQuickLinks  — Compact pill shortcuts for fast discovery
 *  3. LuxuryCategories    — Compact 3-column category grid
 *  4. OfferBanner         — Compact offer details strip (supports the hero campaign)
 *  5. LuxuryTrustStrip    — Trust icons (Gift, Returns, Shipping, Premium)
 *  6. Bestsellers         — First product grid (most loved)
 *  7. OraPhilosophy       — Brand story & philosophy
 *  8. VideoReelStrip      — The ORA Life lifestyle strip
 *  9. NewArrivals         — Fresh drops
 * 10. LuxuryNewsletter    — Dark bg, minimal email capture
 * 11. StickyCartBar       — Mobile sticky bottom bar
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
      {/* 1. HERO — Campaign banner as first slide, then brand slides */}
      <LuxuryHero />

      {/* 2. CATEGORY QUICK-LINKS — Compact pill shortcuts */}
      <CategoryQuickLinks />

      {/* 3. CATEGORIES — Compact 3-column grid: Necklaces, Rings, Bracelets */}
      <LuxuryCategories />

      {/* 4. LAUNCH OFFER — Compact strip with offer details */}
      <OfferBanner />

      {/* 5. TRUST — Dark bar */}
      <LuxuryTrustStrip />

      {/* 6. BESTSELLERS — First product grid */}
      <Bestsellers />

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
