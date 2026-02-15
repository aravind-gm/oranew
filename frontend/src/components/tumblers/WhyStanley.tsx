'use client';

/**
 * WhyStanley — Visual USP / trust section
 * ========================================
 * Icon grid showing key product benefits.
 * Sits between the showcase cards and comparison table.
 *
 * Marketing: Feature-based value stacking —
 * makes the price feel justified before the comparison table.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ThermometerSun,
  Droplets,
  Shield,
  Leaf,
  Sparkles,
  Gift,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: <ThermometerSun size={28} />,
    title: 'Temperature Lock',
    desc: '4-7 hours hot, 12-24 hours cold across editions.',
    color: '#E75480',
  },
  {
    icon: <Droplets size={28} />,
    title: 'Leak-Proof Design',
    desc: 'Sealed lids prevent spills when properly closed.',
    color: '#E75480',
  },
  {
    icon: <Shield size={28} />,
    title: 'BPA-Free & Safe',
    desc: 'Food-grade stainless steel with BPA-free components.',
    color: '#E75480',
  },
  {
    icon: <Leaf size={28} />,
    title: 'Eco-Friendly',
    desc: 'Reusable design reduces single-use plastic waste.',
    color: '#E75480',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'Premium Finish',
    desc: 'Choose from matte, gloss marble, or floral gold finishes.',
    color: '#E75480',
  },
  {
    icon: <Gift size={28} />,
    title: 'Gift-Ready',
    desc: 'Floral Gift Edition includes luxury gift box packaging.',
    color: '#E75480',
  },
];

export default function WhyStanley() {
  return (
    <section className="w-full bg-[#0F0F14] py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#E75480' }}>
            Why Choose ORA Tumblers?
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
            Quality That Keeps. <span style={{ color: '#E75480' }}>Style That Speaks.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${b.color}20`, color: b.color }}
              >
                {b.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">{b.title}</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
