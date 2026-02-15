'use client';

/**
 * PriceGiftCards - Emotional budget selector cards
 * Makes price filtering feel like a gifting experience
 */

import { Heart } from 'lucide-react';

const priceCards = [
  {
    id: 'under-999',
    maxPrice: 999,
    title: 'Everyday Picks',
    subtitle: 'Sweet & meaningful',
    price: 'Under ₹999',
    gradient: 'from-[#F6E9EE]/50 to-[#F6E9EE]/20',
  },
  {
    id: 'under-1499',
    maxPrice: 1499,
    title: 'Statement Styles',
    subtitle: 'Perfect for most occasions',
    price: 'Under ₹1,499',
    gradient: 'from-[#F6E9EE]/70 to-[#F6E9EE]/30',
  },
  {
    id: 'under-1999',
    maxPrice: 1999,
    title: 'Elevated Choices',
    subtitle: 'Special moments deserve this',
    price: 'Under ₹1,999',
    gradient: 'from-[#F6E9EE]/80 to-[#F6E9EE]/40',
  },
  {
    id: 'premium',
    maxPrice: null,
    title: 'Signature Collections',
    subtitle: 'Luxury that lasts forever',
    price: 'Premium',
    gradient: 'from-[#F6E9EE] to-[#F6E9EE]/50',
  },
];

interface PriceGiftCardsProps {
  onPriceSelect?: (maxPrice: number | null) => void;
}

export default function PriceGiftCards({ onPriceSelect }: PriceGiftCardsProps) {
  return (
    <section className="py-12 md:py-16 bg-white" id="price-gift-selector">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif text-[#111111] mb-2">
            Shop By Your Budget
          </h2>
          <p className="text-[#7A7A85] text-sm md:text-base">
            Every budget tells a beautiful story
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {priceCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onPriceSelect?.(card.maxPrice)}
              className={`
                group relative p-6 rounded-2xl border border-[#ECECF2]
                bg-gradient-to-br ${card.gradient}
                hover:shadow-lg hover:scale-105 hover:border-[#E91E63]
                transition-all duration-300 text-left
              `}
            >
              <div className="flex flex-col items-start space-y-3">
                {/* Gold Heart Icon */}
                <div className="p-3 bg-white/80 rounded-full">
                  <Heart className="w-6 h-6 text-[#C6A85B] fill-[#C6A85B]" />
                </div>

                {/* Price */}
                <div className="text-2xl font-bold text-[#111111]">
                  {card.price}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-lg font-semibold text-[#111111] mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#7A7A85]">
                    {card.subtitle}
                  </p>
                </div>

                {/* Arrow indicator on hover */}
                <div className="mt-2 text-[#E91E63] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore gifts →
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-[#7A7A85]">
            All prices include free delivery
          </p>
        </div>
      </div>
    </section>
  );
}
