'use client';

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

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Thank you for subscribing!');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="section-luxury bg-primary/10">
      <div className="container-luxury">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="heading-section mb-4">Stay Connected</h2>
          <p className="text-luxury mb-8">
            Subscribe to our newsletter and be the first to know about new collections,
            exclusive offers, and styling tips.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-luxury flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary whitespace-nowrap"
              disabled={loading}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          <p className="text-sm text-text-muted mt-4">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
}
