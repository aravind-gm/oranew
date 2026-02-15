'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * ValentineHero — Full-viewport cinematic hero
 * ORA Valentine's Special | Production-ready
 *
 * ▸ Video-first with WebM/MP4 sources + poster fallback
 * ▸ Slow zoom on video for life-like feel
 * ▸ Staggered headline/subtitle/CTA entrance
 * ▸ Shimmer overlay for luxury depth
 * ▸ Scroll-discovery bounce indicator
 * ▸ Mobile: shows static image if prefers-reduced-motion
 * ▸ Accessible: prefers-reduced-motion, aria-labels, focus rings
 * ▸ SEO: h1 rendered in markup
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Gift, Heart } from 'lucide-react';
import Image from 'next/image';
import { memo, useEffect, useRef } from 'react';
import styles from './valentine.module.css';

/* ─── Props ─── */
interface ValentineHeroProps {
  heroImage?: string;
  heroImageMobile?: string;
  heroVideo?: string;
  heroVideoWebm?: string;
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  yearTag?: string;
  primaryCTA?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
}

/* ─── Animation tokens ─── */
const STAGGER_PARENT = {
  initial: {},
  animate: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay } },
});

const FADE_LEFT = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.15 } },
};

/* ─── Component ─── */
function ValentineHero({
  heroImage = '/banners.png',
  heroImageMobile,
  heroVideo,
  heroVideoWebm,
  title = "Valentine's",
  titleAccent = 'Special',
  subtitle = 'Love, styled daily — gifts that speak without words.',
  yearTag = "Valentine's 2026",
  primaryCTA = { label: 'Shop Valentine Gifts', href: '#combos' },
  secondaryCTA = { label: 'Explore Combos', href: '#combos' },
}: ValentineHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.orashop.in';
  const videoSrc = heroVideo || `${CDN_BASE}/valentine/hero-valentine.mp4`;
  const videoSrcWebm = heroVideoWebm || `${CDN_BASE}/valentine/hero-valentine.webm`;

  useEffect(() => {
    const v = videoRef.current;
    if (v && !prefersReducedMotion) {
      v.play().catch(() => {});
    }
  }, [prefersReducedMotion]);

  return (
    <section
      className={styles.heroSection}
      aria-label="Valentine's Special Hero"
      id="valentine-hero"
    >
      {/* ── Background Media ── */}
      <div className="absolute inset-0" aria-hidden="true">
        {!prefersReducedMotion && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={styles.heroVideo}
            poster={heroImage}
          >
            <source src={videoSrcWebm} type="video/webm" />
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Fallback / poster image — always present beneath video */}
        <Image
          src={heroImage}
          alt=""
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
        {heroImageMobile && (
          <Image
            src={heroImageMobile}
            alt=""
            fill
            className="object-cover sm:hidden"
            priority
            quality={85}
            sizes="100vw"
          />
        )}

        {/* Layered overlays */}
        <div className={styles.heroOverlay} />
        <div className={styles.heroOverlayBottom} />
        {!prefersReducedMotion && <div className={styles.heroShimmer} />}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          className="max-w-2xl"
          variants={STAGGER_PARENT}
          initial="initial"
          animate="animate"
        >
          {/* Year tag */}
          <motion.div variants={FADE_LEFT} className="inline-flex items-center gap-3 mb-6">
            <span className="w-10 h-px bg-rose-400" aria-hidden="true" />
            <span className="text-sm tracking-[0.3em] uppercase text-rose-300 font-medium">
              {yearTag}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={FADE_UP(0.05)}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-light leading-[1.05] text-white mb-6"
          >
            {title}
            <br />
            <span className="italic text-rose-300">{titleAccent}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={FADE_UP(0.1)}
            className="text-lg sm:text-xl text-white/80 leading-relaxed mb-10 max-w-lg font-light"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={FADE_UP(0.15)} className="flex flex-col sm:flex-row gap-4">
            <a
              href={primaryCTA.href}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-rose-700 text-white font-medium rounded-full transition-all duration-300 hover:bg-rose-800 hover:scale-[1.02] shadow-lg shadow-rose-900/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
            >
              <Heart className="w-5 h-5" aria-hidden="true" />
              <span>{primaryCTA.label}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href={secondaryCTA.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-full transition-all duration-300 hover:border-white/60 hover:bg-white/10 backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Gift className="w-5 h-5" aria-hidden="true" />
              <span>{secondaryCTA.label}</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs tracking-[0.2em] uppercase text-white/60">Discover</span>
            <svg className="w-5 h-5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

export default memo(ValentineHero);
