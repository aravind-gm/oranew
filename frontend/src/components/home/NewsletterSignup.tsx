'use client';

/**
 * NewsletterSignup — Community + Email Capture
 * 
 * Purpose: Retention — capture email, build community.
 * UX: Soft CTA with "Join the ORA Family" copy,
 *      inline email input + submit button.
 * Motion: Fade-in on scroll.
 * Mobile: Stacked input + button.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface NewsletterSignupProps {
  heading?: string;
  subheading?: string;
}

export default function NewsletterSignup({
  heading = 'Join the ORA Family',
  subheading = 'Be the first to know about new drops, exclusive offers, and stories crafted for her.',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      // In production, wire this to your email service (Klaviyo, Mailchimp, etc.)
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className="py-14 md:py-20 bg-white border-t border-neutral-100">
      <div className="max-w-xl mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
        >
          <Heart className="w-5 h-5 text-primary-300 fill-primary-200 mx-auto mb-4" />

          <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#1A1A1A] mb-3">
            {heading}
          </h2>
          <p className="text-sm md:text-base text-neutral-500 mb-8 max-w-md mx-auto leading-relaxed">
            {subheading}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-5 py-3.5 rounded-full border border-neutral-200 bg-neutral-50 text-sm text-[#1A1A1A] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
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
              className="mt-4 text-sm text-emerald-600 font-medium"
            >
              Welcome to the ORA family! 💖
            </motion.p>
          )}
          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-500 font-medium"
            >
              Something went wrong. Please try again.
            </motion.p>
          )}

          <p className="mt-5 text-xs text-neutral-400">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
