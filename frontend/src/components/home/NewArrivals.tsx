'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// This will be replaced with actual API call
const products = [
  { id: 1, name: 'Rose Gold Pendant', price: 2499, image: '', category: 'Necklaces' },
  { id: 2, name: 'Pearl Earrings', price: 1899, image: '', category: 'Earrings' },
  { id: 3, name: 'Crystal Bracelet', price: 1599, image: '', category: 'Bracelets' },
  { id: 4, name: 'Statement Ring', price: 999, image: '', category: 'Rings' },
];

export default function NewArrivals() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.section
      className="border-t border-border/20"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
    >
      <div className="section-luxury bg-background">
        <div className="container-luxury">
          {/* Header Block */}
          <div className="mb-8 lg:mb-12">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-4">
              Just In
            </p>

            {/* Title + Secondary CTA Row */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-baseline gap-6">
              <div className="flex-1">
                <h2 className="heading-section mb-2">New Arrivals</h2>
                <p className="text-luxury max-w-lg text-text-secondary">
                  Latest designs, thoughtfully curated.
                </p>
              </div>
              <Link
                href="/products/new"
                className="btn-outline hidden lg:inline-flex whitespace-nowrap"
              >
                View All →
              </Link>
            </div>
          </div>

          {/* Products Grid */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-16 lg:mb-24"
            variants={containerVariants}
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={itemVariants} className="group">
                {/* Product Card */}
                <Link href={`/products/${product.id}`} className="block h-full">
                  <div className="bg-background-white rounded-2xl shadow-luxury overflow-hidden transition-all duration-500 hover:shadow-luxury-lg hover:-translate-y-2 h-full flex flex-col">
                    {/* Image Container */}
                    <div className="relative aspect-square bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform duration-500">
                          <svg className="w-10 h-10 lg:w-12 lg:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                      </div>
                      {/* Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-block bg-gradient-to-r from-accent to-primary text-background-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          New
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 lg:p-6 flex flex-col justify-between">
                      {/* Category */}
                      <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-2">
                        {product.category}
                      </p>

                      {/* Title */}
                      <h3 className="font-serif text-lg lg:text-xl font-light text-text-primary mb-3 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="border-t border-border pt-4">
                        <p className="text-lg font-serif font-semibold text-accent">
                          ₹{product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile CTA */}
          <div className="lg:hidden mb-16">
            <Link
              href="/products/new"
              className="btn-outline w-full block text-center py-3"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="border-b border-border/20" />
    </motion.section>
  );
}
