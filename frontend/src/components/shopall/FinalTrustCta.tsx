'use client';

/**
 * FinalTrustCta — Bottom trust strip + CTA
 * 
 * Final section before footer. Reinforces trust:
 *   Gift Wrap · Easy Returns · Quality Guaranteed
 * Plus a final call-to-action.
 */

import { TrustCtaConfig } from '@/store/shopAllCmsStore';
import { motion } from 'framer-motion';
import { Gift, Heart, RefreshCw, Shield, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface FinalTrustCtaProps {
  config: TrustCtaConfig;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  gift: <Gift className="w-6 h-6" />,
  refresh: <RefreshCw className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  heart: <Heart className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
};

export default function FinalTrustCta({ config }: FinalTrustCtaProps) {
  if (!config.enabled) return null;

  return (
    <section className="py-16 md:py-20 bg-[#1A1A1A]">
      <div className="max-w-5xl mx-auto px-6 text-center">
        {/* Trust items */}
        <div className="flex items-center justify-center gap-8 md:gap-14 lg:gap-20 flex-wrap mb-10">
          {config.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#D4AF37]">
                {ICON_MAP[item.icon] || <Heart className="w-6 h-6" />}
              </div>
              <span className="text-xs md:text-sm text-white/70 tracking-wide font-medium">
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-[#D4AF37]/40 mx-auto mb-8" />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-serif text-lg md:text-xl text-white/60 mb-8 italic"
        >
          Own. Radiate. Adorn.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link
            href={config.ctaLink}
            className="inline-flex items-center gap-2 px-10 py-3.5 text-xs tracking-[0.2em] uppercase font-medium bg-white text-[#1A1A1A] rounded-full hover:bg-[#D4AF37] hover:text-white transition-all duration-300"
          >
            {config.ctaText}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
