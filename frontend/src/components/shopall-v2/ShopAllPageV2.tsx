'use client';

/**
 * Shop All / All Jewellery — /collections
 * 
 * ═══════════════════════════════════════════════════════
 *   COMPLETE PREMIUM REDESIGN v2.0 — ORA Jewellery
 * ═══════════════════════════════════════════════════════
 * 
 * A luxury, emotionally-driven, high-converting e-commerce
 * browsing experience inspired by GIVA, Mejuri, Swarovski,
 * Cartier, and Nykaa Fashion.
 * 
 * Architecture:
 *   ShopAllPage
 *   ├── LuxuryHeroSection      — Full-width immersive hero
 *   ├── LuxuryTrustStrip       — Trust icons with gold accents
 *   ├── MoodCarousel           — Emotion-based filtering
 *   ├── LuxuryProductGrid      — Premium grid + filter sidebar
 *   │     ├── LuxuryProductCard  — Hover image swap + badges
 *   │     ├── LuxuryPromoBanner  — Mid-grid promotional banners
 *   │     ├── DesktopFilterSidebar
 *   │     └── MobileFilterDrawer
 *   ├── LuxuryHighlightedCollections — Category grid
 *   ├── LuxuryEmotionalPause   — Quote / breathing section
 *   ├── NewsletterCTA          — Email signup
 *   └── LuxuryTrustCta         — Final trust + CTA
 * 
 * All sections are admin-controllable via the CMS API.
 * Uses Zustand for state, URL sync for filters,
 * lazy loading, intersection observer, and skeleton loaders.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useShopAllCmsStore, DEFAULT_CMS_CONFIG, MoodItem } from '@/store/shopAllCmsStore';

import LuxuryHeroSection from '@/components/shopall-v2/LuxuryHeroSection';
import LuxuryTrustStrip from '@/components/shopall-v2/LuxuryTrustStrip';
import MoodCarousel from '@/components/shopall-v2/MoodCarousel';
import LuxuryProductGrid from '@/components/shopall-v2/LuxuryProductGrid';
import LuxuryHighlightedCollections from '@/components/shopall-v2/LuxuryHighlightedCollections';
import LuxuryEmotionalPause from '@/components/shopall-v2/LuxuryEmotionalPause';
import LuxuryTrustCta from '@/components/shopall-v2/LuxuryTrustCta';
import NewsletterCTA from '@/components/shopall-v2/NewsletterCTA';

// ============================================================================
// Main Content
// ============================================================================

function ShopAllContent() {
  const { config, fetchConfig } = useShopAllCmsStore();
  const [activeMood, setActiveMood] = useState<MoodItem | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const cms = config || DEFAULT_CMS_CONFIG;

  const handleMoodSelect = useCallback((mood: MoodItem) => {
    setActiveMood((prev) => (prev?.id === mood.id ? null : mood));
    // Scroll to product grid
    setTimeout(() => {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleClearMood = useCallback(() => {
    setActiveMood(null);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 1️⃣ FULL WIDTH HERO SECTION */}
      <LuxuryHeroSection config={cms.hero} />

      {/* 2️⃣ TRUST STRIP (Luxury Icon Bar) */}
      <LuxuryTrustStrip config={cms.promiseStrip} />

      {/* 3️⃣ SHOP BY MOOD (Emotion-Based Filtering) */}
      <MoodCarousel
        config={cms.moodStrip}
        onMoodSelect={handleMoodSelect}
        activeMood={activeMood?.id || null}
      />

      {/* 4️⃣ FILTER + SORT + PRODUCT GRID (Core Section) */}
      <LuxuryProductGrid
        defaultSort={cms.productGrid.defaultSort}
        productsPerPage={cms.productGrid.productsPerPage}
        loadMoreStyle={cms.productGrid.loadMoreStyle}
        promoBanners={cms.promoBanners}
        activeMood={activeMood}
        onClearMood={handleClearMood}
      />

      {/* 5️⃣ HIGHLIGHTED COLLECTIONS */}
      <LuxuryHighlightedCollections config={cms.highlightedCollections} />

      {/* 6️⃣ EMOTIONAL PAUSE */}
      <LuxuryEmotionalPause config={cms.emotionalPause} />

      {/* 7️⃣ NEWSLETTER CTA */}
      <NewsletterCTA />

      {/* 8️⃣ FINAL TRUST + CTA */}
      <LuxuryTrustCta config={cms.trustCta} />
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function ShopAllLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <div className="w-full min-h-[75vh] md:min-h-[85vh] bg-gradient-to-br from-[#FFF5F7] via-[#FFE8EF] to-[#FDD8E4] animate-pulse flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="w-5 h-5 bg-[#D4AF37]/20 rounded-full mx-auto" />
          <div className="w-20 h-[1px] bg-[#D4AF37]/20 mx-auto" />
          <div className="h-12 w-72 bg-white/30 rounded-lg mx-auto" />
          <div className="h-5 w-56 bg-white/20 rounded mx-auto" />
          <div className="flex gap-4 justify-center mt-6">
            <div className="h-12 w-44 bg-white/30 rounded-full" />
            <div className="h-12 w-36 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Trust strip skeleton */}
      <div className="py-5 bg-gradient-to-r from-[#FFFBFD] via-[#FFF7FA] to-[#FFFBFD] border-y border-[#F3E8ED]">
        <div className="max-w-[1440px] mx-auto px-5 flex justify-center gap-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-[18px] h-[18px] bg-[#D4AF37]/15 rounded-full animate-pulse" />
              <div className="w-28 h-3 bg-neutral-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Mood carousel skeleton */}
      <div className="py-12 bg-white">
        <div className="max-w-[1440px] mx-auto px-5">
          <div className="text-center mb-10">
            <div className="w-24 h-2.5 bg-[#D4AF37]/15 rounded-full mx-auto mb-3" />
            <div className="w-40 h-8 bg-neutral-100 rounded-lg mx-auto" />
          </div>
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[260px] aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="w-full px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-xl mb-3.5" />
              <div className="space-y-2.5">
                <div className="h-3 bg-neutral-100 rounded-full w-[85%]" />
                <div className="h-2.5 bg-neutral-100 rounded-full w-[50%]" />
                <div className="h-3.5 bg-neutral-100 rounded-full w-[40%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page Export
// ============================================================================

export default function ShopAllPage() {
  return (
    <Suspense fallback={<ShopAllLoadingSkeleton />}>
      <ShopAllContent />
    </Suspense>
  );
}
