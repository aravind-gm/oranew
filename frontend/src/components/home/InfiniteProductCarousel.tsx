'use client';

/**
 * InfiniteProductCarousel — Endless Discovery Strip
 * 
 * Purpose: Infinite horizontal product discovery loop.
 * UX: Auto-scrolling product cards, mixed jewellery + tumblers,
 *      hover pauses scroll, clicking navigates to PDP.
 * Motion: Smooth continuous marquee.
 * Mobile: Same auto-scroll, touch to pause.
 * Performance: Lazy images, GPU-accelerated transforms.
 */

import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  images: Array<{
    id?: string;
    imageUrl: string;
    isPrimary?: boolean;
    altText?: string;
  }>;
}

interface InfiniteProductCarouselProps {
  heading?: string;
  subheading?: string;
}

export default function InfiniteProductCarousel({
  heading = 'Discover More',
  subheading = 'An endless stream of pieces waiting to be yours',
}: InfiniteProductCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', {
        params: { limit: 12, sort: '-sales' },
      });
      setProducts(response.data.products || []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Auto-scroll animation
  const animate = useCallback(() => {
    if (!containerRef.current || isPaused || products.length === 0) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    scrollRef.current += 0.4;
    const container = containerRef.current;
    const halfWidth = container.scrollWidth / 2;

    if (scrollRef.current >= halfWidth) {
      scrollRef.current = 0;
    }

    container.style.transform = `translateX(-${scrollRef.current}px)`;
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isPaused, products.length]);

  useEffect(() => {
    if (products.length > 0) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate, products.length]);

  // Double products for seamless loop
  const displayProducts = [...products, ...products];

  if (products.length === 0) return null;

  const getImageUrl = (product: Product) => {
    const primary = product.images?.find(i => i.isPrimary);
    return primary?.imageUrl || product.images?.[0]?.imageUrl || '/banners.png';
  };

  return (
    <section className="py-12 md:py-20 bg-[#FDFBF7] overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-12 px-5"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] mb-3">
          {heading}
        </h2>
        <p className="text-base text-neutral-500 max-w-lg mx-auto">
          {subheading}
        </p>
      </motion.div>

      {/* Carousel */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          ref={containerRef}
          className="flex gap-4 md:gap-6 will-change-transform px-4"
          style={{ width: 'max-content' }}
        >
          {displayProducts.map((product, index) => (
            <Link
              key={`${product.id}-${index}`}
              href={`/products/${product.slug}`}
              className="group flex-shrink-0 w-[220px] sm:w-[260px] md:w-[280px]"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 mb-3">
                <Image
                  src={getImageUrl(product)}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="280px"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-[#1A1A1A] text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5">
                    View Product
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Product info */}
              <h3 className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-neutral-600 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  ₹{product.finalPrice?.toLocaleString('en-IN')}
                </span>
                {product.price > product.finalPrice && (
                  <span className="text-xs text-neutral-400 line-through">
                    ₹{product.price?.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
