'use client';

import api from '@/lib/api';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent: number;
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
  limit?: number;
}

export default function RelatedProducts({
  categoryId,
  currentProductId,
  limit = 4,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products`, {
          params: {
            category: categoryId,
            limit: limit + 1, // Fetch extra in case current product is included
          },
        });

        const filtered = response.data.data.products.filter(
          (p: Product) => p.id !== currentProductId
        );

        setProducts(filtered.slice(0, limit));
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchRelatedProducts();
    }
  }, [categoryId, currentProductId, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
