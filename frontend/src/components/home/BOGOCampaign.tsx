'use client';

/**
 * OfferCampaign — Homepage Revenue Driver Section
 * "Buy Any Necklace, Get a Ring FREE"
 */

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function BOGOCampaign() {
  return (
    <section className="relative py-16 md:py-24 lg:py-28 bg-[#0F0F14] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C6A85B]/6 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-5 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C6A85B] border border-[#C6A85B]/30 rounded-full bg-[#C6A85B]/5">
            <Sparkles className="w-3 h-3" /> Limited Time Launch Offer
          </span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white mb-4 md:mb-6 leading-tight tracking-tight">
            Buy Any Necklace.<br />
            <span className="text-[#C6A85B]">Get a Ring FREE.</span>
          </h2>
          <p className="text-base md:text-lg text-neutral-400 max-w-lg mx-auto mb-8 md:mb-10">
            Purchase any eligible necklace and receive a complimentary ring of your choice — no coupon needed.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
          <Link href="/collections/combos" className="group inline-flex items-center gap-3 px-10 py-4 bg-[#C6A85B] text-[#0F0F14] font-semibold rounded-full hover:bg-[#b8985a] transition-all duration-300 shadow-lg hover:shadow-xl text-base">
            <span>Shop the Offer</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
