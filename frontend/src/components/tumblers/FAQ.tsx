'use client';

/**
 * FAQ — Accordion FAQ section
 * ============================
 * Addresses pre-purchase objections.
 *
 * Marketing: Objection handling → removes friction before CTA.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const QUESTIONS = [
  {
    q: "What's the difference between the three editions?",
    a: 'All three are 40oz tumblers with progressive insulation performance. Classic Flow (4h hot/12h cold) has standard steel with matte finish. Marble Gloss (5h hot/18h cold) has enhanced steel with gloss marble finish and improved lid-lock. Floral Gift (7h hot/24h cold) has premium steel density with gold detailing and magnetic seal lid. Packaging also upgrades from basic to premium sleeve to luxury gift box.',
  },
  {
    q: 'How long does insulation last?',
    a: 'Classic Flow: 4 hours hot / 12 hours cold. Marble Gloss: 5 hours hot / 18 hours cold. Floral Gift: 7 hours hot / 24 hours cold. Performance depends on ambient temperature and initial drink temperature.',
  },
  {
    q: 'Are all tumblers leak-proof?',
    a: 'Yes. All models feature sealed lids designed to prevent leaks when the lid is properly closed. The Marble Gloss has an improved lid-lock, and the Floral Gift uses a magnetic seal for added security.',
  },
  {
    q: 'What material are they made of?',
    a: 'Food-grade stainless steel interior with BPA-free components. All editions feature double-wall vacuum insulation.',
  },
  {
    q: 'Do they include straw and handle?',
    a: 'Yes. All editions include both a reusable straw and a handle attachment.',
  },
  {
    q: 'What is the return policy?',
    a: 'You may request a return within 5 days of delivery confirmation. Items must be unused and in original packaging. Refunds are processed within 7–10 business days.',
  },
];

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#F3F4F6] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-[#111111] group-hover:text-[#E75480] transition-colors pr-4">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-[#9CA3AF] transition-transform duration-300 ${open ? 'rotate-180 text-[#E75480]' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-[#7A7A85] leading-relaxed pr-8">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="w-full bg-white py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#E75480' }}>
            Questions?
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#111111]">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#FAFAFA] rounded-2xl p-6 sm:p-8"
        >
          {QUESTIONS.map((item, i) => (
            <FAQItem
              key={i}
              q={item.q}
              a={item.a}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
