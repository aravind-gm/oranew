'use client';

import { motion } from 'framer-motion';

export default function Truck() {
  return (
    <svg width="220" height="100" viewBox="0 0 220 100" fill="none">
      {/* Cargo body */}
      <rect x="0" y="12" width="120" height="56" rx="5" fill="#F6C1CF" />
      {/* Cargo body highlight */}
      <rect x="3" y="14" width="114" height="8" rx="3" fill="white" opacity="0.2" />
      {/* Cargo bottom accent */}
      <rect x="0" y="62" width="120" height="6" rx="2" fill="#E75480" />

      {/* ORA branding on cargo */}
      <text x="60" y="40" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="serif" letterSpacing="4">
        ORA
      </text>
      <text x="60" y="52" textAnchor="middle" fill="white" fontSize="6" fontWeight="400" fontFamily="sans-serif" letterSpacing="2" opacity="0.7">
        JEWELLERY
      </text>

      {/* Cargo door */}
      <line x1="1" y1="28" x2="1" y2="64" stroke="#E75480" strokeWidth="1.5" />
      <rect x="3" y="38" width="3" height="10" rx="1.5" fill="#E75480" opacity="0.5" />

      {/* Cabin */}
      <path d="M120 22 L120 68 L180 68 L192 48 L180 22 Z" fill="#E75480" />
      {/* Windshield */}
      <path d="M124 26 L176 26 L186 46 L124 46 Z" fill="#E0F2FE" opacity="0.7" />
      {/* Windshield glare */}
      <path d="M128 30 L148 30 L144 42 L126 42 Z" fill="white" opacity="0.4" />
      {/* Windshield divider */}
      <line x1="153" y1="26" x2="160" y2="46" stroke="#C0396B" strokeWidth="0.8" opacity="0.4" />

      {/* Side mirror */}
      <rect x="188" y="34" width="8" height="4" rx="2" fill="#F6C1CF" />

      {/* Headlight */}
      <rect x="188" y="50" width="8" height="6" rx="3" fill="#FDE68A" opacity="0.9" />
      {/* Tail light */}
      <rect x="-2" y="52" width="4" height="8" rx="2" fill="#EF4444" opacity="0.7" />

      {/* Front bumper */}
      <rect x="186" y="56" width="12" height="12" rx="3" fill="#6B7280" />
      {/* Grill */}
      <rect x="188" y="54" width="8" height="2" rx="1" fill="#4B5563" />

      {/* Rear wheel */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '36px 78px' }}
      >
        <circle cx="36" cy="78" r="12" fill="#1F2937" />
        <circle cx="36" cy="78" r="8" fill="#374151" />
        <circle cx="36" cy="78" r="4" fill="#6B7280" />
        <circle cx="36" cy="78" r="2" fill="#9CA3AF" />
        <line x1="36" y1="67" x2="36" y2="89" stroke="#9CA3AF" strokeWidth="0.8" />
        <line x1="25" y1="78" x2="47" y2="78" stroke="#9CA3AF" strokeWidth="0.8" />
      </motion.g>

      {/* Middle wheel */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '86px 78px' }}
      >
        <circle cx="86" cy="78" r="12" fill="#1F2937" />
        <circle cx="86" cy="78" r="8" fill="#374151" />
        <circle cx="86" cy="78" r="4" fill="#6B7280" />
        <circle cx="86" cy="78" r="2" fill="#9CA3AF" />
        <line x1="86" y1="67" x2="86" y2="89" stroke="#9CA3AF" strokeWidth="0.8" />
        <line x1="75" y1="78" x2="97" y2="78" stroke="#9CA3AF" strokeWidth="0.8" />
      </motion.g>

      {/* Front wheel */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '162px 78px' }}
      >
        <circle cx="162" cy="78" r="12" fill="#1F2937" />
        <circle cx="162" cy="78" r="8" fill="#374151" />
        <circle cx="162" cy="78" r="4" fill="#6B7280" />
        <circle cx="162" cy="78" r="2" fill="#9CA3AF" />
        <line x1="162" y1="67" x2="162" y2="89" stroke="#9CA3AF" strokeWidth="0.8" />
        <line x1="151" y1="78" x2="173" y2="78" stroke="#9CA3AF" strokeWidth="0.8" />
      </motion.g>

      {/* Exhaust puff */}
      <motion.circle
        cx="-6"
        cy="64"
        r="5"
        fill="#D1D5DB"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.5, 2.5], x: [0, -15, -35] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
      />
      <motion.circle
        cx="-14"
        cy="58"
        r="3.5"
        fill="#D1D5DB"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.3, 0], scale: [0.3, 1.2, 2], x: [0, -10, -25] }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5, delay: 0.2 }}
      />
    </svg>
  );
}
