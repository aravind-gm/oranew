'use client';

/**
 * LuxuryHeroSection — Full-width immersive hero for Shop All page
 * 
 * Features:
 *   - Full-width gradient with floating animated hearts
 *   - Admin-editable heading, subheading, CTAs
 *   - Background image/video support
 *   - Elegant serif typography
 *   - Parallax-like depth effect
 */

import { HeroConfig } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';

interface LuxuryHeroSectionProps {
  config: HeroConfig;
}

// Floating heart component
function FloatingHeart({ 
  delay, 
  x, 
  y, 
  size, 
  opacity 
}: { 
  delay: number; 
  x: string; 
  y: string; 
  size: number; 
  opacity: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ opacity }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="currentColor"
        />
      </svg>
    </motion.div>
  );
}

export default function LuxuryHeroSection({ config }: LuxuryHeroSectionProps) {
  if (!config.enabled) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  const hasDesktopImage = config.desktopImage && config.desktopImage.length > 0;
  const hasMobileImage = config.mobileImage && config.mobileImage.length > 0;
  const hasVideo = config.videoUrl && config.videoUrl.length > 0;

  const scrollToProducts = () => {
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMood = () => {
    const el = document.getElementById('mood-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={containerRef} className="relative w-full min-h-[75vh] md:min-h-[85vh] overflow-hidden">
      {/* Background Layer */}
      <motion.div className="absolute inset-0" style={{ y: backgroundY }}>
        {hasVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-110"
            poster={hasDesktopImage ? normalizeImageUrl(config.desktopImage) : undefined}
          >
            <source src={config.videoUrl} type="video/mp4" />
          </video>
        ) : hasDesktopImage ? (
          <>
            <div className={`absolute inset-0 ${hasMobileImage ? 'hidden md:block' : ''}`}>
              <Image
                src={normalizeImageUrl(config.desktopImage)}
                alt={config.heading}
                fill
                priority
                className="object-cover scale-110"
                sizes="100vw"
              />
            </div>
            {hasMobileImage && (
              <div className="absolute inset-0 block md:hidden">
                <Image
                  src={normalizeImageUrl(config.mobileImage)}
                  alt={config.heading}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            )}
          </>
        ) : (
          /* Premium gradient fallback */
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF5F7] via-[#FFE8EF] to-[#FDD8E4]">
            {/* Ambient glow orbs */}
            <div className="absolute top-[10%] right-[15%] w-[300px] h-[300px] bg-[#F8C8DC]/25 rounded-full blur-[100px]" />
            <div className="absolute bottom-[15%] left-[10%] w-[400px] h-[400px] bg-[#E8B4B8]/20 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] left-[40%] w-[250px] h-[250px] bg-[#D4AF37]/8 rounded-full blur-[80px]" />
            <div className="absolute top-[20%] left-[60%] w-[200px] h-[200px] bg-[#FFD6E8]/30 rounded-full blur-[90px]" />
          </div>
        )}
      </motion.div>

      {/* Dark overlay for images/videos */}
      {(hasDesktopImage || hasVideo) && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(26,26,26,${config.overlayOpacity * 0.7}) 0%, rgba(26,26,26,${config.overlayOpacity}) 50%, rgba(26,26,26,${config.overlayOpacity * 0.8}) 100%)`,
          }}
        />
      )}

      {/* Floating Hearts (subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none text-[#E8B4B8]" aria-hidden="true">
        <FloatingHeart delay={0} x="8%" y="15%" size={18} opacity={0.12} />
        <FloatingHeart delay={1.5} x="85%" y="20%" size={24} opacity={0.08} />
        <FloatingHeart delay={3} x="20%" y="70%" size={16} opacity={0.1} />
        <FloatingHeart delay={2} x="75%" y="65%" size={20} opacity={0.07} />
        <FloatingHeart delay={4} x="45%" y="10%" size={14} opacity={0.09} />
        <FloatingHeart delay={1} x="60%" y="80%" size={22} opacity={0.06} />
        <FloatingHeart delay={2.5} x="35%" y="40%" size={12} opacity={0.08} />
        <FloatingHeart delay={3.5} x="92%" y="45%" size={16} opacity={0.07} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[75vh] md:min-h-[85vh] px-6">
        <div className="text-center max-w-3xl mx-auto">
          {/* Sparkle icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <Sparkles 
              size={20} 
              className={`mx-auto ${hasDesktopImage || hasVideo ? 'text-[#D4AF37]' : 'text-[#D4AF37]/70'}`} 
            />
          </motion.div>

          {/* Gold decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-8"
          />

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
            className={`font-serif text-5xl md:text-6xl lg:text-7xl font-light tracking-[-0.02em] leading-[1.1] mb-5 ${
              hasDesktopImage || hasVideo ? 'text-white' : 'text-[#1A1A1A]'
            }`}
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
          >
            {config.heading}
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className={`text-base md:text-lg lg:text-xl tracking-wide leading-relaxed mb-10 max-w-lg mx-auto font-light ${
              hasDesktopImage || hasVideo ? 'text-white/75' : 'text-neutral-500'
            }`}
          >
            {config.subheading}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Primary CTA */}
            <button
              onClick={scrollToProducts}
              className={`
                group inline-flex items-center gap-3 px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-medium
                rounded-full transition-all duration-500 hover:shadow-xl
                ${hasDesktopImage || hasVideo
                  ? 'bg-white text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-white'
                  : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37]'
                }
              `}
            >
              {config.ctaText}
              <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform duration-300" />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={scrollToMood}
              className={`
                inline-flex items-center gap-2 px-8 py-4 text-[11px] tracking-[0.25em] uppercase font-medium
                rounded-full transition-all duration-500 border
                ${hasDesktopImage || hasVideo
                  ? 'border-white/40 text-white hover:bg-white/10 hover:border-white/70'
                  : 'border-[#1A1A1A]/20 text-[#1A1A1A] hover:border-[#D4AF37] hover:text-[#D4AF37]'
                }
              `}
            >
              Filter by Mood
            </button>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className={`w-[1px] h-8 ${hasDesktopImage || hasVideo ? 'bg-white/30' : 'bg-[#D4AF37]/30'}`} />
      </motion.div>
    </section>
  );
}
