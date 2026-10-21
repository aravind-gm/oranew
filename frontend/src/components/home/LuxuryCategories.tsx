'use client';

/**
 * LuxuryCategories — Compact Shop by Category
 *
 * Three equal-sized category cards in a 3-column grid on desktop,
 * 2+1 or stacked on mobile. Compact images, clear labels,
 * subtle hover effects. Prioritises quick product discovery.
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
    subtitle: 'Most Loved',
    image: 'https://cdn.orashop.in/banners/categories/necklaces.webp',
    href: '/collections?category=necklaces',
  },
  {
    id: 2,
    title: 'Rings',
    subtitle: 'Timeless elegance',
    image: 'https://cdn.orashop.in/banners/categories/rings.webp',
    href: '/collections?category=rings',
  },
  {
    id: 3,
    title: 'Bracelets',
    subtitle: 'Wrapped in grace',
    image: 'https://cdn.orashop.in/banners/categories/bracelets.webp',
    href: '/collections?category=bracelets',
  },
];

function CompactCategoryCard({
  item,
  index,
}: {
  item: CategoryItem;
  index: number;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Link
        href={item.href}
        className="group relative block rounded-xl overflow-hidden aspect-[4/5]"
      >
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-neutral-100 animate-pulse rounded-xl" />
        )}

        {/* Image */}
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 33vw"
          onLoad={() => setImgLoaded(true)}
          priority={index === 0}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Content — bottom-aligned, compact */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
          <h3 className="font-serif text-lg md:text-xl font-medium mb-0.5 leading-tight">
            {item.title}
          </h3>
          <p className="text-xs opacity-75 italic font-light mb-2.5">
            {item.subtitle}
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium opacity-80 group-hover:opacity-100 group-hover:gap-2.5 transition-all duration-300">
            <span>Shop {item.title}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LuxuryCategories() {
  return (
    <section className="py-6 md:py-8 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header — compact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4 md:mb-6"
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-2 font-medium">
            Collections
          </p>
          <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-light text-[#1A1A1A] mb-1">
            Shop by Category
          </h2>
          <p className="text-xs text-neutral-500">
            Three essentials. Endless ways to style.
          </p>
        </motion.div>

        {/* 3-column grid — all equal, compact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {CATEGORIES.map((cat, i) => (
            <CompactCategoryCard key={cat.id} item={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
