'use client';

/**
 * ComboTestimonials — Social proof carousel for combo purchases
 * 
 * Shows verified customer reviews with star ratings.
 * Gold-accented, premium feel. Auto-slides on mobile.
 */

import { CombosCmsConfig } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { Quote, Star, BadgeCheck } from 'lucide-react';

interface ComboTestimonialsProps {
  config: CombosCmsConfig['testimonials'];
}

export default function ComboTestimonials({ config }: ComboTestimonialsProps) {
  if (!config?.enabled) return null;

  const testimonials = config.items || [];
  if (testimonials.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-primary-50/20 to-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-2xl md:text-3xl font-light text-neutral-900 tracking-tight">
            {config.heading || 'Loved by Women'}
          </h2>
          <div className="w-12 h-px bg-gold-400 mx-auto mt-3" />
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Quote icon */}
              <div className="mb-3">
                <Quote className="w-6 h-6 text-gold-300" />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < testimonial.rating ? 'text-gold-400 fill-gold-400' : 'text-neutral-200'}`}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-neutral-600 font-sans leading-relaxed mb-4">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-serif font-semibold text-primary-600">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-sans font-medium text-neutral-900">{testimonial.name}</p>
                  {testimonial.verified && (
                    <div className="flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-sans tracking-wide">Verified Purchase</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
