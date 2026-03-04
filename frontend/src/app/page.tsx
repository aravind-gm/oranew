'use client';

/**
 * ORA Premium Home Page — Luxury D2C Conversion Flow
 *
 * Architecture: Hero → Bestsellers → Duos → Categories → Philosophy → New Arrivals → Trust → Newsletter
 *
 * Performance: Hero priority-loaded, all else lazy, skeleton loaders
 * Mobile: 2-col grids, larger touch targets
 */

import HomeHero from '@/components/home/HomeHero';
import CuratedProducts from '@/components/home/CuratedProducts';
import CuratedDuos from '@/components/home/CuratedDuos';
import ShopByCategory from '@/components/home/ShopByCategory';
import OraPhilosophy from '@/components/home/OraPhilosophy';
import TrustStrip from '@/components/home/TrustStrip';
import Newsletter from '@/components/home/Newsletter';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen overflow-x-hidden">
      {/* 1. HERO — Emotional brand-first hook */}
      <HomeHero />

      {/* 2. BESTSELLERS — First product grid customers see */}
      <CuratedProducts
        heading="Bestsellers"
        subheading="Our most loved pieces — chosen by women like you."
        collectionSlug="featured"
        limit={8}
        ctaLabel="View All"
        ctaHref="/collections/featured"
      />

      {/* 3. CURATED DUOS — Subtle combos section */}
      <CuratedDuos />

      {/* 4. SHOP BY CATEGORY — 4 clean category cards */}
      <ShopByCategory />

      {/* 5. THE ORA PHILOSOPHY — Brand storytelling */}
      <OraPhilosophy />

      {/* 6. NEW ARRIVALS — Smaller grid, latest pieces */}
      <CuratedProducts
        heading="New Arrivals"
        subheading="Fresh additions to the ORA collection."
        collectionSlug="new-arrivals"
        limit={4}
        ctaLabel="See What's New"
        ctaHref="/collections/new-arrivals"
      />

      {/* 7. TRUST STRIP — Delivery, returns, secure, craftsmanship */}
      <TrustStrip />

      {/* 8. NEWSLETTER — Email capture */}
      <Newsletter />
    </main>
  );
}
