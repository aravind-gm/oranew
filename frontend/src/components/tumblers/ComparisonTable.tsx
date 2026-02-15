'use client';

/**
 * ComparisonTable — Side-by-side feature comparison
 * ===================================================
 * Classic Good–Better–Best pricing table with the middle
 * tier highlighted as "Most Popular".
 *
 * Marketing psychology:
 *  → Decoy / anchoring effect (₹3,099 makes ₹2,099 look like a steal)
 *  → Feature checkmarks create visual value stacking
 *  → "Most Popular" ribbon drives herd behavior
 *  → CTA per column removes decision friction
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShoppingBag, Star } from 'lucide-react';
import type { TumblerTier } from './TumblerShowcaseCard';

interface Feature {
  label: string;
  essential: boolean | string;
  popular: boolean | string;
  premium: boolean | string;
}

const FEATURES: Feature[] = [
  { label: 'Capacity',              essential: '40oz',        popular: '40oz',         premium: '40oz' },
  { label: 'Keeps Hot',             essential: '4 hours',     popular: '5 hours',      premium: '7 hours' },
  { label: 'Keeps Cold',            essential: '12 hours',    popular: '18 hours',     premium: '24 hours' },
  { label: 'Steel Thickness',       essential: 'Standard',    popular: 'Enhanced',     premium: 'Premium' },
  { label: 'Lid Mechanism',         essential: 'Standard Seal', popular: 'Improved Lock', premium: 'Magnetic Seal' },
  { label: 'Finish Type',           essential: 'Matte Powder', popular: 'Gloss Marble', premium: 'Floral + Gold' },
  { label: 'Straw Included',        essential: true,          popular: true,           premium: true },
  { label: 'Handle Included',       essential: true,          popular: true,           premium: true },
  { label: 'Packaging',             essential: 'Basic',       popular: 'Premium Sleeve', premium: 'Luxury Gift Box' },
  { label: 'BPA-Free',              essential: true,          popular: true,           premium: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-[#111111]">{value}</span>;
  }
  return value ? (
    <Check size={18} className="text-[#16A34A] mx-auto" />
  ) : (
    <X size={18} className="text-[#D1D5DB] mx-auto" />
  );
}

interface Props {
  tumblers: TumblerTier[];
  onAddToCart: (tumbler: TumblerTier) => void;
}

export default function ComparisonTable({ tumblers, onAddToCart }: Props) {
  const essential = tumblers.find((t) => t.tier === 'essential');
  const popular   = tumblers.find((t) => t.tier === 'popular');
  const premium   = tumblers.find((t) => t.tier === 'premium');

  if (!essential || !popular || !premium) return null;

  const columns = [essential, popular, premium];

  return (
    <section id="comparison-table" className="w-full bg-[#FAFAFA] py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#E75480' }}>
            Compare Editions
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#111111]">
            Progressive Performance. Premium Choices.
          </h2>
          <p className="mt-3 text-base text-neutral-600 max-w-2xl mx-auto">
            All three deliver 40oz capacity with increasing insulation performance as you move up tiers. Choose based on how long you need temperature retention.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Column headers */}
          <div className="grid grid-cols-4 border-b border-[#F3F4F6]">
            <div className="p-4 lg:p-6" />
            {columns.map((col) => (
              <div
                key={col.tier}
                className={`p-4 lg:p-6 text-center relative ${
                  col.tier === 'popular' ? 'bg-[#E91E63]/5' : ''
                }`}
              >
                {col.tier === 'popular' && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#E91E63] text-white text-[10px] font-bold uppercase tracking-wider rounded-b-lg">
                    Most Popular
                  </div>
                )}
                <p className="text-xs font-medium uppercase tracking-wider text-[#7A7A85] mt-4 lg:mt-0">
                  {col.tier === 'essential' ? 'Essential' : col.tier === 'popular' ? 'Popular' : 'Premium'}
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-[#111111] mt-1">
                  ₹{col.price.toLocaleString('en-IN')}
                </p>
                {col.originalPrice > col.price && (
                  <p className="text-xs text-[#9CA3AF] line-through mt-0.5">
                    ₹{col.originalPrice.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {FEATURES.map((feature, i) => (
            <div
              key={feature.label}
              className={`grid grid-cols-4 ${i < FEATURES.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
            >
              <div className="p-3 lg:p-4 flex items-center">
                <span className="text-sm text-[#555555]">{feature.label}</span>
              </div>
              {(['essential', 'popular', 'premium'] as const).map((tier) => (
                <div
                  key={tier}
                  className={`p-3 lg:p-4 flex items-center justify-center ${
                    tier === 'popular' ? 'bg-[#E91E63]/[0.02]' : ''
                  }`}
                >
                  <CellValue value={feature[tier]} />
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-4 border-t border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="p-4 lg:p-6" />
            {columns.map((col) => (
              <div
                key={col.tier}
                className={`p-4 lg:p-6 flex justify-center ${
                  col.tier === 'popular' ? 'bg-[#E91E63]/5' : ''
                }`}
              >
                <button
                  onClick={() => onAddToCart(col)}
                  className={`w-full max-w-[180px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] ${
                    col.tier === 'popular'
                      ? 'bg-[#E91E63] text-white hover:bg-[#C2185B] shadow-md'
                      : 'bg-[#111111] text-white hover:bg-[#333333]'
                  }`}
                >
                  <ShoppingBag size={16} />
                  Add to Bag
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
