'use client';

/**
 * LuxuryHero — Multi-Slide Hero Carousel
 *
 * Features:
 *  - Multiple slides with auto-advance (5s interval)
 *  - Dot indicators + swipe support
 *  - Reduced height (~65vh) per D2C standard
 *  - Smooth crossfade transitions
 *  - Each slide has its own headline, CTA, image
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface HeroSlide {
  id: number;
  desktopImage: string;
  mobileImage: string;
  headline: string;
  headlineAccent?: string;
  subtitle: string;
  cta: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

const SLIDES: HeroSlide[] = [
  {
    id: 1,
    desktopImage: 'https://cdn.orashop.in/banners/home/hero-1.webp',
    mobileImage: 'https://cdn.orashop.in/banners/home/mobile-1.webp',
    headline: 'Own. Radiate.',
    headlineAccent: 'Adorn.',
    subtitle: 'Premium necklaces, rings & bracelets crafted for the modern woman.',
    cta: { label: 'Shop Bestsellers', href: '/collections' },
    ctaSecondary: { label: 'View All', href: '/collections' },
  },
  {
    id: 2,
    desktopImage: 'https://cdn.orashop.in/banners/home/hero-2.webp',
    mobileImage: 'https://cdn.orashop.in/banners/home/mobile-2.webp',
    headline: 'Necklaces That',
    headlineAccent: 'Move With You',
    subtitle: 'Layered, minimal, or statement — find the piece that defines your style.',
    cta: { label: 'Shop Necklaces', href: '/collections?category=necklaces' },
  },
  {
    id: 3,
    desktopImage: 'https://cdn.orashop.in/banners/home/hero-3.webp',
    mobileImage: 'https://cdn.orashop.in/banners/home/mobile-3.webp',
    headline: 'Rings For',
    headlineAccent: 'Every Moment',
    subtitle: 'Stackable bands, bold solitaires, and everyday classics.',
    cta: { label: 'Shop Rings', href: '/collections?category=rings' },
  },
  {
    id: 4,
    desktopImage: 'https://cdn.orashop.in/banners/home/hero-4.webp',
    mobileImage: 'https://cdn.orashop.in/banners/home/mobile-4.webp',
    headline: 'Bracelets',
    headlineAccent: 'Wrapped in Grace',
    subtitle: 'Delicate cuffs & charm bracelets for effortless elegance.',
    cta: { label: 'Shop Bracelets', href: '/collections?category=bracelets' },
  },
  {
    id: 5,
    desktopImage: 'https://cdn.orashop.in/banners/home/hero-5.webp',
    mobileImage: 'https://cdn.orashop.in/banners/home/mobile-5.webp',
    headline: 'Elegance',
    headlineAccent: 'Redefined',
    subtitle: 'Discover jewellery that speaks your language of style.',
    cta: { label: 'Explore Now', href: '/collections' },
  },
];

export default function LuxuryHero() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    startTimer();
  };

  const goNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
    startTimer();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    startTimer();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  const slide = SLIDES[current];

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  };

  return (
    <section
      className="relative w-full h-[65svh] min-h-[420px] max-h-[680px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image — crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Image
            src={isMobile ? slide.mobileImage : slide.desktopImage}
            alt={`${slide.headline} ${slide.headlineAccent || ''}`}
            fill
            className="object-cover object-center"
            priority={slide.id === 1}
            quality={85}
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/55" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-5">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light mb-3 md:mb-5 tracking-tight leading-[1.1]">
              {slide.headline}{' '}
              {slide.headlineAccent && (
                <span className="italic">{slide.headlineAccent}</span>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg mb-6 md:mb-8 opacity-90 font-light max-w-lg mx-auto">
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href={slide.cta.href}
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white text-[#1A1A1A] font-medium rounded-full hover:bg-neutral-100 transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
              >
                <span>{slide.cta.label}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              {slide.ctaSecondary && (
                <Link
                  href={slide.ctaSecondary.href}
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 border-2 border-white/80 text-white font-medium rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-sm"
                >
                  <span>{slide.ctaSecondary.label}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows (desktop only) — minimal thin lines */}
      <button
        onClick={goPrev}
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center text-white/60 hover:text-white transition-all"
        aria-label="Previous slide"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="12 4 6 10 12 16" />
        </svg>
      </button>
      <button
        onClick={goNext}
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center text-white/60 hover:text-white transition-all"
        aria-label="Next slide"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 4 14 10 8 16" />
        </svg>
      </button>

      {/* Dot Indicators + Trust Line */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-3">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-7 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Trust Line */}
        <div className="flex items-center justify-center gap-2 text-white/60 text-[10px] sm:text-xs tracking-wide">
          <Sparkles className="w-3 h-3 text-pink-300" />
          <span>Anti-Tarnish · Skin-Safe</span>
          <span className="text-white/30">|</span>
          <span>Free Delivery Across India</span>
        </div>
      </div>
    </section>
  );
}
