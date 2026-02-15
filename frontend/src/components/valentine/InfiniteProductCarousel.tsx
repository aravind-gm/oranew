'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * InfiniteProductCarousel — Endless auto-scrolling product strip
 * ORA Valentine's Special | Production-ready
 *
 * ▸ requestAnimationFrame loop for 60 fps GPU-accelerated scroll
 * ▸ Triple-duplicated products for seamless wrap
 * ▸ Hover/touch = pause with 2 s resume delay
 * ▸ Fade edges left/right
 * ▸ Loading skeleton state
 * ▸ prefers-reduced-motion: falls back to manual scroll
 * ═══════════════════════════════════════════════════════════════
 */

import ProductCardProduction from '@/components/product/ProductCardProduction';
import { motion, useReducedMotion } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

/* ─── Types ─── */
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
  images: { id?: string; imageUrl: string; isPrimary?: boolean; altText?: string }[];
}

interface InfiniteProductCarouselProps {
  products: Product[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  speed?: number;
}

/* ─── Component ─── */
function InfiniteProductCarousel({
  products,
  loading = false,
  title = 'Valentine Picks',
  subtitle = 'Keep scrolling — your perfect gift is here.',
  speed = 0.8,
}: InfiniteProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loopProducts = products.length > 0 ? [...products, ...products, ...products] : [];

  const pause = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setIsPaused(true);
  }, []);

  const resume = useCallback((delay = 0) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    if (delay > 0) {
      resumeTimer.current = setTimeout(() => setIsPaused(false), delay);
    } else {
      setIsPaused(false);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loopProducts.length === 0 || prefersReducedMotion) return;

    const animate = () => {
      if (!isPaused && el) {
        posRef.current += speed;
        const singleSetWidth = el.scrollWidth / 3;
        if (posRef.current >= singleSetWidth) {
          posRef.current -= singleSetWidth;
        }
        el.scrollLeft = posRef.current;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPaused, loopProducts.length, speed, prefersReducedMotion]);

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  return (
    <section className="py-16 sm:py-20 bg-white" id="products" aria-label="Valentine product picks">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-8">
        <motion.div
          className="text-center"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase text-rose-600 font-medium">
            Endless Inspiration
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-3 font-light">
            {title}
          </h2>
          <p className="text-neutral-500 mt-4 max-w-lg mx-auto text-base">
            {subtitle}
          </p>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-hidden px-8" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[220px] animate-pulse">
              <div className="aspect-[3/4] bg-neutral-200 rounded-xl mb-3" />
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div
          className="relative overflow-hidden"
          onMouseEnter={pause}
          onMouseLeave={() => resume(0)}
          onTouchStart={pause}
          onTouchEnd={() => resume(2000)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />

          <div
            ref={scrollRef}
            className={`flex gap-5 py-2 ${prefersReducedMotion ? 'overflow-x-auto snap-x snap-mandatory' : 'overflow-x-hidden'}`}
            style={{ scrollBehavior: 'auto' }}
          >
            {loopProducts.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
                className={`flex-shrink-0 w-[220px] sm:w-[260px] ${prefersReducedMotion ? 'snap-center' : ''}`}
                aria-hidden={idx >= products.length}
              >
                <ProductCardProduction product={product} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default memo(InfiniteProductCarousel);
