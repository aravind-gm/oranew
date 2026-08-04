'use client';

/**
 * CategoryQuickLinks — GIVA-style horizontal scroll category pills below the hero.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { label: 'New Arrivals', href: '/collections/new-arrivals', emoji: '✨' },
  { label: 'Necklaces',   href: '/collections/necklaces',    emoji: '📿' },
  { label: 'Rings',       href: '/collections/rings',        emoji: '💍' },
  { label: 'Bracelets',   href: '/collections/bracelets',    emoji: '⌚' },
  { label: 'Gifts for Her', href: '/collections/gifts-for-her', emoji: '🎁' },
  { label: 'Free Ring Offer', href: '/collections/combos',   emoji: '🔖' },
];

export default function CategoryQuickLinks() {
  return (
    <section className="bg-white border-b border-neutral-100 py-3 md:py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Scrollable on mobile, centered row on desktop */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide md:justify-center md:flex-wrap">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="flex-shrink-0"
            >
              <Link
                href={cat.href}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200
                  ${cat.label === 'Free Ring Offer'
                    ? 'border-[#C6A85B] bg-[#C6A85B]/8 text-[#8B6914] hover:bg-[#C6A85B] hover:text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#C6A85B] hover:text-[#8B6914] hover:bg-[#FFF9EE]'
                  }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
