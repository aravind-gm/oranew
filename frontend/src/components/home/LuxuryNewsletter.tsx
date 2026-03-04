'use client';

/**
 * LuxuryNewsletter — Minimal Email Capture
 *
 * Dark background.
 * Headline: "Join the ORA Family"
 * Simple email + subscribe.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function LuxuryNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.orashop.in';
      const res = await fetch(`${apiUrl}/api/contact/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-[#0F0F14] relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-pink-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-5 h-5 text-pink-400/60 mx-auto mb-4" />

          <h2 className="text-2xl sm:text-3xl font-serif font-light text-white mb-3">
            Join the ORA Family
          </h2>
          <p className="text-sm md:text-base text-neutral-400 mb-8 max-w-md mx-auto">
            Be the first to know about new drops, exclusive offers, and stories crafted for her.
          </p>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-5 py-3.5 rounded-full border border-neutral-700 bg-white/5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0F0F14] text-sm font-semibold rounded-full hover:bg-neutral-100 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <span className="animate-pulse">Subscribing...</span>
              ) : (
                <>
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-emerald-400 font-medium"
            >
              Welcome to the ORA family! 💖
            </motion.p>
          )}
          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400 font-medium"
            >
              Something went wrong. Please try again.
            </motion.p>
          )}

          <p className="mt-5 text-xs text-neutral-600">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
