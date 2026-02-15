'use client';

/**
 * PromoBannerInsert — Promotional banner injected between product rows
 * 
 * A visually rich full-width banner that breaks up the product grid.
 * Admin sets: image, title, link, position (after every N products).
 */

import { PromoBanner } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PromoBannerInsertProps {
  banner: PromoBanner;
}

// Fallback gradients for promo banners without admin images
const PROMO_GRADIENTS = [
  { bg: 'from-[#FFF0F5] to-[#FFE4EF]', accent: '#9B2C46' },
  { bg: 'from-[#F5F0EB] to-[#E8DDD5]', accent: '#8B7355' },
  { bg: 'from-[#F0E6F0] to-[#E8D5E8]', accent: '#7B4B7B' },
];

export default function PromoBannerInsert({ banner }: PromoBannerInsertProps) {
  if (!banner.enabled) return null;

  const hasImage = banner.image && banner.image.length > 0;
  const gradientIdx = parseInt(banner.id) % PROMO_GRADIENTS.length;
  const gradient = PROMO_GRADIENTS[gradientIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="col-span-full my-6 md:my-10"
    >
      <Link href={banner.link || '/collections'}>
        <div className="relative w-full overflow-hidden rounded-2xl group cursor-pointer">
          {hasImage ? (
            /* Admin-uploaded banner image */
            <div className="relative aspect-[4/1] md:aspect-[5/1]">
              <Image
                src={normalizeImageUrl(banner.image)}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
              {/* Overlay with title */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/40 via-transparent to-transparent flex items-center px-8 md:px-14">
                <div>
                  <h3 className="font-serif text-xl md:text-2xl lg:text-3xl text-white font-light">
                    {banner.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-white/80 group-hover:text-white transition-colors">
                    <span className="text-xs md:text-sm tracking-wide">Shop Now</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Gradient fallback with text */
            <div className={`relative aspect-[4/1] md:aspect-[6/1] bg-gradient-to-r ${gradient.bg} flex items-center justify-between px-8 md:px-14`}>
              {/* Decorative circles */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute right-32 top-1/4 w-20 h-20 rounded-full bg-white/15 blur-xl" />

              <div className="relative z-10">
                <h3
                  className="font-serif text-xl md:text-2xl lg:text-3xl font-light"
                  style={{ color: gradient.accent }}
                >
                  {banner.title}
                </h3>
                <div
                  className="flex items-center gap-2 mt-2 group-hover:gap-3 transition-all"
                  style={{ color: gradient.accent }}
                >
                  <span className="text-xs md:text-sm tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                    Explore Collection
                  </span>
                  <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Decorative sparkle */}
              <div className="hidden md:block text-5xl opacity-20 mr-10">✨</div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
