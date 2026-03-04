'use client';

import { motion } from 'framer-motion';

export default function DeliveryPackage() {
  return (
    <motion.div className="flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        {/* Package body */}
        <rect x="6" y="12" width="44" height="36" rx="3" fill="#FDFBF7" stroke="#E75480" strokeWidth="2" />
        {/* Package lid */}
        <rect x="4" y="8" width="48" height="8" rx="2" fill="#F6C1CF" stroke="#E75480" strokeWidth="1.5" />
        {/* Tape vertical */}
        <rect x="24" y="8" width="8" height="40" rx="1" fill="#E75480" opacity="0.3" />
        {/* ORA branding */}
        <text x="28" y="34" textAnchor="middle" fill="#E75480" fontSize="9" fontWeight="800" fontFamily="serif">
          ORA
        </text>
        {/* Handle dots */}
        <circle cx="18" cy="12" r="1.5" fill="#C6A85B" />
        <circle cx="38" cy="12" r="1.5" fill="#C6A85B" />
      </svg>
    </motion.div>
  );
}
