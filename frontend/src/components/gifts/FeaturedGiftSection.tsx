'use client';

/**
 * FeaturedGiftSection - Handpicked premium gift cards
 * Large showcase cards with emotional descriptions
 * NOW DYNAMIC - Fetches featured gifts from API
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface FeaturedGift {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  badge?: 'Most Gifted' | 'Bestseller' | 'Limited Stock';
  rating?: number;
  reviews?: number;
}

export default function FeaturedGiftSection() {
  const [featuredGifts, setFeaturedGifts] = useState<FeaturedGift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedGifts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products', {
          params: {
            collection: 'gifts-for-her',
            featuredGifts: true, // Only featured gifts
            limit: 3,
            sort: '-averageRating', // Highest rated first
          },
        });

        const products = response.data.data || response.data.products || [];
        
        const transformedGifts: FeaturedGift[] = products.map((p: any, index: number) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.shortDescription || p.description?.substring(0, 100) || 'A beautiful gift for her.',
          price: p.finalPrice || p.price,
          originalPrice: p.price,
          image: p.images?.[0]?.imageUrl || p.images?.[0]?.url || '/images/placeholder-product.svg',
          badge: index === 0 ? 'Most Gifted' : (p.isBestseller ? 'Bestseller' : undefined),
          rating: p.averageRating || 4.5,
          reviews: p.reviewCount || 0,
        }));

        setFeaturedGifts(transformedGifts);
      } catch (error) {
        console.error('Failed to fetch featured gifts:', error);
        setFeaturedGifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedGifts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#F6E9EE]/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#E91E63] animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredGifts.length === 0) {
    return null; // Don't show section if no featured gifts
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#F6E9EE]/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif text-[#111111] mb-3">
            Handpicked For Her
          </h2>
          <p className="text-[#7A7A85] text-base md:text-lg max-w-2xl mx-auto">
            Our most loved pieces, chosen by thousands of gift-givers
          </p>
          <div className="w-16 h-[2px] bg-[#C6A85B] mx-auto mt-4"></div>
        </div>

        {/* Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {featuredGifts.map((gift) => (
            <div
              key={gift.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#ECECF2] hover:border-[#E91E63]"
            >
              {/* Badge */}
              {gift.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className={`
                    px-3 py-1.5 text-xs font-medium rounded-full
                    ${gift.badge === 'Most Gifted' ? 'bg-[#E91E63] text-white' : ''}
                    ${gift.badge === 'Bestseller' ? 'bg-[#C6A85B] text-white' : ''}
                    ${gift.badge === 'Limited Stock' ? 'bg-[#111111] text-white' : ''}
                  `}>
                    {gift.badge}
                  </span>
                </div>
              )}

              {/* Image */}
              <Link href={`/products/${gift.slug}`} className="block relative aspect-square overflow-hidden">
                {gift.image && (
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
              </Link>

              {/* Content */}
              <div className="p-6 space-y-3">
                {/* Rating */}
                {gift.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-[#C6A85B] text-[#C6A85B]" />
                      <span className="text-sm font-medium text-[#111111] ml-1">
                        {gift.rating}
                      </span>
                    </div>
                    <span className="text-sm text-[#7A7A85]">
                      ({gift.reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Title */}
                <Link href={`/products/${gift.slug}`}>
                  <h3 className="text-lg font-semibold text-[#111111] group-hover:text-[#E91E63] transition-colors line-clamp-2">
                    {gift.name}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-sm text-[#7A7A85] leading-relaxed line-clamp-2">
                  {gift.description}
                </p>

                {/* Divider */}
                <div className="w-full h-[1px] bg-[#C6A85B]/30"></div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#111111]">
                    ₹{gift.price.toLocaleString()}
                  </span>
                  <span className="text-base text-[#7A7A85] line-through">
                    ₹{gift.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-[#C6A85B]">
                    Save ₹{(gift.originalPrice - gift.price).toLocaleString()}
                  </span>
                </div>

                {/* CTA Button */}
                <Link
                  href={`/products/${gift.slug}`}
                  className="block w-full py-3 bg-[#E91E63] text-white text-center font-medium rounded-full hover:bg-[#C2185B] transition-colors duration-300"
                >
                  Gift This
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10">
          <a
            href="#shop-gifts"
            className="inline-block px-8 py-3 border-2 border-[#E91E63] text-[#E91E63] font-medium rounded-full hover:bg-[#E91E63] hover:text-white transition-all duration-300"
          >
            View All Gift Ideas
          </a>
        </div>
      </div>
    </section>
  );
}
