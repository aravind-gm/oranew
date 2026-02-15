'use client';

/**
 * LuxuryTrustStrip — Centered horizontal trust/promise bar
 * 
 * Premium icon strip with gold accents:
 *   Gift Wrapped · Fast Delivery · Easy Returns · Loved by 50,000+ Women
 * 
 * Admin-controllable per item.
 */

import { PromiseStripConfig } from '@/store/shopAllCmsStore';
import { motion } from 'framer-motion';
import { 
  Gift, Heart, RefreshCw, Shield, Truck, Star, Package, Sparkles, 
  Clock, Award, BadgeCheck, Gem
} from 'lucide-react';

interface LuxuryTrustStripProps {
  config: PromiseStripConfig;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  gift: <Gift className="w-[18px] h-[18px]" />,
  truck: <Truck className="w-[18px] h-[18px]" />,
  refresh: <RefreshCw className="w-[18px] h-[18px]" />,
  heart: <Heart className="w-[18px] h-[18px]" />,
  shield: <Shield className="w-[18px] h-[18px]" />,
  star: <Star className="w-[18px] h-[18px]" />,
  package: <Package className="w-[18px] h-[18px]" />,
  sparkles: <Sparkles className="w-[18px] h-[18px]" />,
  clock: <Clock className="w-[18px] h-[18px]" />,
  award: <Award className="w-[18px] h-[18px]" />,
  badge: <BadgeCheck className="w-[18px] h-[18px]" />,
  gem: <Gem className="w-[18px] h-[18px]" />,
};

export default function LuxuryTrustStrip({ config }: LuxuryTrustStripProps) {
  if (!config.enabled) return null;

  const activeItems = config.items.filter((item) => item.enabled);
  if (activeItems.length === 0) return null;

  return (
    <section className="py-5 md:py-6 bg-gradient-to-r from-[#FFFBFD] via-[#FFF7FA] to-[#FFFBFD] border-y border-[#F3E8ED]">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 lg:gap-20 flex-wrap">
          {activeItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="flex items-center gap-2.5 group"
            >
              {/* Icon with gold accent */}
              <span className="text-[#D4AF37] transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                {ICON_MAP[item.icon] || <Heart className="w-[18px] h-[18px]" />}
              </span>
              {/* Separator dot (hidden on first) */}
              <span className="text-[11px] md:text-xs font-medium tracking-[0.04em] text-neutral-600 whitespace-nowrap">
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
