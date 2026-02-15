'use client';

/**
 * ComboFilterBar — Simplified filter pills for combos
 * 
 * Filters:
 *   All Combos | Under ₹1999 | Under ₹2999 | Premium
 *   Gift for Girlfriend | Gift for Wife | Anniversary | Birthday
 * 
 * Gold active pill. Horizontal scroll on mobile.
 */

import { CombosCmsConfig } from '@/store/comboStore';
import { motion } from 'framer-motion';

interface ComboFilterBarProps {
  config: CombosCmsConfig['filters'];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  totalResults: number;
}

export default function ComboFilterBar({
  config,
  activeFilter,
  onFilterChange,
  totalResults,
}: ComboFilterBarProps) {
  if (!config?.enabled) return null;

  const categories = config.categories?.filter((c) => c.enabled) || [];
  if (categories.length === 0) return null;

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
          {categories.map((cat) => {
            const isActive = activeFilter === cat.value;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => onFilterChange(cat.value)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-sans font-medium
                  transition-all duration-300 border whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-gold-400 text-white border-gold-400 shadow-md shadow-gold-400/20'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-gold-300 hover:text-gold-700'
                  }
                `}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Result count */}
        <div className="text-center mt-4">
          <span className="text-xs text-neutral-400 font-sans tracking-wide uppercase">
            {totalResults} {totalResults === 1 ? 'combo' : 'combos'} found
          </span>
        </div>
      </div>
    </div>
  );
}
