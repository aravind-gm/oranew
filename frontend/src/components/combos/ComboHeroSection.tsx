'use client';

/**
 * ComboHeroSection — Full-width premium hero for Combos for Her
 * 
 * Features:
 *   - Emotional headline with BOGO messaging
 *   - Optional countdown timer (admin-controlled)
 *   - Background image with gradient overlay
 *   - Dual CTAs: "Shop Combos" + "View Best Sellers"
 *   - Blush/gold/cream luxury aesthetic
 *   - Fully responsive
 */

import { CombosCmsConfig } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { ChevronDown, Clock, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ComboHeroProps {
  config: CombosCmsConfig['hero'];
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(endDate).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (expired) return null;

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex items-center gap-3 justify-center mt-6"
    >
      <Clock className="w-4 h-4 text-primary-300" />
      <span className="text-sm text-primary-200 font-sans tracking-wide uppercase">Offer ends in</span>
      <div className="flex gap-2">
        {blocks.map((block) => (
          <div key={block.label} className="flex flex-col items-center">
            <span className="bg-white/15 backdrop-blur-sm text-white font-serif text-lg font-semibold px-2.5 py-1 rounded-md min-w-[44px] text-center">
              {String(block.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-primary-300 mt-1 uppercase tracking-wider">{block.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ComboHeroSection({ config }: ComboHeroProps) {
  if (!config?.enabled) return null;

  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('combos');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const hasBgImage = !!config.backgroundImage;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '520px',
        background: hasBgImage
          ? `url(${config.backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: hasBgImage
            ? `rgba(0,0,0,${config.overlayOpacity || 0.35})`
            : 'linear-gradient(to bottom, rgba(212,175,55,0.08) 0%, rgba(236,72,153,0.06) 50%, transparent 100%)',
        }}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/3 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-28 lg:py-32 max-w-4xl mx-auto">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-gold-400/15 backdrop-blur-sm border border-gold-400/20 rounded-full px-4 py-1.5 mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-xs font-sans tracking-[0.2em] uppercase text-gold-300">Buy 1 Get 1 Free</span>
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight tracking-tight"
        >
          {config.heading || 'Buy 1. Get 1 Free. Because She Deserves More.'}
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-base sm:text-lg text-primary-200/80 font-sans font-light max-w-xl leading-relaxed"
        >
          {config.subheading || 'Curated jewellery combos crafted for gifting, celebrating, and glowing.'}
        </motion.p>

        {/* Countdown */}
        {config.enableCountdown && config.countdownEndDate && (
          <CountdownTimer endDate={config.countdownEndDate} />
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          <button
            onClick={scrollToGrid}
            className="px-8 py-3.5 bg-gold-400 hover:bg-gold-500 text-white font-sans text-sm font-medium tracking-wider uppercase rounded-full transition-all duration-300 shadow-lg shadow-gold-400/25 hover:shadow-gold-400/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {config.ctaPrimary || 'Shop Combos'}
          </button>
          <a
            href={config.ctaSecondaryLink || '/collections'}
            className="px-8 py-3.5 border border-white/20 hover:border-white/40 text-white font-sans text-sm font-medium tracking-wider uppercase rounded-full transition-all duration-300 hover:bg-white/5"
          >
            {config.ctaSecondary || 'View Best Sellers'}
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Scroll to combos"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </motion.button>
      </div>
    </section>
  );
}
