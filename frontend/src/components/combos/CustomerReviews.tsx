'use client';

/**
 * CustomerReviews — Verified combo purchase reviews
 *
 * 3 review cards in a grid (1 col mobile, 3 col desktop)
 * Star ratings, verified badge, quote icon, premium typography.
 * White background section.
 */

import { motion } from 'framer-motion';
import { BadgeCheck, Quote, Star } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  combo: string;
}

const REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Priya S.',
    text: 'Gifted the Golden Glow set to my sister — she loved both pieces! The packaging felt so luxurious. Absolutely worth it.',
    rating: 5,
    combo: 'Golden Glow Set',
  },
  {
    id: '2',
    name: 'Ananya R.',
    text: 'I was skeptical about BOGO offers but these are legit premium quality. The necklace and earrings pair beautifully.',
    rating: 5,
    combo: 'Rose Gold Duo',
  },
  {
    id: '3',
    name: 'Meera K.',
    text: 'Ordered for my anniversary — the combo arrived gift-wrapped and perfect. My wife was thrilled. Will definitely order again.',
    rating: 4,
    combo: 'Eternal Elegance Set',
  },
];

export default function CustomerReviews() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="font-serif text-2xl md:text-3xl font-light tracking-tight"
            style={{ color: '#111111' }}
          >
            Loved by Our Customers
          </h2>
          <div
            className="w-12 h-px mx-auto mt-3"
            style={{ background: '#C6A85B' }}
          />
        </motion.div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative rounded-2xl p-6 transition-shadow duration-300 hover:shadow-lg"
              style={{
                background: '#FFFFFF',
                border: '1px solid #ECECF2',
              }}
            >
              {/* Quote */}
              <div className="mb-3">
                <Quote className="w-6 h-6" style={{ color: '#C6A85B', opacity: 0.4 }} />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-200'
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <p
                className="text-sm font-sans leading-relaxed mb-4"
                style={{ color: '#444' }}
              >
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Combo name */}
              <p
                className="text-xs font-sans mb-4"
                style={{ color: '#C6A85B' }}
              >
                Combo: {review.combo}
              </p>

              {/* Author */}
              <div
                className="flex items-center gap-2 pt-3"
                style={{ borderTop: '1px solid #ECECF2' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#F6E9EE' }}
                >
                  <span
                    className="text-sm font-serif font-semibold"
                    style={{ color: '#E91E63' }}
                  >
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p
                    className="text-sm font-sans font-medium"
                    style={{ color: '#111111' }}
                  >
                    {review.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-sans tracking-wide text-green-600">
                      Verified Purchase
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
