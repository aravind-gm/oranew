'use client';

/**
 * HowItWorks — 3-step horizontal section
 *
 * Premium, minimal. Gold numbered circles.
 * White background, connecting line on desktop.
 * Mobile: vertical accordion-style.
 */

import { motion } from 'framer-motion';
import { MousePointerClick, ShoppingBag, Gift } from 'lucide-react';

const STEPS = [
  {
    number: '1',
    title: 'Pick Your Combo',
    description: 'Browse curated combos in your budget — from ₹999 to ₹2,599.',
    icon: MousePointerClick,
  },
  {
    number: '2',
    title: 'Add to Bag',
    description: 'One click adds both pieces to your cart instantly.',
    icon: ShoppingBag,
  },
  {
    number: '3',
    title: 'Get 2 Pieces at 1 Price',
    description: 'Pay for one, receive both pieces as part of the combo offer.',
    icon: Gift,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
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
            How It Works
          </h2>
          <div
            className="w-12 h-px mx-auto mt-3"
            style={{ background: '#C6A85B' }}
          />
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 md:gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center flex-1 max-w-[260px] relative"
              >
                {/* Connecting line (desktop) */}
                {index < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-7 left-[calc(50%+36px)] h-px"
                    style={{
                      width: 'calc(100% - 32px)',
                      background:
                        'linear-gradient(to right, #C6A85B, rgba(198,168,91,0.2))',
                    }}
                  />
                )}

                {/* Number circle */}
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-md"
                  style={{
                    background:
                      'linear-gradient(135deg, #C6A85B 0%, #D4AF37 100%)',
                    boxShadow: '0 4px 16px rgba(198,168,91,0.25)',
                  }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                </div>

                {/* Title */}
                <h3
                  className="font-serif text-lg font-medium mb-1.5"
                  style={{ color: '#111111' }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm font-sans leading-relaxed"
                  style={{ color: '#7A7A85' }}
                >
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
