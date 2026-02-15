'use client';

/**
 * ShopAllHero — Full-width hero banner for the Shop All / All Jewellery page
 * 
 * Features:
 *   - Full-width hero with image or looping video
 *   - Soft pink overlay
 *   - Admin-editable heading, subheading, CTA
 *   - Mobile/Desktop image variants
 *   - Fallback gradient when no image is set
 */

import { HeroConfig } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface ShopAllHeroProps {
  config: HeroConfig;
}

export default function ShopAllHero({ config }: ShopAllHeroProps) {
  if (!config.enabled) return null;

  const hasDesktopImage = config.desktopImage && config.desktopImage.length > 0;
  const hasMobileImage = config.mobileImage && config.mobileImage.length > 0;
  const hasVideo = config.videoUrl && config.videoUrl.length > 0;

  const scrollToProducts = () => {
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh] overflow-hidden">
      {/* Background — Video / Image / Gradient fallback */}
      {hasVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={hasDesktopImage ? normalizeImageUrl(config.desktopImage) : undefined}
        >
          <source src={config.videoUrl} type="video/mp4" />
        </video>
      ) : hasDesktopImage ? (
        <>
          {/* Desktop image */}
          <div className={`absolute inset-0 ${hasMobileImage ? 'hidden md:block' : ''}`}>
            <Image
              src={normalizeImageUrl(config.desktopImage)}
              alt={config.heading}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          {/* Mobile image */}
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
        /* Beautiful gradient fallback when no admin image is uploaded */
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF0F5] via-[#FFE4EF] to-[#FDDDE6]">
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-[#F8C8DC]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-[#E8B4B8]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#1A1A1A]"
        style={{ opacity: hasDesktopImage || hasVideo ? config.overlayOpacity : 0 }}
      />

      {/* Soft pink tint overlay (always) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFB6C1]/10 via-transparent to-[#FFB6C1]/5" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh] px-6">
        <div className="text-center max-w-2xl mx-auto">
          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-16 h-px bg-[#D4AF37] mx-auto mb-6"
          />

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight mb-4 ${
              hasDesktopImage || hasVideo ? 'text-white' : 'text-[#1A1A1A]'
            }`}
          >
            {config.heading}
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className={`text-base md:text-lg tracking-wide leading-relaxed mb-8 max-w-md mx-auto ${
              hasDesktopImage || hasVideo ? 'text-white/80' : 'text-neutral-600'
            }`}
          >
            {config.subheading}
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            onClick={scrollToProducts}
            className={`
              inline-flex items-center gap-2 px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium
              rounded-full transition-all duration-300 hover:shadow-lg
              ${hasDesktopImage || hasVideo
                ? 'bg-white/90 text-[#1A1A1A] hover:bg-white backdrop-blur-sm'
                : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
              }
            `}
          >
            {config.ctaText}
            <ChevronDown size={14} className="animate-bounce" />
          </motion.button>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
