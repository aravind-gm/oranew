'use client';

import { motion } from 'framer-motion';

export default function JewelryBox({ onComplete }: { onComplete?: () => void }) {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onComplete}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        {/* Box body */}
        <rect x="10" y="28" width="60" height="44" rx="4" fill="#FDFBF7" stroke="#E75480" strokeWidth="2" />
        {/* Box lid */}
        <rect x="6" y="22" width="68" height="12" rx="3" fill="#F6C1CF" stroke="#E75480" strokeWidth="1.5" />
        {/* Ribbon vertical */}
        <line x1="40" y1="22" x2="40" y2="72" stroke="#E75480" strokeWidth="2" />
        {/* Ribbon horizontal */}
        <line x1="10" y1="50" x2="70" y2="50" stroke="#E75480" strokeWidth="2" />
        {/* Bow left */}
        <ellipse cx="34" cy="22" rx="8" ry="5" fill="#E75480" />
        {/* Bow right */}
        <ellipse cx="46" cy="22" rx="8" ry="5" fill="#E75480" />
        {/* Bow center */}
        <circle cx="40" cy="22" r="3" fill="#F6C1CF" />
        {/* ORA text */}
        <text x="40" y="45" textAnchor="middle" fill="#E75480" fontSize="10" fontWeight="700" fontFamily="serif">
          ORA
        </text>
        {/* Sparkle */}
        <circle cx="64" cy="18" r="2" fill="#C6A85B" opacity="0.8" />
        <circle cx="16" cy="30" r="1.5" fill="#C6A85B" opacity="0.6" />
      </svg>
    </motion.div>
  );
}
