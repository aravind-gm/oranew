'use client';

/**
 * LuxuryTrustCTA — Final trust section + CTA before footer
 * 
 * Dark background with gold accents.
 * Trust icons + tagline + final CTA button.
 */

import { TrustCtaConfig } from '@/store/shopAllCmsStore';
import { motion } from 'framer-motion';
import { 
  Gift, Heart, RefreshCw, Shield, Star, Sparkles, 
  Award, BadgeCheck, Gem, Package 
} from 'lucide-react';
import Link from 'next/link';

interface LuxuryTrustCtaProps {
  config: TrustCtaConfig;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  gift: <Gift className="w-6 h-6" />,
  refresh: <RefreshCw className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  heart: <Heart className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  award: <Award className="w-6 h-6" />,
  badge: <BadgeCheck className="w-6 h-6" />,
  gem: <Gem className="w-6 h-6" />,
  package: <Package className="w-6 h-6" />,
};

export default function LuxuryTrustCta({ config }: LuxuryTrustCtaProps) {
  if (!config.enabled) return null;

  return (
    <section className="relative py-20 md:py-28 bg-[#1A1A1A] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/3 rounded-full blur-[200px]" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#D4AF37]/2 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#C2185B]/2 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Trust Items */}
        <div className="flex items-center justify-center gap-10 md:gap-16 lg:gap-24 flex-wrap mb-12">
          {config.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37]/20 transition-all duration-500">
                {ICON_MAP[item.icon] || <Heart className="w-6 h-6" />}
              </div>
              <span className="text-[11px] md:text-xs text-white/60 tracking-[0.1em] font-medium uppercase">
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Decorative divider */}
        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mx-auto mb-10" />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-serif text-xl md:text-2xl text-white/40 mb-10 italic font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Own. Radiate. Adorn.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link
            href={config.ctaLink}
            className="inline-flex items-center gap-2.5 px-12 py-4 text-[11px] tracking-[0.25em] uppercase font-semibold bg-white text-[#1A1A1A] rounded-full hover:bg-[#D4AF37] hover:text-white transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]"
          >
            {config.ctaText}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
