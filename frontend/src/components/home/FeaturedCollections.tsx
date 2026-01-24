'use client';

import Link from 'next/link';

const collections = [
  {
    id: 1,
    name: 'Necklaces',
    slug: 'necklaces',
    image: '/placeholder-necklace.jpg',
    description: 'Elegant statement pieces',
  },
  {
    id: 2,
    name: 'Earrings',
    slug: 'earrings',
    image: '/placeholder-earrings.jpg',
    description: 'Delicate beauty',
  },
  {
    id: 3,
    name: 'Bracelets',
    slug: 'bracelets',
    image: '/placeholder-bracelet.jpg',
    description: 'Graceful adornments',
  },
  {
    id: 4,
    name: 'Rings',
    slug: 'rings',
    image: '/placeholder-ring.jpg',
    description: 'Timeless elegance',
  },
];

export default function FeaturedCollections() {
  return (
    <section className="section-luxury bg-background-white">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="heading-section mb-4">Our Collections</h2>
          <p className="text-luxury max-w-2xl mx-auto">
            Explore our carefully curated collections of premium artificial jewellery,
            each piece designed to complement your unique style.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/products/${collection.slug}`}
              className="group"
            >
              <div className="card-luxury overflow-hidden">
                <div className="relative aspect-[3/4] bg-background">
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                    {/* Placeholder - Replace with actual images */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>
                      <span className="text-sm">{collection.name}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-text-secondary">{collection.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
