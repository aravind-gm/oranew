'use client';

/**
 * OfferTypeSelector — Refined selection filters
 * Categories: All, Under ₹1,499, Under ₹2,499, Gift Picks, Everyday Essentials
 * Baby pink theme, premium positioning
 * ORA Design System
 */

import { motion } from 'framer-motion';
import { Sparkles, Tag, Gift, Star, Heart } from 'lucide-react';

export type OfferType = '' | 'UNDER1499' | 'UNDER2499' | 'GIFTS' | 'ESSENTIALS';

interface OfferTypeSelectorProps {
  selected: OfferType;
  onChange: (type: OfferType) => void;
}

const OFFER_TYPES = [
  {
    value: '' as OfferType,
    label: 'All Selections',
    description: 'Browse all pieces',
    icon: Sparkles,
    color: '#E75480',
    bgColor: '#FFFFFF',
    borderColor: '#F6C1CF',
  },
  {
    value: 'UNDER1499' as OfferType,
    label: 'Under ₹1,499',
    description: 'Everyday luxury',
    icon: Tag,
    color: '#E75480',
    bgColor: 'rgba(231, 84, 128, 0.04)',
    borderColor: '#E75480',
  },
  {
    value: 'UNDER2499' as OfferType,
    label: 'Under ₹2,499',
    description: 'Statement styles',
    icon: Star,
    color: '#E75480',
    bgColor: 'rgba(231, 84, 128, 0.04)',
    borderColor: '#E75480',
  },
  {
    value: 'GIFTS' as OfferType,
    label: 'Gift Picks',
    description: 'Perfect for gifting',
    icon: Gift,
    color: '#C6A85B',
    bgColor: 'rgba(198, 168, 91, 0.04)',
    borderColor: '#C6A85B',
  },
  {
    value: 'ESSENTIALS' as OfferType,
    label: 'Everyday Essentials',
    description: 'Daily wear pieces',
    icon: Heart,
    color: '#E75480',
    bgColor: 'rgba(231, 84, 128, 0.04)',
    borderColor: '#E75480',
  },
];

export default function OfferTypeSelector({ selected, onChange }: OfferTypeSelectorProps) {
  return (
    <section className="py-6 border-b" style={{ borderColor: '#ECECF2' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {OFFER_TYPES.map((type, index) => {
            const isActive = selected === type.value;
            const Icon = type.icon;

            return (
              <motion.button
                key={type.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                onClick={() => onChange(type.value)}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-w-[160px] sm:min-w-[180px] text-left"
                style={{
                  borderColor: isActive ? type.borderColor : '#ECECF2',
                  backgroundColor: isActive ? type.bgColor : '#FFFFFF',
                  boxShadow: isActive ? `0 2px 12px ${type.borderColor}22` : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isActive
                      ? `${type.color}15`
                      : '#F6F6FA',
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? type.color : '#7A7A85',
                    }}
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{
                      color: isActive ? type.color : '#111111',
                    }}
                  >
                    {type.label}
                  </p>
                  <p
                    className="text-[11px] leading-tight mt-0.5"
                    style={{ color: '#7A7A85' }}
                  >
                    {type.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
