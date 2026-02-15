'use client';

/**
 * HighlightedCollections — Category grid block
 * 
 * Grid of 3–4 cards (Earrings, Necklaces, Rings, Bracelets).
 * Each card: admin-uploaded image, title, short line, CTA.
 */

import { HighlightedCollectionsConfig } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HighlightedCollectionsProps {
  config: HighlightedCollectionsConfig;
}

// Category fallback icons
const CATEGORY_EMOJIS: Record<string, string> = {
  earrings: '✧',
  necklaces: '◇',
  rings: '○',
  bracelets: '∞',
  tumblers: '⊕',
};

const CATEGORY_COLORS = [
  { bg: 'from-[#FFF0F5] to-[#FFE4EF]', text: '#9B2C46' },
  { bg: 'from-[#F5F0EB] to-[#EDE6DD]', text: '#8B7355' },
  { bg: 'from-[#FFF5F0] to-[#FFE8DD]', text: '#9B5C46' },
  { bg: 'from-[#F0F0F5] to-[#E4E4EF]', text: '#5C5C8B' },
];

export default function HighlightedCollections({ config }: HighlightedCollectionsProps) {
  if (!config.enabled || config.items.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="w-10 h-px bg-[#D4AF37] mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#1A1A1A] tracking-tight">
            {config.heading}
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {config.items.map((item, index) => {
            const hasImage = item.image && item.image.length > 0;
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            const slug = item.title.toLowerCase().replace(/\s+/g, '-');
            const emoji = CATEGORY_EMOJIS[slug] || '◆';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={item.link}>
                  <div className="group relative overflow-hidden rounded-2xl cursor-pointer">
                    {/* Image or Fallback */}
                    <div className="relative aspect-[3/4]">
                      {hasImage ? (
                        <Image
                          src={normalizeImageUrl(item.image)}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${color.bg} flex items-center justify-center`}>
                          <span className="text-6xl md:text-7xl opacity-20 font-serif" style={{ color: color.text }}>
                            {emoji}
                          </span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/50 via-[#1A1A1A]/10 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      <h3 className="font-serif text-lg md:text-xl text-white font-medium mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs md:text-sm text-white/70 mb-3 line-clamp-1">
                        {item.subtitle}
                      </p>
                      <div className="flex items-center gap-1.5 text-white/80 group-hover:text-white transition-colors">
                        <span className="text-xs tracking-[0.15em] uppercase font-medium">
                          {item.ctaText}
                        </span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
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
