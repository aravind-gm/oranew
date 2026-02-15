'use client';

/**
 * WhyBuyFromUs — "Why Choose ORA Combos?" section
 *
 * 4 value points:
 *   Curated Pairings  |  Better Value  |  Effortless Gifting  |  Contemporary Design
 *
 * Soft rose background (#F6E9EE), white cards, gold icons.
 * Honest copy focused on quality and value.
 */

import { motion } from 'framer-motion';
import { Sparkles, Heart, Gift, Star } from 'lucide-react';

const REASONS = [
  {
    title: 'Curated Pairings',
    description: 'Thoughtfully styled jewellery sets designed to complement each other beautifully.',
    icon: Sparkles,
  },
  {
    title: 'Better Value',
    description: 'Two coordinated pieces at a better combined value.',
    icon: Heart,
  },
  {
    title: 'Effortless Gifting',
    description: 'Perfect for birthdays, anniversaries, and meaningful moments.',
    icon: Gift,
  },
  {
    title: 'Contemporary Design',
    description: 'Modern styles crafted for everyday elegance.',
    icon: Star,
  },
];

export default function WhyBuyFromUs() {
  return (
    <section className="py-16 md:py-20" style={{ background: '#F6E9EE' }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="font-serif text-2xl md:text-3xl font-light tracking-tight"
            style={{ color: '#111111' }}
          >
            Why Choose ORA Combos?
          </h2>
          <div
            className="w-12 h-px mx-auto mt-3"
            style={{ background: '#C6A85B' }}
          />
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="rounded-2xl p-6 text-center transition-shadow duration-300 hover:shadow-lg"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(236,236,242,0.6)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'rgba(198,168,91,0.1)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: '#C6A85B' }}
                    strokeWidth={1.5}
                  />
                </div>
                <h3
                  className="font-serif text-base font-medium mb-2"
                  style={{ color: '#111111' }}
                >
                  {reason.title}
                </h3>
                <p
                  className="text-sm font-sans leading-relaxed"
                  style={{ color: '#7A7A85' }}
                >
                  {reason.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Emotional copy */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10 font-serif text-lg italic"
          style={{ color: '#7A7A85' }}
        >
          &ldquo;Perfect for birthdays, anniversaries &amp; surprise moments.&rdquo;
        </motion.p>
      </div>
    </section>
  );
}
