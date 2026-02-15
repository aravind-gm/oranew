'use client';

/**
 * Supporting sections for Gifts For Her page:
 * - WhyGiftSection: 4 benefits with icons
 * - HowToPickGift: 3-step guide
 * - ReviewsSection: Emotional testimonials
 */

import { Heart, Package, Truck, RotateCcw, Star } from 'lucide-react';

// ============================================================================
// WHY GIFT JEWELLERY SECTION
// ============================================================================

export function WhyGiftSection() {
  const benefits = [
    {
      icon: Heart,
      title: 'Thoughtful Designs',
      description: 'Contemporary pieces crafted to celebrate meaningful occasions.',
    },
    {
      icon: Package,
      title: 'Premium Craftsmanship',
      description: 'Quality finishes designed for everyday elegance.',
    },
    {
      icon: Truck,
      title: 'Free Delivery Across India',
      description: 'Delivered safely to your doorstep at no additional cost.',
    },
    {
      icon: RotateCcw,
      title: '5-Day Easy Returns',
      description: 'Request a return within 5 days of delivery.',
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-[#F6E9EE]/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif text-[#111111] mb-2">
            Why Choose ORA Gifts?
          </h2>
          <p className="text-[#7A7A85] text-sm">
            Quality jewellery for moments that matter
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white rounded-xl border border-[#ECECF2] hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex p-4 bg-[#F6E9EE] rounded-full mb-4">
                <benefit.icon className="w-6 h-6 text-[#E91E63]" />
              </div>
              <h3 className="text-base font-semibold text-[#111111] mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-[#7A7A85] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW TO PICK THE PERFECT GIFT
// ============================================================================

export function HowToPickGift() {
  const steps = [
    {
      number: '1',
      title: 'Choose by Occasion',
      description: 'Birthday, anniversary, or just because? We have curated collections for every moment.',
    },
    {
      number: '2',
      title: 'Pick Your Budget',
      description: 'From thoughtful tokens to grand gestures — every budget tells a beautiful story.',
    },
    {
      number: '3',
      title: 'Add a Personal Note',
      description: 'Include a thoughtful message during checkout.',
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif text-[#111111] mb-2">
            How to Pick The Perfect Gift
          </h2>
          <p className="text-[#7A7A85] text-sm">
            Three simple steps to make her smile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-[#C6A85B]/30"></div>
              )}

              <div className="text-center relative z-10">
                {/* Gold Number Circle */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C6A85B] text-white text-2xl font-bold rounded-full mb-4">
                  {step.number}
                </div>

                <h3 className="text-lg font-semibold text-[#111111] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[#7A7A85] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// REVIEWS SECTION
// ============================================================================

export function ReviewsSection() {
  const reviews = [
    {
      text: 'Best anniversary surprise ever! She couldn\'t stop smiling. The packaging alone was worth it.',
      author: 'Rahul M.',
      rating: 5,
    },
    {
      text: 'She loved it instantly. Exactly what I was looking for — elegant, meaningful, and perfectly priced.',
      author: 'Priya K.',
      rating: 5,
    },
    {
      text: 'Premium packaging, feels luxury. Delivery was super fast. Will definitely gift again!',
      author: 'Arjun S.',
      rating: 5,
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#F6E9EE]/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif text-[#111111] mb-2">
            What Gift-Givers Say
          </h2>
          <p className="text-[#7A7A85] text-sm">
            Real stories from real people
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-[#ECECF2] shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#C6A85B] text-[#C6A85B]"
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-sm text-[#111111] leading-relaxed mb-4 italic">
                "{review.text}"
              </p>

              {/* Author */}
              <p className="text-xs text-[#7A7A85] font-medium">
                — {review.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================

export function FinalCTASection() {
  return (
    <section className="py-16 md:py-20 bg-[#F6E9EE]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-serif text-[#111111] mb-4">
          Make Her Smile Today.
        </h2>
        <p className="text-base text-[#7A7A85] mb-8 max-w-xl mx-auto">
          Every piece tells a story. Every gift creates a memory.
        </p>
        <a
          href="#shop-gifts"
          className="inline-block px-10 py-4 bg-[#E91E63] text-white text-base font-semibold rounded-full hover:bg-[#C2185B] transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Shop Gifts Now
        </a>
      </div>
    </section>
  );
}
