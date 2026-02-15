'use client';

/**
 * TumblersPageContent — ORA Premium Tumblers Collection
 * =====================================================
 *
 * Brand Positioning: Premium, clean, confident (not aggressive)
 * Color Palette: Baby pink brand tones (oraPink, oraAccent, oraLight)
 * 
 * All Products: 40oz tumblers with straw + handle
 * Performance: Progressive insulation (4h-7h hot, 12h-24h cold)
 * 
 * 3 Tiers:
 *  1. Classic Flow      – ₹1,099 (MRP ₹3,999) — 4h hot/12h cold — Launch Price
 *  2. Marble Gloss      – ₹2,099 (MRP ₹4,999) — 5h hot/18h cold — Special Edition
 *  3. Floral Gift       – ₹3,099 (MRP ₹5,999) — 7h hot/24h cold — Limited Collaboration
 * 
 * Removed: Fake urgency, fake reviews, "Most Popular", "% OFF", "Selling fast"
 * Added: Honest comparison table, 5-day return policy
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, ThermometerSun, Shield, Truck, Sparkles, Gift } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

import TumblersHero from './TumblersHero';
import TumblerShowcaseCard, { type TumblerTier } from './TumblerShowcaseCard';
import WhyStanley from './WhyStanley';
import ComparisonTable from './ComparisonTable';
import SocialProof from './SocialProof';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';

// ============================================
// TUMBLER TIER DEFINITIONS
// ============================================

const TUMBLER_TIERS: TumblerTier[] = [
  {
    id: 'tumbler-classic-001',
    productId: 'tumbler-classic-001',
    slug: 'ora-classic-flow-tumbler',
    tier: 'essential',
    name: 'Classic Flow',
    tagline: 'Everyday Essential',
    description:
      '40oz capacity with standard steel density. Matte powder coat finish provides a refined everyday look. Standard lid seal keeps drinks secure. Comes in basic protective packaging.',
    price: 1099,
    originalPrice: 3999,
    image: '/images/tumblers/essential.webp',
    hoverImage: '/images/tumblers/essential-alt.webp',
    badge: 'Launch Price',
    badgeColor: '#F6C1CF',
    capacity: '40oz · Stainless Steel · Straw + Handle',
    rating: null,
    reviewCount: null,
    soldCount: null,
    stockLeft: null,
    color: '#F6C1CF',
    usps: [
      { icon: <ThermometerSun size={16} />, text: '4 hrs hot / 12 hrs cold' },
      { icon: <Droplets size={16} />, text: 'Standard lid seal' },
      { icon: <Shield size={16} />, text: 'Matte powder coat finish' },
      { icon: <Truck size={16} />, text: 'Basic protective packaging' },
    ],
  },
  {
    id: 'tumbler-marble-001',
    productId: 'tumbler-marble-001',
    slug: 'ora-marble-gloss-tumbler',
    tier: 'popular',
    name: 'Marble Gloss Edition',
    tagline: 'Refined Daily Upgrade',
    description:
      '40oz with enhanced steel thickness for improved durability. Premium gloss marble finish adds visual refinement. Improved lid-lock mechanism ensures secure transport. Arrives in premium sleeve packaging.',
    price: 2099,
    originalPrice: 4999,
    image: '/images/tumblers/popular.webp',
    hoverImage: '/images/tumblers/popular-alt.webp',
    badge: 'Special Edition',
    badgeColor: '#E75480',
    capacity: '40oz · Enhanced Steel · Straw + Handle',
    rating: null,
    reviewCount: null,
    soldCount: null,
    stockLeft: null,
    color: '#E75480',
    usps: [
      { icon: <ThermometerSun size={16} />, text: '5 hrs hot / 18 hrs cold' },
      { icon: <Droplets size={16} />, text: 'Improved lid-lock mechanism' },
      { icon: <Sparkles size={16} />, text: 'Gloss marble finish' },
      { icon: <Gift size={16} />, text: 'Premium sleeve packaging' },
    ],
  },
  {
    id: 'tumbler-floral-001',
    productId: 'tumbler-floral-001',
    slug: 'ora-floral-gift-edition',
    tier: 'premium',
    name: 'Floral Gift Edition',
    tagline: 'Collector Gift Edition',
    description:
      '40oz with highest insulation density. Premium gloss floral exterior with gold detailing accents. Magnetic seal lid provides effortless secure closure. Luxury gift box packaging makes this ideal for gifting.',
    price: 3099,
    originalPrice: 5999,
    image: '/images/tumblers/premium.webp',
    hoverImage: '/images/tumblers/premium-alt.webp',
    badge: 'Limited Collaboration',
    badgeColor: '#C6A85B',
    capacity: '40oz · Premium Steel · Straw + Handle',
    rating: null,
    reviewCount: null,
    soldCount: null,
    stockLeft: null,
    color: '#C6A85B',
    usps: [
      { icon: <ThermometerSun size={16} />, text: '7 hrs hot / 24 hrs cold' },
      { icon: <Droplets size={16} />, text: 'Magnetic seal lid' },
      { icon: <Sparkles size={16} />, text: 'Gold detailing accents' },
      { icon: <Gift size={16} />, text: 'Luxury gift box packaging' },
    ],
  },
];

// ============================================
// COMPONENT
// ============================================

export default function TumblersPageContent() {
  const addItem = useCartStore((s) => s.addItem);
  const [tumblers, setTumblers] = useState<TumblerTier[]>(TUMBLER_TIERS);

  // Optional: fetch real tumbler products from API and merge
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchTumblers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products?isTumbler=true&limit=3&sort=price_asc`);
      if (!res.ok) return;
      const data = await res.json();
      const products = data.data?.products || data.products || [];

      if (products.length === 3) {
        // Map API products onto the 3 tiers (sorted by price asc)
        const sorted = [...products].sort(
          (a: { price: number }, b: { price: number }) => a.price - b.price
        );
        const tiers: ('essential' | 'popular' | 'premium')[] = ['essential', 'popular', 'premium'];

        const merged: TumblerTier[] = sorted.map((p: any, i: number) => {
          const base = TUMBLER_TIERS[i]; // default fallback
          const primaryImage =
            p.images?.[0]?.url ||
            p.primaryImage ||
            base.image;

          return {
            ...base,
            id: p.id,
            productId: p.id,
            slug: p.slug || base.slug,
            tier: tiers[i],
            name: p.name || base.name,
            description: p.shortDescription || p.description || base.description,
            price: p.finalPrice || p.price,
            originalPrice: p.price || base.originalPrice,
            image: primaryImage,
            hoverImage: p.images?.[1]?.url || base.hoverImage,
            capacity: p.capacity ? `${p.capacity} · Stainless Steel` : base.capacity,
            rating: p.averageRating || base.rating,
            reviewCount: p.reviewCount || base.reviewCount,
            stockLeft: p.stockQuantity != null && p.stockQuantity < 20 ? p.stockQuantity : base.stockLeft,
          };
        });

        setTumblers(merged);
      }
    } catch {
      // Silently fall back to static data
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTumblers();
  }, [fetchTumblers]);

  // Add to cart handler (used by comparison table)
  const handleAddToCart = (tumbler: TumblerTier) => {
    addItem({
      id: tumbler.id,
      productId: tumbler.productId,
      name: tumbler.name,
      image: tumbler.image,
      price: tumbler.price,
      quantity: 1,
    });
  };

  return (
    <main className="w-full bg-white">
      {/* 1. Cinematic Hero */}
      <TumblersHero />

      {/* 2. Three Tumbler Showcase Sections */}
      <div id="tumbler-collection">
        {tumblers.map((tumbler, index) => (
          <TumblerShowcaseCard key={tumbler.id} tumbler={tumbler} index={index} />
        ))}
      </div>

      {/* 3. Why Stanley — benefit grid */}
      <WhyStanley />

      {/* 4. Comparison Table */}
      <ComparisonTable tumblers={tumblers} onAddToCart={handleAddToCart} />

      {/* 5. FAQ */}
      <FAQ />

      {/* 7. Final CTA banner */}
      <FinalCTA />
    </main>
  );
}
