'use client';

/**
 * ValentineCombos — AOV Driver Section
 * 
 * Purpose: Increase average order value with combo sets.
 * UX: Lifestyle combo cards with visible pricing, value badges,
 *      gift-ready messaging. Creates urgency + value perception.
 * Motion: Staggered fade-in, badge pulse.
 * Mobile: Horizontal scroll on mobile, grid on desktop.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Gift, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ComboItem {
  id: number;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  image: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

interface ValentineCombosProps {
  heading?: string;
  subheading?: string;
  combos?: ComboItem[];
}

const DEFAULT_COMBOS: ComboItem[] = [
  {
    id: 1,
    title: 'Love Essentials',
    description: 'Necklace + Bracelet Set — a complete look for her.',
    price: '₹1,799',
    originalPrice: '₹2,499',
    image: '/chain.jpeg',
    href: '/collections?type=combo',
    badge: 'Best Value',
    badgeColor: '#EC4899',
  },
  {
    id: 2,
    title: 'Golden Hour Set',
    description: 'Ring + Earrings — because she deserves the glow.',
    price: '₹2,299',
    originalPrice: '₹3,199',
    image: '/ring.jpeg',
    href: '/collections?type=combo',
    badge: 'Gift Ready',
    badgeColor: '#D4AF37',
  },
  {
    id: 3,
    title: 'Ultimate Valentine Box',
    description: 'Necklace + Bracelet + Ring + Tumbler — the full experience.',
    price: '₹3,999',
    originalPrice: '₹5,499',
    image: '/bracelets.jpeg',
    href: '/collections?type=combo',
    badge: 'Limited',
    badgeColor: '#9B2C46',
  },
];

export default function ValentineCombos({
  heading = "Valentine Combos",
  subheading = "Curated gift sets that say everything words can't.",
  combos = DEFAULT_COMBOS,
}: ValentineCombosProps) {
  return (
    <section className="py-14 md:py-20 lg:py-28 bg-gradient-to-b from-[#FFF7FA] to-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="inline-flex items-center gap-2 text-primary-400 mb-4">
            <Heart className="w-4 h-4 fill-primary-300" />
            <span className="text-xs tracking-[0.2em] uppercase font-medium">Made for Gifting</span>
            <Heart className="w-4 h-4 fill-primary-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-lg mx-auto">
            {subheading}
          </p>
        </motion.div>

        {/* Combo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          {combos.map((combo, index) => (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
            >
              <Link
                href={combo.href}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={combo.image}
                    alt={combo.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Badge */}
                  {combo.badge && (
                    <div
                      className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-white text-xs font-medium tracking-wide flex items-center gap-1"
                      style={{ backgroundColor: combo.badgeColor || '#EC4899' }}
                    >
                      {combo.badge === 'Gift Ready' && <Gift className="w-3 h-3" />}
                      {combo.badge === 'Limited' && <Sparkles className="w-3 h-3" />}
                      {combo.badge}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  <h3 className="text-lg md:text-xl font-serif font-medium text-[#1A1A1A] mb-2">
                    {combo.title}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
                    {combo.description}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg md:text-xl font-semibold text-[#1A1A1A]">
                      {combo.price}
                    </span>
                    {combo.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        {combo.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9B2C46] group-hover:gap-2.5 transition-all duration-300">
                    <span>Explore Set</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-10 md:mt-14"
        >
          <Link
            href="/collections?type=combo"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#9B2C46] text-white font-medium rounded-full hover:bg-[#7A2238] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Gift className="w-4 h-4" />
            <span>Explore All Combos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
