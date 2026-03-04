'use client';

/**
 * LuxuryTrustStrip — Clean Trust Icons
 *
 * White background. Icons inline:
 * • Gift Ready Packaging
 * • Easy Returns
 * • Free Shipping
 * • Premium Finish
 */

import { motion } from 'framer-motion';
import { Award, Gift, RefreshCw, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    id: 1,
    icon: Gift,
    title: 'Gift-Ready Packaging',
    description: 'Every order beautifully boxed',
  },
  {
    id: 2,
    icon: RefreshCw,
    title: '7-Day Easy Returns',
    description: 'No questions asked',
  },
  {
    id: 3,
    icon: Truck,
    title: 'Free Shipping',
    description: 'On all orders across India',
  },
  {
    id: 4,
    icon: Award,
    title: 'Premium Quality',
    description: 'Anti-tarnish & skin-safe',
  },
];

export default function LuxuryTrustStrip() {
  return (
    <section className="py-12 md:py-16 bg-[#FAFAF8] border-y border-neutral-100">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {TRUST_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-[#1A1A1A] shadow-sm">
                <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="text-sm md:text-base font-medium text-[#1A1A1A] mb-1">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-xs md:text-sm text-neutral-400">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
