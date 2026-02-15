'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * TrustStrip — Trust signals only
 * ORA Valentine's Special | Production-ready
 *
 * ▸ 4 trust badges with editorial spacing
 * ▸ "Premium Quality"
 * ▸ Newsletter removed (global Footer already has it)
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Gift, Heart, RefreshCw, Truck } from 'lucide-react';
import { memo } from 'react';
import styles from './valentine.module.css';

const TRUST_ITEMS = [
  {
    icon: <Gift className="w-5 h-5 text-rose-500" />,
    title: 'Gift Wrapped',
    description: 'Every order wrapped with love & a personal note',
  },
  {
    icon: <Truck className="w-5 h-5 text-rose-500" />,
    title: 'Fast Delivery',
    description: 'Delivered before Valentine\u2019s Day, guaranteed',
  },
  {
    icon: <RefreshCw className="w-5 h-5 text-rose-500" />,
    title: 'Easy Returns',
    description: '7-day hassle-free returns on all orders',
  },
  {
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    title: 'Premium Quality',
    description: 'Trusted by women across India',
  },
] as const;

function TrustStrip() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="py-16 sm:py-20 bg-neutral-50 border-t border-neutral-100"
      aria-label="Trust signals"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {TRUST_ITEMS.map((item, idx) => (
            <motion.div
              key={idx}
              className="text-center"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className={`${styles.trustIcon} mx-auto mb-4`} aria-hidden="true">
                {item.icon}
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-1">{item.title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(TrustStrip);
