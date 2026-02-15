'use client';

/**
 * TrustStrip — 4 trust/value icons on white background
 *
 * Minimal outline icons, clean typography.
 * No gradients — white bg with subtle bottom border.
 */

import { motion } from 'framer-motion';
import { Shield, Gem, RotateCcw, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Truck, label: 'Free Delivery Across India' },
  { icon: RotateCcw, label: '5-Day Easy Returns' },
  { icon: Shield, label: 'Secure Checkout' },
  { icon: Gem, label: 'Premium Craftsmanship' },
];

export default function TrustStrip() {
  return (
    <section
      className="py-5 md:py-6"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #ECECF2',
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 md:gap-14">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(198,168,91,0.08)',
                    border: '1px solid rgba(198,168,91,0.2)',
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: '#C6A85B' }}
                    strokeWidth={1.5}
                  />
                </div>
                <span
                  className="text-xs sm:text-sm font-sans font-medium tracking-wide"
                  style={{ color: '#111111' }}
                >
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
