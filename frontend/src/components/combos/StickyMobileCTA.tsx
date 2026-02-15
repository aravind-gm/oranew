'use client';

/**
 * StickyMobileCTA — Fixed bottom "Shop Combos" button on mobile
 *
 * Visible only on screens < md (768px).
 * Pink accent CTA, scrolls to combos grid.
 * Safe area padding for notched devices.
 */

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

export default function StickyMobileCTA() {
  const handleClick = () => {
    const el = document.getElementById('combos-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 md:hidden px-4 py-3"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #ECECF2',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        className="w-full py-3.5 rounded-full font-sans text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
        style={{
          background: '#E91E63',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(233,30,99,0.3)',
        }}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>Shop Combos — Buy 1 Get 1 Free</span>
      </motion.button>
    </div>
  );
}
