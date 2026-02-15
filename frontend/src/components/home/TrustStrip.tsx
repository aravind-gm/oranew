'use client';

/**
 * TrustStrip — Minimal Trust Icons
 * 
 * Only 4 items. No extra fluff.
 * Free Delivery Across India | 5-Day Easy Returns | Secure Checkout | Premium Craftsmanship
 */

import { motion } from 'framer-motion';
import { Lock, RefreshCw, Sparkles, Truck } from 'lucide-react';

interface TrustItem {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
  {
    id: 1,
    icon: <Truck className="w-5 h-5 md:w-6 md:h-6" />,
    title: 'Free Delivery Across India',
    description: 'No minimum order required',
  },
  {
    id: 2,
    icon: <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />,
    title: '5-Day Easy Returns',
    description: 'From date of delivery',
  },
  {
    id: 3,
    icon: <Lock className="w-5 h-5 md:w-6 md:h-6" />,
    title: 'Secure Checkout',
    description: 'Encrypted payment processing',
  },
  {
    id: 4,
    icon: <Sparkles className="w-5 h-5 md:w-6 md:h-6" />,
    title: 'Premium Craftsmanship',
    description: 'Thoughtfully designed pieces',
  },
];

export default function TrustStrip({ items = DEFAULT_ITEMS }: { items?: TrustItem[] }) {
  return (
    <section className="py-10 md:py-14 bg-oraLight border-y border-oraPink/30">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="text-center"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-700 border border-neutral-200">
                {item.icon}
              </div>
              <h3 className="text-xs md:text-sm font-medium text-neutral-800 mb-0.5">
                {item.title}
              </h3>
              <p className="text-[11px] md:text-xs text-oraAccent/70">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
