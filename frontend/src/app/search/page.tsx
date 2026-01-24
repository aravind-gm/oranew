'use client';

import ProductCard from '@/components/product/ProductCard';
import api from '@/lib/api';
import { useProductStore } from '@/store/productStore';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  averageRating?: number;
  reviewCount?: number;
  stockQuantity: number;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  // Get recently viewed from product store
  const { recentlyViewed } = useProductStore();

  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const response = await api.get(`/products?search=${encodeURIComponent(term)}&limit=24`);
      if (response.data.success) {
        setProducts(response.data.data?.products || []);
        setTotalResults(response.data.data?.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      handleSearch(query);
    }
  }, [query, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-primary/20 to-background py-16">
        <div className="container-luxury text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-4">
            Search Collection
          </h1>
          <p className="text-text-muted mb-8">Find your perfect piece of jewellery</p>
          
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-14 pr-32 rounded-2xl bg-background-white border border-border shadow-luxury focus:outline-none focus:ring-2 focus:ring-accent/30 text-text-primary"
                placeholder="Search for rings, necklaces, earrings..."
              />
              <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-accent text-background-white rounded-xl font-medium hover:bg-accent/90 transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container-luxury py-10">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Searching...</p>
          </div>
        ) : !searched ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-text-muted text-lg">Enter a search term to discover our collection</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-text-primary mb-2">No Results Found</h2>
            <p className="text-text-muted mb-6">We couldn&apos;t find any products matching &quot;{searchTerm}&quot;</p>
            <div className="space-y-4">
              <p className="text-sm text-text-muted">Try:</p>
              <ul className="text-sm text-text-muted space-y-1">
                <li>• Check your spelling</li>
                <li>• Use more general terms</li>
                <li>• Try different keywords</li>
              </ul>
            </div>
            <Link href="/products" className="btn-primary inline-block mt-6">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-text-muted">
                Found <span className="font-medium text-text-primary">{totalResults}</span> results for &quot;{searchTerm}&quot;
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Recently Viewed Section */}
        {!searched && recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-6">Recently Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentlyViewed.slice(0, 5).map((item) => (
                <Link 
                  key={item.productId} 
                  href={`/products/${item.slug}`}
                  className="group bg-background-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  <div className="aspect-square bg-primary/5 relative overflow-hidden">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-accent transition">
                      {item.name}
                    </h3>
                    <p className="text-sm font-serif font-bold text-accent mt-1">
                      ₹{item.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
