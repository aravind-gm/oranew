'use client';

/**
 * ComboValueStrip — 4 premium icons explaining the BOGO value proposition
 * 
 * 💝 Premium Quality
 * 💎 2 Pieces. 1 Price.
 * 🔄 Easy Returns
 * 🚚 Free Shipping
 * 
 * Gold icons. Blush background. Centered. Premium feel.
 */

import { CombosCmsConfig } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { Gift, Gem, RefreshCw, Truck, Heart, Shield, Star, Package } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  gift: Gift,
  gem: Gem,
  refresh: RefreshCw,
  truck: Truck,
  heart: Heart,
  shield: Shield,
  star: Star,
  package: Package,
};

interface ComboValueStripProps {
  config: CombosCmsConfig['valueStrip'];
}

export default function ComboValueStrip({ config }: ComboValueStripProps) {
  if (!config?.enabled) return null;

  const items = config.items?.filter((i) => i.enabled) || [];
  if (items.length === 0) return null;

  return (
    <section className="relative bg-gradient-to-r from-primary-50/40 via-gold-50/30 to-primary-50/40 py-6 border-y border-gold-100/40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {items.map((item, index) => {
            const IconComponent = ICON_MAP[item.icon] || Gift;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gold-100/60 border border-gold-200/40 flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-gold-600" />
                </div>
                <span className="text-xs sm:text-sm font-sans font-medium text-neutral-700 tracking-wide">
                  {item.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
