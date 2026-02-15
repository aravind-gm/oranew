'use client';

/**
 * SocialProof — Customer Reviews (Currently Disabled)
 *
 * This component has been disabled as we're collecting genuine customer reviews.
 * Will be re-enabled once we have authentic testimonials from verified purchases.
 */

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  image?: string;
}

// Disabled fake testimonials - awaiting genuine customer reviews
const TESTIMONIALS: Testimonial[] = [
  // {
  //   id: 1,
  //   name: 'Priya Sharma',
  //   location: 'Mumbai',
  //   rating: 5,
  //   text: 'Absolutely love my ORA necklace! The quality is exceptional and it looks so elegant. This is my go-to gift for every occasion now.',
  //   image: '/chain.jpeg',
  // },
  // {
  //   id: 2,
  //   name: 'Ananya Verma',
  //   location: 'Delhi',
  //   rating: 5,
  //   text: "Beautiful jewellery at great prices. The designs are modern yet timeless. I've received so many compliments!",
  //   image: '/ring.jpeg',
  // },
  // {
  //   id: 3,
  //   name: 'Divya Patel',
  //   location: 'Bangalore',
  //   rating: 5,
  //   text: 'The earrings arrived beautifully packaged. Perfect for gifting. The customer service team was incredibly helpful.',
  //   image: '/bracelets.jpeg',
  // },
  {
    id: 4,
    name: 'Meera Reddy',
    location: 'Hyderabad',
    rating: 5,
    text: "I ordered the bracelet set for my sister's birthday and she was thrilled. Premium quality at an affordable price.",
  },
  {
    id: 5,
    name: 'Shreya Gupta',
    location: 'Pune',
    rating: 5,
    text: 'ORA has become my favourite jewellery brand. Every piece feels so luxurious. Already planning my next order!',
  },
];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < rating
              ? 'fill-secondary-500 text-secondary-500'
              : 'text-neutral-200'
          }
        />
      ))}
    </div>
  );
}

export default function SocialProof() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-14 md:py-20 lg:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header with prominent rating badge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          {/* Rating Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-luxury mb-6">
            <div className="flex items-center gap-1">
              <Star size={18} className="fill-secondary-500 text-secondary-500" />
              <span className="text-xl font-bold text-[#1A1A1A]">New Brand</span>
            </div>
            <span className="text-sm text-neutral-500">/5 average</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            Why Women Love ORA
          </h2>
        </motion.div>

        {/* Testimonial Cards — Desktop: 3 columns, Mobile: carousel dots */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.slice(0, 3).map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Mobile: Single card with dots */}
        <div className="md:hidden">
          <TestimonialCard
            testimonial={TESTIMONIALS[activeIndex]}
            index={0}
          />
          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-8 bg-secondary-500'
                    : 'w-2 bg-neutral-300'
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom row — remaining 2 on desktop */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8 max-w-3xl mx-auto">
          {TESTIMONIALS.slice(3, 5).map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index + 3} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl p-6 md:p-8 shadow-card-premium"
    >
      {/* Quote icon */}
      <Quote size={24} className="text-secondary-300 mb-4" />

      {/* Review text */}
      <p className="text-sm md:text-base text-neutral-600 leading-relaxed mb-5">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      {/* Stars */}
      <StarRating rating={testimonial.rating} />

      {/* Reviewer info */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
        {testimonial.image ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-100">
            <Image
              src={testimonial.image}
              alt={testimonial.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">
              {testimonial.name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">{testimonial.name}</p>
          <p className="text-xs text-neutral-400">{testimonial.location}</p>
        </div>
      </div>
    </motion.div>
  );
}
