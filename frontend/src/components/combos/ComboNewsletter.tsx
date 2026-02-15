'use client';

/**
 * ComboNewsletter — Email subscription CTA for exclusive combo deals
 * 
 * Premium blush/gold styling. Centered layout.
 * "Get Exclusive Combo Deals" messaging.
 */

import { CombosCmsConfig } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { Mail, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface ComboNewsletterProps {
  config: CombosCmsConfig['newsletter'];
}

export default function ComboNewsletter({ config }: ComboNewsletterProps) {
  if (!config?.enabled) return null;

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: Hook up to newsletter API
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="py-14 md:py-20 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-400/3 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-400/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 text-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-12 h-12 bg-gold-400/10 border border-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-5"
        >
          <Sparkles className="w-5 h-5 text-gold-400" />
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl md:text-3xl font-light text-white tracking-tight mb-3"
        >
          {config.heading || 'Get Exclusive Combo Deals'}
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-neutral-400 font-sans mb-8 leading-relaxed"
        >
          {config.subheading || 'Be the first to know about new BOGO offers and exclusive combos.'}
        </motion.p>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={config.placeholder || 'Enter your email'}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-neutral-500 rounded-full font-sans text-sm focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3.5 bg-gold-400 hover:bg-gold-500 text-white font-sans text-sm font-semibold tracking-wider uppercase rounded-full transition-all duration-300 shadow-lg shadow-gold-400/20 hover:shadow-gold-400/30 whitespace-nowrap"
          >
            {submitted ? '✓ Subscribed!' : config.ctaText || 'Subscribe'}
          </button>
        </motion.form>

        {/* Trust note */}
        <p className="text-[10px] text-neutral-600 font-sans mt-4 tracking-wide">
          No spam. Unsubscribe anytime. Only combo deals & gifting ideas.
        </p>
      </div>
    </section>
  );
}
