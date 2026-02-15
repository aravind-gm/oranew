'use client';

/**
 * PriceTierSelector — 4 selectable pricing tier cards
 *
 * Tiers: ₹999, ₹1499, ₹1999, ₹2599
 * Each card shows tier name, price, and "You Save ₹X"
 * Active state: gold border + subtle gold bg
 * Clicking filters the products grid via bogoStore
 */

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useBogoStore } from '@/store/bogoStore';

export interface PriceTier {
  id: string;
  price: number;
  label: string;
  savings: number;
}

const TIERS: PriceTier[] = [
  { id: '999', price: 999, label: 'Everyday Essentials', savings: 999 },
  { id: '1499', price: 1499, label: 'Bestseller Duos', savings: 1499 },
  { id: '1999', price: 1999, label: 'Premium Picks', savings: 1999 },
  { id: '2599', price: 2599, label: 'Luxury Statement Sets', savings: 2599 },
];

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function PriceTierSelector() {
  const { selectedTier, setSelectedTier } = useBogoStore();

  return (
    <section className="py-14 md:py-18 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2
            className="font-serif text-2xl md:text-3xl font-light tracking-tight"
            style={{ color: '#111111' }}
          >
            Choose Your Perfect Combo
          </h2>
          <p
            className="text-sm font-sans mt-2 max-w-md mx-auto"
            style={{ color: '#7A7A85' }}
          >
            Select a price tier to build your BOGO combo
          </p>
          <div
            className="w-12 h-px mx-auto mt-3"
            style={{ background: '#C6A85B' }}
          />
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {TIERS.map((tier, index) => {
            const isActive = selectedTier === tier.price;
            return (
              <motion.button
                key={tier.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTier(tier.price)}
                className="relative rounded-2xl p-5 md:p-6 text-left transition-all duration-300 cursor-pointer group"
                style={{
                  background: isActive
                    ? 'rgba(198,168,91,0.06)'
                    : '#FFFFFF',
                  border: isActive
                    ? '2px solid #C6A85B'
                    : '1px solid #ECECF2',
                  boxShadow: isActive
                    ? '0 8px 24px rgba(198,168,91,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute -top-1.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-sans font-bold tracking-wider uppercase text-white"
                    style={{ background: '#C6A85B' }}
                  >
                    Selected
                  </div>
                )}

                {/* Price */}
                <div
                  className="font-serif text-2xl md:text-3xl font-semibold mb-1"
                  style={{ color: '#111111' }}
                >
                  {formatINR(tier.price)}
                </div>

                {/* Label */}
                <div
                  className="text-sm font-sans font-medium mb-3"
                  style={{ color: '#7A7A85' }}
                >
                  {tier.label}
                </div>

                {/* Savings */}
                <div
                  className="flex items-center gap-1 text-xs font-sans font-semibold"
                  style={{ color: '#C6A85B' }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>You Save {formatINR(tier.savings)}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Clear filter */}
        {/* No clear filter button for BOGO flow */}
      </div>
    </section>
  );
}
