'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * MediaLoopCarousel — GPU-accelerated auto-scroll carousel
 * ORA Valentine's Special | Production-ready
 *
 * ▸ requestAnimationFrame loop for 60 fps scroll
 * ▸ Triple-duplicated items for seamless infinite wrap
 * ▸ Hover/touch = pause with 2 s resume delay
 * ▸ Overlay text (ghost behind image) for editorial feel
 * ▸ Fade edges left/right
 * ▸ prefers-reduced-motion: falls back to snap-scroll
 * ▸ Lazy-loaded media except first 3
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import styles from './valentine.module.css';

/* ─── Types ─── */
interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt: string;
  overlayText?: string;
  href?: string;
}

interface MediaLoopCarouselProps {
  items?: MediaItem[];
  speed?: number;
  label?: string;
}

/* ─── Defaults ─── */
const DEFAULT_MEDIA: MediaItem[] = [
  { type: 'image', src: '/valentine-banner.svg', alt: 'Valentine Gift Ideas', overlayText: 'Unwrap Love', href: '#combos' },
  { type: 'image', src: '/banners.png', alt: 'ORA Valentine Collection', overlayText: 'Made for Her', href: '#products' },
  { type: 'image', src: '/chain.jpeg', alt: 'Valentine Necklaces', overlayText: 'Everyday Romance', href: '/collections/necklaces' },
  { type: 'image', src: '/ring.jpeg', alt: 'Valentine Rings', overlayText: 'Unwrap Love', href: '/collections/rings' },
  { type: 'image', src: '/bracelets.jpeg', alt: 'Valentine Bracelets', overlayText: 'Made for Her', href: '/collections/bracelets' },
  { type: 'image', src: '/everyday-love-cup.svg', alt: 'Everyday Love Tumbler', overlayText: 'Everyday Romance', href: '#tumblers' },
  { type: 'image', src: '/marble-love-cup.svg', alt: 'Marble Love Tumbler', overlayText: 'Unwrap Love', href: '#tumblers' },
  { type: 'image', src: '/ultimate-valentine-gift-box.svg', alt: 'Ultimate Valentine Gift Box', overlayText: 'Made for Her', href: '#combos' },
];

/* ─── Component ─── */
function MediaLoopCarousel({
  items = DEFAULT_MEDIA,
  speed = 0.6,
  label = 'Love in Every Detail',
}: MediaLoopCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loopItems = [...items, ...items, ...items];

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
    const el = trackRef.current;
    if (!el || prefersReducedMotion) return;

    const animate = () => {
      if (!isPaused && el) {
        posRef.current += speed;
        const singleSetWidth = el.scrollWidth / 3;
        if (posRef.current >= singleSetWidth) {
          posRef.current -= singleSetWidth;
        }
        el.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPaused, speed, prefersReducedMotion]);

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  return (
    <section className="py-10 sm:py-14 bg-white overflow-hidden" aria-label="Valentine media gallery">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs tracking-[0.25em] uppercase text-rose-600 font-medium">
            {label}
          </span>
        </motion.div>
      </div>

      <div
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        role="region"
        aria-roledescription="carousel"
        aria-label="Valentine lifestyle images"
        onMouseEnter={pause}
        onMouseLeave={() => resume(0)}
        onTouchStart={pause}
        onTouchEnd={() => resume(2000)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />

        <div
          ref={trackRef}
          className={`flex gap-4 will-change-transform ${prefersReducedMotion ? 'overflow-x-auto snap-x snap-mandatory' : ''}`}
          style={{ width: prefersReducedMotion ? 'auto' : 'max-content' }}
        >
          {loopItems.map((item, idx) => {
            const isEager = idx < 3;
            const card = (
              <div className={styles.mediaCard} key={idx}>
                {item.type === 'video' ? (
                  <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                    <source src={item.src} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="320px"
                    loading={isEager ? 'eager' : 'lazy'}
                    quality={80}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-[1]" />
                {item.overlayText && (
                  <div className={styles.mediaOverlayText}>{item.overlayText}</div>
                )}
              </div>
            );

            return item.href ? (
              <Link
                href={item.href}
                key={idx}
                className={`flex-shrink-0 ${prefersReducedMotion ? 'snap-center' : ''}`}
                tabIndex={idx >= items.length ? -1 : 0}
                aria-hidden={idx >= items.length}
              >
                {card}
              </Link>
            ) : (
              <div key={idx} className={`flex-shrink-0 ${prefersReducedMotion ? 'snap-center' : ''}`}>
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(MediaLoopCarousel);
