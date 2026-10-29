'use client';

/**
 * CategoryQuickLinks — Refined category shortcut bar below the hero banner.
 * Clean, text-only luxury styling with restrained gold highlight for Free Ring Offer.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';

interface QuickLinkItem {
  label: string;
  href: string;
  isSpecial?: boolean;
}

const CATEGORIES: QuickLinkItem[] = [
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Necklaces',   href: '/collections?category=necklaces' },
  { label: 'Rings',       href: '/collections?category=rings' },
  { label: 'Bracelets',   href: '/collections?category=bracelets' },
  { label: 'Tumblers',    href: '/collections/tumblers' },
  { label: 'Gifts for Her', href: '/collections/gifts-for-her' },
  { label: 'Free Ring Offer', href: '/collections/combos', isSpecial: true },
];

export default function CategoryQuickLinks() {
  return (
    <section aria-label="Category shortcuts" className="bg-white border-b border-neutral-200/80 py-3.5 md:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Mobile: horizontal scroll without scrollbar. Desktop: single centered row without wrapping */}
        <nav
          className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide md:justify-center md:flex-nowrap py-1 -my-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.href}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              className="flex-shrink-0"
            >
              <Link
                href={cat.href}
                className={`inline-flex items-center justify-center rounded-md border px-5 py-2.5 md:px-6 md:py-2.5 text-sm md:text-[15px] font-medium whitespace-nowrap transition-all duration-200 ${
                  cat.isSpecial
                    ? 'border-[#C6A85B] bg-[#C6A85B]/[0.06] text-[#8B6914] hover:bg-[#C6A85B]/[0.12] hover:border-[#B59648] hover:text-[#70520E] shadow-[0_1px_2px_rgba(198,168,91,0.06)]'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                }`}
              >
                {cat.label}
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>
    </section>
  );
}

