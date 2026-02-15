'use client';

/**
 * Newsletter — Luxury Email Capture
 * 
 * Title: Join the ORA Circle
 * Subtitle: Be the first to discover new collections and curated releases.
 * No: "exclusive discounts", emoji, welcome gift promises
 */

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Thank you for joining the ORA Circle.');
      setEmail('');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Newsletter subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white border-t border-oraPink/30">
      <div className="max-w-3xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-100 rounded-full mb-6">
            <Mail className="w-5 h-5 text-neutral-600" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            Join the ORA Circle
          </h2>
          <p className="text-sm md:text-base text-oraAccent/70 mb-8 max-w-xl mx-auto">
            Be the first to discover new collections and curated releases.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all"
              disabled={loading}
              required
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-oraAccent hover:bg-pink-600 text-white font-medium rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={loading}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          <p className="mt-4 text-xs text-neutral-400">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
