'use client';

import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Absolutely love my ORA necklace! The quality is exceptional and it looks so elegant. Highly recommend!',
  },
  {
    id: 2,
    name: 'Ananya Verma',
    location: 'Delhi',
    rating: 5,
    text: 'Beautiful jewellery at great prices. The designs are modern yet timeless. Will definitely order again!',
  },
  {
    id: 3,
    name: 'Divya Patel',
    location: 'Bangalore',
    rating: 5,
    text: 'The earrings I bought are stunning! They arrived beautifully packaged and the customer service was excellent.',
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="section-luxury bg-background">
      <div className="container-luxury">
        <div className="text-center mb-16">
          <h2 className="heading-section mb-4">What Our Customers Say</h2>
          <p className="text-luxury max-w-2xl mx-auto">
            Join thousands of happy customers who trust ORA for their jewellery needs.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Testimonial Card */}
          <div className="card-luxury p-12 text-center">
            <div className="flex justify-center mb-6">
              {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                <svg key={i} className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              "{testimonials[activeIndex].text}"
            </p>

            <div className="font-medium text-text-primary">
              {testimonials[activeIndex].name}
            </div>
            <div className="text-sm text-text-muted">
              {testimonials[activeIndex].location}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex ? 'bg-primary w-8' : 'bg-border'
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
