'use client';

/**
 * GiftByPriceHearts — Heart-Shaped Price Range Cards
 * 
 * Purpose: Decision simplification via emotional price bucketing.
 * UX: 4 heart-shaped/styled cards at different price tiers,
 *      soft gradients, floating heart icons, clear CTA per card.
 * Motion: Staggered pop-in, gentle float on hearts.
 * Mobile: 2-column grid, smaller hearts.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';

interface PriceTier {
  id: number;
  label: string;
  subtitle: string;
  maxPrice?: number; // For URL filter construction
  minPrice?: number; // For premium tier
  collectionHandle?: string; // Alternative: link to smart collection
  gradient: string;
  heartColor: string;
}

interface GiftByPriceHeartsProps {
  heading?: string;
  subheading?: string;
  tiers?: PriceTier[];
  useSmartCollections?: boolean; // Toggle between URL filters and collections
}

const DEFAULT_TIERS: PriceTier[] = [
  {
    id: 1,
    label: 'Under ₹1,099',
    subtitle: 'Little Love',
    maxPrice: 1099,
    collectionHandle: 'under-1099',
    gradient: 'from-[#FFF0F5] to-[#FFE4EC]',
    heartColor: '#F9A8D4',
  },
  {
    id: 2,
    label: 'Under ₹2,099',
    subtitle: 'Signature Love',
    maxPrice: 2099,
    collectionHandle: 'under-2099',
    gradient: 'from-[#FFE4EC] to-[#FFD6E5]',
    heartColor: '#F472B6',
  },
  {
    id: 3,
    label: 'Under ₹3,099',
    subtitle: 'Grand Love',
    maxPrice: 3099,
    collectionHandle: 'under-3099',
    gradient: 'from-[#FFD6E5] to-[#FBCFE8]',
    heartColor: '#EC4899',
  },
  {
    id: 4,
    label: 'Premium',
    subtitle: 'All Out Love',
    minPrice: 3099,
    collectionHandle: 'premium',
    gradient: 'from-[#FBCFE8] to-[#F8B4E6]',
    heartColor: '#DB2777',
  },
];

export default function GiftByPriceHearts({
  heading = 'Gift by Heart',
  subheading = 'Find the perfect piece at every price — wrapped with love.',
  tiers = DEFAULT_TIERS,
  useSmartCollections = false,
}: GiftByPriceHeartsProps) {
  
  // Generate proper href based on configuration
  const getHref = (tier: PriceTier): string => {
    if (useSmartCollections && tier.collectionHandle) {
      return `/collections/${tier.collectionHandle}`;
    }
    
    // Use URL-based filtering
    const params = new URLSearchParams();
    if (tier.maxPrice) {
      params.set('maxPrice', tier.maxPrice.toString());
    }
    if (tier.minPrice) {
      params.set('minPrice', tier.minPrice.toString());
    }
    
    return `/collections/all?${params.toString()}`;
  };
  return (
    <section className="py-14 md:py-20 lg:py-28 bg-[#FFFBFD]">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-lg mx-auto">
            {subheading}
          </p>
        </motion.div>

        {/* Heart Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={getHref(tier)}
                className={`group relative block rounded-3xl bg-gradient-to-br ${tier.gradient} p-6 md:p-8 text-center overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              >
                {/* Floating decorative hearts */}
                <motion.div
                  className="absolute top-3 right-3 opacity-[0.12] pointer-events-none"
                  animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }}
                  transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Heart className="w-6 h-6 md:w-8 md:h-8" style={{ color: tier.heartColor }} fill={tier.heartColor} />
                </motion.div>
                <motion.div
                  className="absolute bottom-4 left-3 opacity-[0.08] pointer-events-none"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <Heart className="w-4 h-4 md:w-5 md:h-5" style={{ color: tier.heartColor }} fill={tier.heartColor} />
                </motion.div>

                {/* Main Heart Icon */}
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="relative">
                    <Heart
                      className="w-14 h-14 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-110"
                      style={{ color: tier.heartColor }}
                      fill={tier.heartColor}
                      strokeWidth={0}
                    />
                    {/* Inner glow */}
                    <div
                      className="absolute inset-0 rounded-full blur-xl opacity-30"
                      style={{ backgroundColor: tier.heartColor }}
                    />
                  </div>
                </div>

                {/* Label */}
                <h3 className="text-base md:text-lg font-serif font-medium text-[#1A1A1A] mb-1">
                  {tier.label}
                </h3>
                <p className="text-sm text-neutral-500 mb-4 md:mb-6 italic">
                  {tier.subtitle}
                </p>

                {/* CTA */}
                <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9B2C46] group-hover:gap-2.5 transition-all duration-300">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
