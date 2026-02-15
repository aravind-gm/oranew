'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * VideoReelStrip — Infinite auto-loop reel strip
 * ORA Valentine's Special | Production-ready
 *
 * ▸ CSS marquee-style infinite horizontal loop
 * ▸ Triple-duplicated items for seamless wrap
 * ▸ Hover = pause entire strip
 * ▸ 9:16 portrait reel cards
 * ▸ Gradient overlay + serif text per card
 * ▸ Reduced-motion: static grid fallback
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import styles from './valentine.module.css';

/* ─── Types ─── */
interface ReelItem {
  id: string;
  videoSrc?: string;
  posterSrc: string;
  overlayText: string;
  href: string;
}

interface VideoReelStripProps {
  reels?: ReelItem[];
  title?: string;
}

const DEFAULT_REELS: ReelItem[] = [
  { id: 'r1', posterSrc: '/valentine-banner.svg', overlayText: 'Made for Her', href: '#featured' },
  { id: 'r2', posterSrc: '/chain.jpeg', overlayText: 'Wrapped with Love', href: '/collections/necklaces' },
  { id: 'r3', posterSrc: '/ring.jpeg', overlayText: 'Styled Daily', href: '/collections/rings' },
  { id: 'r4', posterSrc: '/bracelets.jpeg', overlayText: 'Love, Always', href: '/collections/bracelets' },
  { id: 'r5', posterSrc: '/everyday-love-cup.svg', overlayText: 'Sip in Style', href: '#tumblers' },
  { id: 'r6', posterSrc: '/marble-love-cup.svg', overlayText: 'Gift of the Season', href: '#tumblers' },
  { id: 'r7', posterSrc: '/banners.png', overlayText: 'Celebrate Her', href: '#combos' },
];

/* ─── Single reel card ─── */
function ReelCard({ reel, idx }: { reel: ReelItem; idx: number }) {
  return (
    <Link href={reel.href} className="flex-shrink-0 block">
      <div className={styles.reelCard}>
        <Image
          src={reel.posterSrc}
          alt={reel.overlayText}
          fill
          className="object-cover"
          sizes="200px"
          loading={idx < 7 ? 'eager' : 'lazy'}
          quality={80}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-[1]" />

        {/* Overlay text */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-[2]">
          <p className="font-serif text-lg text-white italic leading-snug">
            {reel.overlayText}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Component ─── */
function VideoReelStrip({
  reels = DEFAULT_REELS,
  title = 'As Seen on ORA',
}: VideoReelStripProps) {
  const prefersReducedMotion = useReducedMotion();

  // Triple-duplicate for seamless infinite loop
  const tripled = [...reels, ...reels, ...reels];

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden" aria-label="Video lookbook">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-8">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase text-rose-600 font-medium">
            {title}
          </span>
        </motion.div>
      </div>

      {prefersReducedMotion ? (
        /* Static grid for reduced-motion */
        <div className="flex gap-4 px-5 sm:px-8 overflow-x-auto pb-4" role="region" aria-label="Lookbook reels">
          {reels.map((reel, idx) => (
            <ReelCard key={reel.id} reel={reel} idx={idx} />
          ))}
        </div>
      ) : (
        /* Infinite auto-looping marquee */
        <div
          className={styles.reelTrackWrapper}
          role="region"
          aria-roledescription="carousel"
          aria-label="Auto-scrolling lookbook reels"
        >
          <div className={styles.reelTrack}>
            {tripled.map((reel, idx) => (
              <ReelCard key={`${reel.id}-${idx}`} reel={reel} idx={idx} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(VideoReelStrip);
