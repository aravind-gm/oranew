'use client';

/**
 * ComboHowItWorks — 3-step trust builder
 * 
 * 1️⃣ Pick Your Combo
 * 2️⃣ Add to Bag
 * 3️⃣ Get 2 Pieces at 1 Price
 * 
 * Premium gold numbered circles, connecting lines, cream background.
 */

import { CombosCmsConfig } from '@/store/comboStore';
import { motion } from 'framer-motion';

interface ComboHowItWorksProps {
  config: CombosCmsConfig['howItWorks'];
}

export default function ComboHowItWorks({ config }: ComboHowItWorksProps) {
  if (!config?.enabled) return null;

  const steps = config.steps || [];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-primary-50/20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-2xl md:text-3xl font-light text-neutral-900 tracking-tight">
            {config.heading || 'How It Works'}
          </h2>
          <div className="w-12 h-px bg-gold-400 mx-auto mt-3" />
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="flex flex-col items-center text-center flex-1 max-w-[240px] relative"
            >
              {/* Connecting line (between steps on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+32px)] w-[calc(100%-24px)] h-px bg-gradient-to-r from-gold-300 to-gold-200/40" />
              )}

              {/* Number circle */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shadow-md shadow-gold-400/20 mb-4">
                <span className="font-serif text-lg font-semibold text-white">{step.number}</span>
              </div>

              {/* Title */}
              <h3 className="font-serif text-lg font-medium text-neutral-900 mb-1.5">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-neutral-500 font-sans leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
