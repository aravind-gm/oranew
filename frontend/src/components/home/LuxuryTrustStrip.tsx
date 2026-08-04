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
    title: '5-Day Easy Returns',
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
    <section className="bg-[#0F0F14] border-y border-[#C6A85B]/15">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#C6A85B]/10">
          {TRUST_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="flex flex-col items-center text-center gap-1.5 py-4 px-4 md:px-6"
            >
              <div className="w-10 h-10 rounded-full border border-[#C6A85B]/25 bg-[#C6A85B]/8 flex items-center justify-center text-[#C6A85B]">
                <item.icon className="w-4.5 h-4.5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-white/90 leading-tight">
                {item.title}
              </h3>
              <p className="text-[10px] md:text-xs text-neutral-500 leading-snug">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
