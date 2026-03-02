'use client';

/**
 * ORA Homepage — Premium Luxury Jewellery
 * 
 * Structure (luxury brand homepage):
 * 1. HERO — Brand first, not offer first
 * 2. BRAND STATEMENT — Centered elegant typography
 * 3. FEATURED STYLES — Primary selling section (no "Best Seller" / "Trending")
 * 4. SHOP BY CATEGORY — Minimal layout (Rings, Necklaces, Earrings, Bracelets)
 * 5. NEW ARRIVALS — No hype language
 * 6. CURATED ORA DUOS — Subtle combos section (not promotional)
 * 7. THE ORA PHILOSOPHY — Brand depth & emotional storytelling
 * 8. TRUST STRIP — 4 minimal icons
 * 9. NEWSLETTER — Luxury tone ("Join the ORA Circle")
 * 
 * Brand: ORA — Own. Radiate. Adorn.
 * Voice: Minimal. Honest. Premium. Contemporary.
 * Luxury brands do not shout. They invite.
 */

import HomeHero from '@/components/home/HomeHero';
import BrandStatement from '@/components/home/BrandStatement';
import CuratedProducts from '@/components/home/CuratedProducts';
import ShopByCategory from '@/components/home/ShopByCategory';
import CuratedDuos from '@/components/home/CuratedDuos';
import OraPhilosophy from '@/components/home/OraPhilosophy';
import TrustStrip from '@/components/home/TrustStrip';
import Newsletter from '@/components/home/Newsletter';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen overflow-x-hidden">
      {/* 1. HERO — Brand identity, not promotions */}
      <HomeHero
        heroImage="/banners.png"
        heroImageMobile="/banners.png"
        title="Own. Radiate. Adorn."
        subtitle="Contemporary jewellery crafted for the modern woman."
        primaryCTA={{ label: 'Explore Collection', href: '/collections' }}
        secondaryCTA={{ label: 'New Arrivals', href: '/collections/new-arrivals' }}
      />

      {/* 2. BRAND STATEMENT — Calm, refined messaging */}
      <BrandStatement />

      {/* 3. FEATURED STYLES — Primary selling section */}
      <CuratedProducts
        heading="Featured Styles"
        subheading=""
        collectionSlug="featured"
        limit={8}
        ctaLabel="View All"
        ctaHref="/collections"
      />

      {/* 4. SHOP BY CATEGORY — Clean cards, no discount labels */}
      <ShopByCategory heading="Shop by Category" />

      {/* 5. NEW ARRIVALS — No hype */}
      <CuratedProducts
        heading="New Arrivals"
        subheading=""
        collectionSlug="new-arrivals"
        limit={4}
        ctaLabel="See All New Arrivals"
        ctaHref="/collections/new-arrivals"
      />

      {/* 6. CURATED ORA DUOS — Subtle, intentional combos */}
      <CuratedDuos />

      {/* 7. THE ORA PHILOSOPHY — Brand depth & emotional storytelling */}
      <OraPhilosophy />

      {/* 8. TRUST STRIP — 4 minimal icons */}
      <TrustStrip />

      {/* 9. NEWSLETTER — Luxury tone */}
      <Newsletter />
    </main>
  );
}
