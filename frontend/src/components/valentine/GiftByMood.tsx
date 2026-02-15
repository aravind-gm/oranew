'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * GiftByMood — Emotional decision-making cards
 * ORA Valentine's Special | Production-ready
 *
 * ▸ 4 mood-based cards replace old price-tier cards
 * ▸ Each links to a filtered collection
 * ▸ Soft gradient backgrounds
 * ▸ Editorial typography
 * ▸ Hover lift with shadow bloom
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Gem, Heart, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import styles from './valentine.module.css';

/* ─── Types ─── */
interface MoodCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}

interface GiftByMoodProps {
  moods?: MoodCard[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_MOODS: MoodCard[] = [
  {
    title: 'Soft Romance',
    description: 'Delicate jewellery for tender moments.',
    href: '/collections/valentine?mood=soft-romance',
    icon: <Heart className="w-6 h-6" />,
    gradient: 'from-rose-50 via-pink-50 to-white',
  },
  {
    title: 'Bold Love',
    description: 'Statement pieces that turn heads.',
    href: '/collections/valentine?mood=bold-love',
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-fuchsia-50 via-rose-50 to-white',
  },
  {
    title: 'Everyday Elegance',
    description: 'Minimal wear, maximum impact.',
    href: '/collections/valentine?mood=everyday-elegance',
    icon: <Gem className="w-6 h-6" />,
    gradient: 'from-amber-50 via-orange-50/30 to-white',
  },
  {
    title: 'Self-Love Essentials',
    description: 'Tumblers, basics & little luxuries.',
    href: '/collections/valentine?mood=self-love',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-violet-50 via-purple-50/30 to-white',
  },
];

function GiftByMood({
  moods = DEFAULT_MOODS,
  title = 'Gift by Mood',
  subtitle = 'Not sure what to get? Let the feeling guide you.',
}: GiftByMoodProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 bg-neutral-50/50" id="gift-by-mood" aria-label="Shop by mood">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase text-rose-600 font-medium">
            How Are You Feeling?
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-3 font-light">
            {title}
          </h2>
          <p className="text-neutral-400 mt-4 max-w-lg mx-auto text-base leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Mood cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {moods.map((mood, idx) => (
            <motion.div
              key={mood.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link href={mood.href} className="group block">
                <div className={`${styles.moodCard} bg-gradient-to-b ${mood.gradient}`}>
                  {/* Icon */}
                  <div className="text-rose-400 mb-5 transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
                    {mood.icon}
                  </div>

                  {/* Text */}
                  <h3 className="font-serif text-xl sm:text-2xl text-neutral-900 mb-2">
                    {mood.title}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    {mood.description}
                  </p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 tracking-wide uppercase transition-colors group-hover:text-rose-700">
                    Explore
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(GiftByMood);
