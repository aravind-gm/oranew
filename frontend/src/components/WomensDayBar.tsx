'use client';

/**
 * WomensDayBar — Elegant top announcement bar for International Women's Day
 * 
 * Features:
 *  - Slim gradient bar above header
 *  - Animated text with sparkle
 *  - Dismissible with smooth collapse
 *  - Rose-gold / pink luxury theme
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WomensDayBar() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = sessionStorage.getItem('wd-bar-dismissed');
    if (dismissed) setVisible(false);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('wd-bar-dismissed', '1');
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative overflow-hidden z-[60]"
        >
          <div className="bg-gradient-to-r from-[#D4637A] via-[#E8889A] to-[#D4637A] text-white">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3 relative">
              {/* Animated flowers left */}
              <motion.span
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-base sm:text-lg hidden sm:inline"
              >
                🌸
              </motion.span>

              {/* Main text */}
              <div className="flex items-center gap-2 text-center">
                <Sparkles className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
                <p className="text-[11px] sm:text-xs md:text-sm font-medium tracking-wide">
                  <span className="hidden sm:inline">Celebrating </span>
                  <span className="font-bold">International Women&apos;s Day</span>
                  <span className="mx-1.5 text-white/50">·</span>
                  <span className="italic opacity-90">Here&apos;s to her — bold, beautiful, unstoppable</span>
                </p>
                <Sparkles className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
              </div>

              {/* Animated flowers right */}
              <motion.span
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="text-base sm:text-lg hidden sm:inline"
              >
                🌺
              </motion.span>

              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
