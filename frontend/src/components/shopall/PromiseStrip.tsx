'use client';

/**
 * PromiseStrip — Quick trust strip for Shop All page
 * 
 * Horizontal strip with trust/promise items:
 *   Gift Wrapped · Fast Delivery · Easy Returns · Loved by Women
 * 
 * Admin-controllable: icon, text, enable/disable per item.
 */

import { PromiseStripConfig } from '@/store/shopAllCmsStore';
import { motion } from 'framer-motion';
import { Gift, Heart, RefreshCw, Shield, Truck, Star, Package, Sparkles } from 'lucide-react';

interface PromiseStripProps {
  config: PromiseStripConfig;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  gift: <Gift className="w-5 h-5" />,
  truck: <Truck className="w-5 h-5" />,
  refresh: <RefreshCw className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
};

export default function PromiseStrip({ config }: PromiseStripProps) {
  if (!config.enabled) return null;

  const activeItems = config.items.filter((item) => item.enabled);
  if (activeItems.length === 0) return null;

  return (
    <section className="py-6 md:py-8 bg-[#FFF7FA] border-y border-[#F8E8EE]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-center gap-6 md:gap-10 lg:gap-16 flex-wrap">
          {activeItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex items-center gap-2.5 text-neutral-700"
            >
              <span className="text-[#9B2C46] flex-shrink-0">
                {ICON_MAP[item.icon] || <Heart className="w-5 h-5" />}
              </span>
              <span className="text-xs md:text-sm font-medium tracking-wide whitespace-nowrap">
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
