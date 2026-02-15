'use client';

/**
 * LuxuryPromoBanner — Mid-grid promotional banner insertion
 * 
 * Full-width banner injected between product rows.
 * Admin-controllable: image, text, CTA, link, position, toggle.
 */

import { PromoBanner } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LuxuryPromoBannerProps {
  banner: PromoBanner;
}

const PROMO_THEMES = [
  { gradient: 'from-[#FFF5F7] via-[#FFE8EF] to-[#FDD8E4]', accent: '#C2185B', glow: '#F8C8DC' },
  { gradient: 'from-[#FFF8F0] via-[#FFE8D6] to-[#FFD8C4]', accent: '#D4AF37', glow: '#F5E6D0' },
  { gradient: 'from-[#F5F0FF] via-[#EDE4FF] to-[#E0D4FF]', accent: '#6A1B9A', glow: '#D8C8E8' },
];

export default function LuxuryPromoBanner({ banner }: LuxuryPromoBannerProps) {
  if (!banner.enabled) return null;

  const hasImage = banner.image && banner.image.length > 0;
  const themeIdx = parseInt(banner.id) % PROMO_THEMES.length;
  const theme = PROMO_THEMES[themeIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="col-span-full my-4 md:my-8"
    >
      <Link href={banner.link || '/collections'}>
        <div className="relative w-full overflow-hidden rounded-2xl group cursor-pointer transition-shadow duration-500 hover:shadow-2xl">
          {hasImage ? (
            <div className="relative aspect-[3.5/1] md:aspect-[5/1]">
              <Image
                src={normalizeImageUrl(banner.image)}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 1400px"
              />
              {/* Premium overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/50 via-[#1A1A1A]/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center px-8 md:px-14">
                <div>
                  <h3 
                    className="font-serif text-xl md:text-2xl lg:text-3xl text-white font-light leading-tight max-w-[400px]"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {banner.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-white/80 group-hover:text-white transition-colors duration-300">
                    <span className="text-[11px] tracking-[0.15em] uppercase font-medium">Shop Now</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Gradient fallback */
            <div className={`relative aspect-[3.5/1] md:aspect-[6/1] bg-gradient-to-r ${theme.gradient} flex items-center justify-between px-8 md:px-14 overflow-hidden`}>
              {/* Ambient glow */}
              <div 
                className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full blur-[80px] opacity-40"
                style={{ backgroundColor: theme.glow }}
              />
              <div 
                className="absolute right-[30%] top-[20%] w-[120px] h-[120px] rounded-full blur-[60px] opacity-25"
                style={{ backgroundColor: theme.glow }}
              />

              <div className="relative z-10 max-w-[60%]">
                <h3
                  className="font-serif text-xl md:text-2xl lg:text-3xl font-light leading-tight"
                  style={{ color: theme.accent, fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {banner.title}
                </h3>
                <div
                  className="flex items-center gap-2 mt-3 group-hover:gap-3 transition-all duration-300"
                  style={{ color: theme.accent }}
                >
                  <span className="text-[11px] tracking-[0.15em] uppercase font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                    Explore Collection
                  </span>
                  <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>

              {/* Decorative element */}
              <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 text-6xl opacity-10" style={{ color: theme.accent }}>
                ✦
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
