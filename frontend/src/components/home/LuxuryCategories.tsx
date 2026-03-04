'use client';

/**
 * LuxuryCategories — Shop by Category
 *
 * Only 3 categories: Chains (hero/featured), Rings, Bracelets
 * Chains gets a wide hero card. Rings + Bracelets side by side below.
 */

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface CategoryItem {
  id: number;
  title: string;
  subtitle: string;
  tagline: string;
  image: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    title: 'Chains',
    subtitle: 'Most Loved',
    tagline: 'Layered, minimal, or statement — find the chain that speaks you.',
    image: '/chain.jpeg',
    href: '/collections?category=chains',
  },
  {
    id: 2,
    title: 'Rings',
    subtitle: 'Timeless elegance',
    tagline: 'Stackable bands to bold solitaires.',
    image: '/ring.jpeg',
    href: '/collections?category=rings',
  },
  {
    id: 3,
    title: 'Bracelets',
    subtitle: 'Wrapped in grace',
    tagline: 'Delicate cuffs & charm bracelets.',
    image: '/bracelets.jpeg',
    href: '/collections?category=bracelets',
  },
];

function CategoryCard({
  item,
  index,
  featured = false,
}: {
  item: CategoryItem;
  index: number;
  featured?: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
      className={featured ? 'col-span-2 sm:col-span-2' : ''}
    >
      <Link
        href={item.href}
        className={`group relative block rounded-2xl overflow-hidden ${
          featured
            ? 'aspect-[16/9] sm:aspect-[2.4/1]'
            : 'aspect-[3/4] sm:aspect-[4/5]'
        }`}
      >
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-neutral-100 animate-pulse rounded-2xl" />
        )}

        {/* Image */}
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes={featured ? '100vw' : '(max-width: 640px) 50vw, 33vw'}
          onLoad={() => setImgLoaded(true)}
          priority={featured}
        />

        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 ${
            featured
              ? 'bg-gradient-to-r from-black/60 via-black/30 to-transparent'
              : 'bg-gradient-to-t from-black/55 via-black/15 to-transparent'
          }`}
        />

        {/* Badge for featured */}
        {featured && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <span className="inline-block px-3 py-1 bg-white/90 text-[#1A1A1A] text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full">
              {item.subtitle}
            </span>
          </div>
        )}

        {/* Content */}
        <div
          className={`absolute inset-0 flex flex-col text-white ${
            featured
              ? 'justify-end sm:justify-center p-5 sm:p-8 md:p-10'
              : 'justify-end p-5 md:p-6'
          }`}
        >
          <h3
            className={`font-serif font-medium mb-1 ${
              featured
                ? 'text-2xl sm:text-3xl md:text-4xl'
                : 'text-lg md:text-xl'
            }`}
          >
            {item.title}
          </h3>
          {!featured && (
            <p className="text-sm opacity-80 italic font-light mb-3">
              {item.subtitle}
            </p>
          )}
          {featured && (
            <p className="text-sm sm:text-base opacity-85 font-light mb-4 max-w-md">
              {item.tagline}
            </p>
          )}
          <div
            className={`inline-flex items-center gap-1.5 font-medium opacity-90 group-hover:gap-2.5 group-hover:opacity-100 transition-all duration-300 ${
              featured ? 'text-base' : 'text-sm'
            }`}
          >
            <span>Shop {item.title}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LuxuryCategories() {
  return (
    <section className="py-14 md:py-20 lg:py-24 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-neutral-400 mb-3 font-medium">
            Collections
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            Shop by Category
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-xl mx-auto">
            Three essentials. Endless ways to style.
          </p>
        </motion.div>

        {/* Featured Chains (hero card) + Rings & Bracelets side-by-side */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Chains — full width hero */}
          <CategoryCard item={CATEGORIES[0]} index={0} featured />

          {/* Rings */}
          <CategoryCard item={CATEGORIES[1]} index={1} />

          {/* Bracelets */}
          <CategoryCard item={CATEGORIES[2]} index={2} />
        </div>
      </div>
    </section>
  );
}
