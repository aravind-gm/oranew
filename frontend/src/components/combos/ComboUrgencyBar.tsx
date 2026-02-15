'use client';

/**
 * ComboUrgencyBar — Social proof + scarcity above the product grid
 * 
 * "⚡ 312 combos sold this week"
 * "🔥 18 left at this price"
 * 
 * Admin toggle. Pulls live stats when available.
 */

import { CombosCmsConfig, ComboStats } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Zap } from 'lucide-react';

interface ComboUrgencyBarProps {
  config: CombosCmsConfig['urgencyBar'];
  stats?: ComboStats | null;
}

export default function ComboUrgencyBar({ config, stats }: ComboUrgencyBarProps) {
  if (!config?.enabled) return null;

  const soldCount = stats?.totalSold || config.soldThisWeek || 0;
  const leftCount = config.leftAtPrice || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 py-3 px-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
        {/* Sold count */}
        {soldCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-gold-400" />
            <span className="text-white/90 font-sans">
              <span className="font-semibold text-gold-400">{soldCount.toLocaleString('en-IN')}</span> combos sold this week
            </span>
          </div>
        )}

        {/* Divider */}
        {soldCount > 0 && leftCount > 0 && (
          <div className="hidden sm:block w-px h-4 bg-white/20" />
        )}

        {/* Left at price */}
        {leftCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-primary-400" />
            <span className="text-white/90 font-sans">
              <span className="font-semibold text-primary-400">{leftCount}</span> left at this price
            </span>
          </div>
        )}

        {/* Custom message */}
        {config.customMessage && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-white/90 font-sans">{config.customMessage}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
