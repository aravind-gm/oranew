'use client';

/**
 * LuxuryHighlightedCollections — Premium category grid
 * 
 * Beautiful card grid for category highlights.
 * Admin-controllable: image, title, subtitle, CTA, link.
 */

import { HighlightedCollectionsConfig } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LuxuryHighlightedCollectionsProps {
  config: HighlightedCollectionsConfig;
}

const CATEGORY_THEMES = [
  { gradient: 'from-[#F5F0EB] to-[#E4D8CC]', accent: '#8B7355' },
  { gradient: 'from-[#F0ECE8] to-[#DED4C8]', accent: '#9B8B75' },
  { gradient: 'from-[#EEE9E4] to-[#DCD0C2]', accent: '#A08968' },
  { gradient: 'from-[#F2EDE8] to-[#E0D6CA]', accent: '#8C7A60' },
];

export default function LuxuryHighlightedCollections({ config }: LuxuryHighlightedCollectionsProps) {
  if (!config.enabled || config.items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#FAFAF9]">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-5" />
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-[42px] font-light text-[#1A1A1A] tracking-[-0.01em]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {config.heading}
          </h2>
          <p className="mt-3 text-sm text-neutral-400 max-w-md mx-auto">
            Curated categories to help you find exactly what you&apos;re looking for
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {config.items.map((item, index) => {
            const hasImage = item.image && item.image.length > 0;
            const theme = CATEGORY_THEMES[index % CATEGORY_THEMES.length];

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={item.link}>
                  <div className="group relative overflow-hidden rounded-2xl cursor-pointer transition-shadow duration-500 hover:shadow-2xl">
                    <div className="relative aspect-[3/4]">
                      {hasImage ? (
                        <Image
                          src={normalizeImageUrl(item.image)}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-[100px] md:text-[120px] opacity-[0.06] font-serif font-light" style={{ color: theme.accent }}>
                              {item.title.charAt(0)}
                            </div>
                          </div>
                          {/* Subtle corner accent */}
                          <div className="absolute top-6 right-6 w-12 h-[1px] bg-black/8" />
                          <div className="absolute top-6 right-6 w-[1px] h-12 bg-black/8" />
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 via-[#1A1A1A]/10 to-transparent transition-opacity duration-500 group-hover:from-[#1A1A1A]/70" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                      <h3 
                        className="font-serif text-xl md:text-2xl text-white font-medium mb-1 leading-tight"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-[11px] md:text-xs text-white/60 mb-3 line-clamp-1">
                        {item.subtitle}
                      </p>
                      <div className="flex items-center gap-1.5 text-white/70 group-hover:text-[#D4AF37] transition-colors duration-300">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">
                          {item.ctaText}
                        </span>
                        <ArrowRight size={12} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Hover border */}
                    <div className="absolute inset-0 rounded-2xl ring-0 ring-[#D4AF37]/0 group-hover:ring-1 group-hover:ring-[#D4AF37]/20 transition-all duration-500 pointer-events-none" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
