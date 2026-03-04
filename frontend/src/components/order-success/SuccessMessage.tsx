'use client';

import { motion } from 'framer-motion';

interface SuccessMessageProps {
  orderDisplayId: string;
}

export default function SuccessMessage({ orderDisplayId }: SuccessMessageProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Checkmark */}
      <motion.div
        className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <motion.path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </svg>
      </motion.div>

      {/* Message */}
      <motion.p
        className="text-lg sm:text-xl font-serif font-light text-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Your aura is on the way ✨
      </motion.p>

      {/* Order ID */}
      {orderDisplayId && (
        <motion.div
          className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-lg border border-pink-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 font-medium">
            Order ID
          </p>
          <p className="text-lg sm:text-xl font-mono font-bold text-[#E75480] break-all text-center">
            #{orderDisplayId}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
