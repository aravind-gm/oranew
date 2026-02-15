'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * GiftByPriceGrid — Heart-shaped budget-anchoring cards
 * ORA Valentine's Special | Production-ready
 *
 * ▸ 3 price tiers with gradient backgrounds
 * ▸ Click-to-filter: shows products matching tier
 * ▸ AnimatePresence for smooth filter transitions
 * ▸ Uses ProductCardProduction for filtered results
 * ▸ Active state with inverted colors
 * ▸ Accessible: button role, aria-pressed, focus rings
 * ═══════════════════════════════════════════════════════════════
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import styles from './valentine.module.css';

/* ─── Types ─── */
interface PriceTier {
  label: string;
  max: number;
  tag: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent?: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  category?: string;
  images: { id?: string; imageUrl: string; isPrimary?: boolean; altText?: string }[];
  stockQuantity?: number;
  description?: string;
}

interface GiftByPriceGridProps {
  products: Product[];
  tiers?: PriceTier[];
}

/* ─── Defaults ─── */
const DEFAULT_TIERS: PriceTier[] = [
  { label: 'Under ₹1,099', max: 1099, tag: 'Thoughtful Tokens' },
  { label: 'Under ₹2,099', max: 2099, tag: 'Signature Gifts' },
  { label: 'Under ₹3,099', max: 3099, tag: 'Grand Gestures' },
];

const TIER_STYLES = [styles.heartCardTier1, styles.heartCardTier2, styles.heartCardTier3];

/* ─── Component ─── */
function GiftByPriceGrid({
  products,
  tiers = DEFAULT_TIERS,
}: GiftByPriceGridProps) {
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleFilter = useCallback(
    (max: number) => {
      if (activeTier === max) {
        setActiveTier(null);
        setFilteredProducts(products);
      } else {
        setActiveTier(max);
        setFilteredProducts(products.filter((p) => (p.finalPrice || p.price) <= max));
      }
    },
    [activeTier, products]
  );

  return (
    <section className="py-16 sm:py-20 bg-white" id="gift-by-price" aria-label="Shop by budget">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase text-rose-600 font-medium">
            Shop by Budget
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-3 font-light">
            Gift by Price
          </h2>
          <p className="text-neutral-500 mt-4 max-w-xl mx-auto text-base leading-relaxed">
            Love isn&apos;t about the price tag — but a little guidance never hurts.
          </p>
        </motion.div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" role="group" aria-label="Price tier filters">
          {tiers.map((tier, i) => (
            <motion.button
              key={tier.max}
              onClick={() => handleFilter(tier.max)}
              aria-pressed={activeTier === tier.max}
              className={`${styles.heartCard} ${
                activeTier === tier.max
                  ? 'bg-rose-700 !text-white shadow-xl scale-[1.02] border-rose-700'
                  : TIER_STYLES[i] || TIER_STYLES[0]
              } text-left w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400`}
              whileHover={prefersReducedMotion ? {} : { y: -6 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="mb-4" aria-hidden="true">
                <Heart
                  className={`w-8 h-8 ${activeTier === tier.max ? 'text-rose-200' : 'text-rose-400'}`}
                  fill={activeTier === tier.max ? 'rgba(255,228,230,0.4)' : 'rgba(244,63,94,0.1)'}
                />
              </div>

              <span
                className={`text-xs tracking-[0.2em] uppercase font-medium block mb-1 ${
                  activeTier === tier.max ? 'text-rose-200' : 'text-rose-600'
                }`}
              >
                {tier.tag}
              </span>

              <h3
                className={`font-serif text-3xl sm:text-4xl mt-1 mb-3 ${
                  activeTier === tier.max ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {tier.label}
              </h3>

              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  activeTier === tier.max ? 'text-white/80' : 'text-rose-700'
                }`}
              >
                <span>{activeTier === tier.max ? 'Showing results' : 'View gifts →'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Filtered Products */}
        <AnimatePresence mode="wait">
          {activeTier !== null && (
            <motion.div
              key={activeTier}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              role="region"
              aria-label={`Products under ₹${activeTier.toLocaleString('en-IN')}`}
              aria-live="polite"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-neutral-500 text-sm">
                  Showing {filteredProducts.length} gift{filteredProducts.length !== 1 ? 's' : ''} under ₹{activeTier.toLocaleString('en-IN')}
                </p>
                <button
                  onClick={() => {
                    setActiveTier(null);
                    setFilteredProducts(products);
                  }}
                  className="text-sm text-rose-700 hover:text-rose-800 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                >
                  Clear filter
                </button>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCardProduction key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-10 h-10 text-rose-300 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-neutral-500">No gifts found in this range. Try a higher tier.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default memo(GiftByPriceGrid);
