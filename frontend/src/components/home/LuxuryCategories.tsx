'use client';

/**
 * LuxuryCategories — Simplified Shop by Category
 *
 * Only 4 categories: Necklaces, Rings, Bracelets, Earrings
 * Large clean image cards with minimal overlay.
 * No clutter. No Tumblers.
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
  image: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    title: 'Necklaces',
    subtitle: 'Close to the heart',
    image: '/chain.jpeg',
    href: '/collections?category=necklace',
  },
  {
    id: 2,
    title: 'Rings',
    subtitle: 'Timeless elegance',
    image: '/ring.jpeg',
    href: '/collections?category=rings',
  },
  {
    id: 3,
    title: 'Bracelets',
    subtitle: 'Wrapped in grace',
    image: '/bracelets.jpeg',
    href: '/collections?category=bracelets',
  },
  {
    id: 4,
    title: 'Pendants',
    subtitle: 'Expressions of elegance',
    image: '/banners.png',
    href: '/collections?category=pendants',
  },
];

function CategoryCard({ item, index }: { item: CategoryItem; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Link
        href={item.href}
        className="group relative block aspect-[3/4] rounded-2xl overflow-hidden"
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
          sizes="(max-width: 640px) 50vw, 25vw"
          onLoad={() => setImgLoaded(true)}
        />

        {/* Minimal overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 text-white">
          <h3 className="text-lg md:text-xl font-serif font-medium mb-0.5">
            {item.title}
          </h3>
          <p className="text-sm opacity-80 italic font-light mb-3">
            {item.subtitle}
          </p>
          <div className="inline-flex items-center gap-1.5 text-sm font-medium opacity-90 group-hover:gap-2.5 group-hover:opacity-100 transition-all duration-300">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LuxuryCategories() {
  return (
    <section className="py-14 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
            Shop by Category
          </h2>
          <p className="text-base md:text-lg text-neutral-500 max-w-xl mx-auto">
            Find your perfect piece
          </p>
        </motion.div>

        {/* 4-column grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.map((cat, index) => (
            <CategoryCard key={cat.id} item={cat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
