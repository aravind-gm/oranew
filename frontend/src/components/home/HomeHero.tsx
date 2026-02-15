'use client';

/**
 * HomeHero — Luxury Brand-First Hero
 * 
 * Purpose: Establish brand identity. Not to sell immediately.
 * UX: Full-width, neutral background, one refined image, no clutter.
 * No: combo promotion, discounts, savings, emoji, animated urgency
 */

import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface HomeHeroProps {
  heroImage?: string;
  heroImageMobile?: string;
  heroVideo?: string;
  title?: string;
  subtitle?: string;
  primaryCTA?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
}

export default function HomeHero({
  heroImage = '/banners.png',
  heroImageMobile,
  heroVideo,
  title = 'Own. Radiate. Adorn.',
  subtitle = 'Contemporary jewellery crafted for the modern woman.',
  primaryCTA = { label: 'Explore Collection', href: '/collections' },
  secondaryCTA = { label: 'New Arrivals', href: '/collections/new-arrivals' },
}: HomeHeroProps) {
  return (
    <section className="relative w-full h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0">
        {heroVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={heroImage}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <>
            <Image
              src={heroImage}
              alt="ORA Jewellery — Contemporary Collection"
              fill
              className={`object-cover object-center ${heroImageMobile ? 'hidden md:block' : ''}`}
              priority
              quality={90}
              sizes="100vw"
            />
            {heroImageMobile && (
              <Image
                src={heroImageMobile}
                alt="ORA Jewellery — Contemporary Collection"
                fill
                className="object-cover object-center md:hidden"
                priority
                quality={85}
                sizes="100vw"
              />
            )}
          </>
        )}

        {/* Neutral gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-4 md:mb-6 tracking-tight leading-[1.1]"
          >
            {title.split('.').filter(Boolean).map((word, i, arr) => (
              <span key={i}>
                {i === arr.length - 1 ? (
                  <span className="italic">{word.trim()}.</span>
                ) : (
                  <>{word.trim()}. </>
                )}
              </span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="text-base sm:text-lg md:text-xl mb-8 md:mb-10 opacity-90 font-light max-w-lg mx-auto"
          >
            {subtitle}
          </motion.p>

          {/* CTAs — clean, minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Link
              href={primaryCTA.href}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-oraAccent text-white font-medium rounded-full hover:bg-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>{primaryCTA.label}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={secondaryCTA.href}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 border-2 border-oraAccent text-oraAccent bg-white/10 backdrop-blur-sm font-medium rounded-full hover:bg-oraLight transition-all duration-300"
            >
              <span>{secondaryCTA.label}</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/70 flex flex-col items-center gap-1"
      >
        <span className="text-xs tracking-[0.2em] uppercase font-light">Discover</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
