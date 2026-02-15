'use client';

/**
 * NewsletterCTA — Email signup section with luxury styling
 * 
 * Elegant newsletter signup before the footer.
 * Blush pink gradient with gold accents.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="relative py-16 md:py-20 bg-gradient-to-br from-[#FFF5F7] via-[#FFE8EF] to-[#FDD8E4] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] bg-[#D4AF37]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] bg-[#F8C8DC]/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={18} className="mx-auto text-[#D4AF37]/60 mb-4" />
          
          <h2 
            className="font-serif text-2xl md:text-3xl font-light text-[#1A1A1A] mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Stay in the Loop
          </h2>
          <p className="text-sm text-neutral-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Be the first to know about new arrivals, exclusive offers, and styling tips curated just for you.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 px-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#D4AF37]/20"
            >
              <p className="text-sm font-medium text-[#1A1A1A]">
                ✨ Welcome to the ORA family!
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                We&apos;ll send you something beautiful soon.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-3.5 text-sm bg-white/80 backdrop-blur-sm border border-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50 placeholder:text-neutral-400 text-[#1A1A1A] min-h-[48px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[11px] tracking-[0.15em] uppercase font-semibold bg-[#1A1A1A] text-white rounded-full hover:bg-[#D4AF37] transition-all duration-500 disabled:opacity-50 min-h-[48px] whitespace-nowrap"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-[10px] text-neutral-400 mt-4">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
