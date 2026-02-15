'use client';

/**
 * MoodStoryStrip — "Shop by Mood / Story" horizontal scroll
 * 
 * Scrollable cards: "Everyday Elegance", "Date Night Glow", etc.
 * Each card links to a filtered collection or curated page.
 * 
 * Admin-controllable: title, image, link/filter rule.
 */

import { MoodStripConfig } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MoodStoryStripProps {
  config: MoodStripConfig;
}

// Fallback gradients for cards without admin images
const CARD_GRADIENTS = [
  'from-[#FFE4EF] to-[#FFF0F5]',
  'from-[#FDDDE6] to-[#FFE8F0]',
  'from-[#F8E8EE] to-[#FFF5F8]',
  'from-[#E8D5DC] to-[#F5E6EB]',
  'from-[#F0E0E8] to-[#FFF0F5]',
];

// Fallback icons for cards without images
const CARD_EMOJIS = ['✨', '🌙', '💎', '💫', '🌸'];

export default function MoodStoryStrip({ config }: MoodStoryStripProps) {
  if (!config.enabled || config.items.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-[#9B2C46] font-medium mb-2">
            Curated for You
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-[#1A1A1A]">
            Shop by Mood
          </h2>
        </motion.div>

        {/* Scroll Container */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white -ml-3 hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} className="text-[#1A1A1A]" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white -mr-3 hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-[#1A1A1A]" />
          </button>

          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {config.items.map((item, index) => {
              const hasImage = item.image && item.image.length > 0;
              const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              const emoji = CARD_EMOJIS[index % CARD_EMOJIS.length];

              return (
                <Link
                  key={item.id}
                  href={item.filterOrLink}
                  className="snap-start flex-shrink-0"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative w-[200px] md:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden group/card cursor-pointer"
                  >
                    {/* Background */}
                    {hasImage ? (
                      <Image
                        src={normalizeImageUrl(item.image)}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                        sizes="240px"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <span className="text-5xl opacity-40">{emoji}</span>
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 via-transparent to-transparent" />

                    {/* Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-serif text-lg font-medium text-white leading-snug">
                        {item.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 text-white/80 group-hover/card:text-white transition-colors">
                        <span className="text-xs tracking-wide">Shop Now</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
