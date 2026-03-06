'use client';

/**
 * ShopByCategory — Lifestyle Image Category Grid
 * 
 * Purpose: Visual browsing by jewellery category.
 * UX: Lifestyle images with elegant overlay, poetic subtitles,
 *      click routes to category collection page.
 * Motion: Fade + scale on scroll, image zoom on hover.
 * Mobile: Single column stacked cards.
 */

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

interface ShopByCategoryProps {
  heading?: string;
  subheading?: string;
  categories?: CategoryItem[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    title: 'Necklaces',
    subtitle: 'Layered, minimal, or statement',
    image: 'https://cdn.orashop.in/banners/categories/necklaces.webp',
    href: '/collections?category=necklaces',
  },
  {
    id: 2,
    title: 'Rings',
    subtitle: 'Contemporary rings for every occasion',
    image: 'https://cdn.orashop.in/banners/categories/rings.webp',
    href: '/collections?category=rings',
  },
  {
    id: 3,
    title: 'Bracelets',
    subtitle: 'Delicate accents for the wrist',
    image: 'https://cdn.orashop.in/banners/categories/bracelets.webp',
    href: '/collections?category=bracelets',
  },
];

export default function ShopByCategory({
  heading = 'Shop by Category',
  subheading = 'Browse our curated collections',
  categories = DEFAULT_CATEGORIES,
}: ShopByCategoryProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
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
            {heading}
          </h2>
        </motion.div>

        {/* Clean 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {categories.map((cat, index) => (
            <CategoryCard key={cat.id} item={cat} index={index} variant="large" />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  item,
  index,
  variant,
}: {
  item: CategoryItem;
  index: number;
  variant: 'large' | 'small';
}) {
  const aspectClass = variant === 'large' ? 'aspect-[4/3] md:aspect-[16/10]' : 'aspect-[4/3]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link
        href={item.href}
        className={`group relative block ${aspectClass} rounded-2xl overflow-hidden`}
      >
        {/* Image */}
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes={variant === 'large' ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 33vw'}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7 text-white">
          <h3 className="text-lg md:text-2xl font-serif font-medium mb-1">
            {item.title}
          </h3>
          <p className="text-sm md:text-base opacity-80 italic mb-3 font-light">
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
