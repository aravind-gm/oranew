'use client';

/**
 * VideoReelStrip — Instagram-Style Engagement Strip
 * 
 * Purpose: Social-media-like engagement loop within the page.
 * UX: Horizontal auto-scrolling strip of video/image cards
 *      with overlay text. Hover pauses auto-scroll.
 * Motion: Continuous marquee-style scroll, pause on hover.
 * Mobile: Touch-swipeable, same auto-scroll behavior.
 * Performance: Videos lazy-loaded, use poster images.
 */

import { motion, useMotionValue } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ReelItem {
  id: number;
  type: 'video' | 'image';
  src: string;
  poster?: string;
  overlayText: string;
}

interface VideoReelStripProps {
  heading?: string;
  reels?: ReelItem[];
}

const DEFAULT_REELS: ReelItem[] = [
  { id: 1, type: 'image', src: '/chain.jpeg', overlayText: 'Layer It Your Way' },
  { id: 2, type: 'image', src: '/ring.jpeg', overlayText: 'Styled Every Day' },
  { id: 3, type: 'image', src: '/bracelets.jpeg', overlayText: 'Made for Her' },
  { id: 4, type: 'image', src: '/banners.png', overlayText: 'Everyday Luxury' },
  { id: 5, type: 'image', src: '/chain.jpeg', overlayText: 'Radiate Confidence' },
  { id: 6, type: 'image', src: '/ring.jpeg', overlayText: 'Own Your Glow' },
  { id: 7, type: 'image', src: '/bracelets.jpeg', overlayText: 'Gift Her Something Special' },
  { id: 8, type: 'image', src: '/banners.png', overlayText: 'The ORA Feeling' },
];

export default function VideoReelStrip({
  heading = 'The ORA Life',
  reels = DEFAULT_REELS,
}: VideoReelStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Double the reels for seamless loop
  const displayReels = [...reels, ...reels];

  const animate = useCallback(() => {
    if (!containerRef.current || isPaused) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    scrollRef.current += 1.5;
    const container = containerRef.current;
    const halfWidth = container.scrollWidth / 2;

    if (scrollRef.current >= halfWidth) {
      scrollRef.current = 0;
    }

    container.style.transform = `translateX(-${scrollRef.current}px)`;
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isPaused]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate]);

  return (
    <section className="py-12 md:py-20 bg-[#1A1A1A] overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-12 px-5"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-white mb-2">
          {heading}
        </h2>
        <p className="text-sm text-neutral-400 tracking-[0.15em] uppercase">
          Stories · Style · Her
        </p>
      </motion.div>

      {/* Scrolling Strip */}
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          ref={containerRef}
          className="flex gap-4 will-change-transform"
          style={{ width: 'max-content' }}
        >
          {displayReels.map((reel, index) => (
            <div
              key={`${reel.id}-${index}`}
              className="relative flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] aspect-[9/16] rounded-2xl overflow-hidden group"
            >
              {reel.type === 'video' ? (
                <video
                  src={reel.src}
                  poster={reel.poster}
                  muted
                  loop
                  playsInline
                  autoPlay={!isPaused}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={reel.src}
                  alt={reel.overlayText}
                  fill
                  className="object-cover"
                  sizes="280px"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Overlay text */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm md:text-base font-serif italic">
                  &ldquo;{reel.overlayText}&rdquo;
                </p>
              </div>

              {/* Pause indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {isPaused ? (
                  <Play className="w-5 h-5 text-white/80" />
                ) : (
                  <Pause className="w-5 h-5 text-white/80" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
