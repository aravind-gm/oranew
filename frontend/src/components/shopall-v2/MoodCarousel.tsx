'use client';

/**
 * MoodCarousel — Emotion-Based Filtering Section
 * 
 * Premium horizontal scrollable mood cards:
 *   Everyday Elegance · Date Night Glow · Minimal Chic · Statement Love
 * 
 * Clicking a card instantly filters products.
 * Admin-controllable: title, image, filter logic.
 */

import { MoodStripConfig, MoodItem } from '@/store/shopAllCmsStore';
import { normalizeImageUrl } from '@/lib/imageUrlHelper';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface MoodCarouselProps {
  config: MoodStripConfig;
  onMoodSelect?: (mood: MoodItem) => void;
  activeMood?: string | null;
}

// Luxury gradient fallbacks
const MOOD_THEMES = [
  { gradient: 'from-[#FFE8F0] via-[#FFD6E8] to-[#FECCD8]', accent: '#C2185B', emoji: '✨', label: 'Sparkle' },
  { gradient: 'from-[#FFF0E6] via-[#FFE4D6] to-[#FFD8C8]', accent: '#E65100', emoji: '🌙', label: 'Glow' },
  { gradient: 'from-[#F0F4FF] via-[#E8EEFF] to-[#DCE4FF]', accent: '#1565C0', emoji: '💎', label: 'Minimal' },
  { gradient: 'from-[#F5E6F5] via-[#EEDCEE] to-[#E6D0E6]', accent: '#7B1FA2', emoji: '💫', label: 'Bold' },
  { gradient: 'from-[#E8F5E9] via-[#DCF0DE] to-[#C8E6C9]', accent: '#2E7D32', emoji: '🌸', label: 'Fresh' },
];

export default function MoodCarousel({ config, onMoodSelect, activeMood }: MoodCarouselProps) {
  if (!config.enabled || config.items.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 400);
    }
  };

  return (
    <section id="mood-section" className="py-12 md:py-16 bg-white">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-medium mb-3">
            Curated for Every Moment
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-[-0.01em]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Shop by Mood
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </motion.div>

        {/* Carousel Container */}
        <div className="relative group/carousel">
          {/* Left Arrow */}
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-xl -ml-2 hidden md:flex border border-neutral-100"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-[#1A1A1A]" />
            </motion.button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-xl -mr-2 hidden md:flex border border-neutral-100"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-[#1A1A1A]" />
            </motion.button>
          )}

          {/* Cards */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-5 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {config.items.map((item, index) => {
              const hasImage = item.image && item.image.length > 0;
              const theme = MOOD_THEMES[index % MOOD_THEMES.length];
              const isActive = activeMood === item.id;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -4 }}
                  onClick={() => onMoodSelect?.(item)}
                  className={`snap-start flex-shrink-0 relative w-[220px] md:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden group/card cursor-pointer transition-all duration-500 ${
                    isActive 
                      ? 'ring-2 ring-[#D4AF37] ring-offset-2 shadow-xl' 
                      : 'hover:shadow-xl'
                  }`}
                >
                  {/* Background */}
                  {hasImage ? (
                    <Image
                      src={normalizeImageUrl(item.image)}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                      sizes="260px"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}>
                      {/* Decorative elements */}
                      <div className="absolute top-6 right-6 text-5xl opacity-20">{theme.emoji}</div>
                      <div className="absolute bottom-20 left-8 text-3xl opacity-10">{theme.emoji}</div>
                      {/* Ambient glow */}
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/70 via-[#1A1A1A]/20 to-transparent" />

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-[#D4AF37] rounded-full shadow-lg" />
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <h3 
                      className="font-serif text-xl md:text-[22px] font-medium text-white leading-snug mb-2"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/70 group-hover/card:text-white transition-colors duration-300">
                      <span className="text-[11px] tracking-[0.15em] uppercase font-medium">Explore</span>
                      <ArrowRight size={12} className="group-hover/card:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
