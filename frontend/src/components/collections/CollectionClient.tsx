'use client';

import ProductCardProduction from '@/components/product/ProductCardProduction';
import api from '@/lib/api';
import type { CategoryListingProduct, CategorySeoData } from '@/lib/seo/collectionSeo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

interface CollectionClientProps {
  category: CategorySeoData;
  initialProducts: CategoryListingProduct[];
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  initialSortBy: string;
  initialMaterial: string;
  initialAvailability: string;
}

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'finalPrice', label: 'Price: Low to High' },
  { value: '-finalPrice', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'new', label: 'New Arrivals' },
  { value: 'bestseller', label: 'Bestsellers' },
];

function toProductCardShape(product: CategoryListingProduct) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price || 0),
    finalPrice: Number(product.finalPrice || product.price || 0),
    discountPercent: Number(product.discountPercent || 0),
    averageRating: Number(product.averageRating || product.rating || 0),
    reviewCount: Number(product.reviewCount || 0),
    stockQuantity: Number(product.stockQuantity || 0),
    images: product.primaryImage
      ? [
          {
            id: product.primaryImage.id,
            imageUrl: product.primaryImage.imageUrl,
            altText: product.primaryImageAlt || product.primaryImage.altText || product.name,
            isPrimary: true,
          },
        ]
      : [
          {
            id: `${product.id}-fallback`,
            imageUrl: '/oralogo.png',
            altText: product.primaryImageAlt || product.name,
            isPrimary: true,
          },
        ],
  };
}

export default function CollectionClient({
  category,
  initialProducts,
  initialPagination,
  initialSortBy,
  initialMaterial,
  initialAvailability,
}: CollectionClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<CategoryListingProduct[]>(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [sortBy, setSortBy] = useState(initialSortBy || '-createdAt');
  const [material, setMaterial] = useState(initialMaterial || '');
  const [availability, setAvailability] = useState(initialAvailability || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardProducts = useMemo(() => products.map(toProductCardShape), [products]);

  const pushQueryState = useCallback(
    (nextPage: number, nextSortBy: string, nextMaterial: string, nextAvailability: string) => {
      // Keep filters/pagination reflected in URL so links remain shareable and crawlable.
      const params = new URLSearchParams();

      if (nextPage > 1) params.set('page', String(nextPage));
      if (nextSortBy && nextSortBy !== '-createdAt') params.set('sort', nextSortBy);
      if (nextMaterial) params.set('material', nextMaterial);
      if (nextAvailability) params.set('availability', nextAvailability);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const fetchProducts = useCallback(
    async (nextPage: number, nextSortBy: string, nextMaterial: string, nextAvailability: string) => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number | boolean> = {
          category: category.slug,
          page: nextPage,
          limit: pagination.limit || 24,
          sortBy: nextSortBy,
          // Backend listing view returns only SEO/listing-safe fields.
          view: 'listing',
        };

        if (nextMaterial) params.material = nextMaterial;
        if (nextAvailability === 'in-stock') params.inStock = true;
        if (nextAvailability === 'new') params.isNew = true;
        if (nextAvailability === 'bestseller') params.isBestseller = true;

        const response = await api.get('/products', { params });
        setProducts(response.data?.data || []);
        setPagination(response.data?.pagination || { page: 1, limit: 24, total: 0, pages: 0 });
        pushQueryState(nextPage, nextSortBy, nextMaterial, nextAvailability);
      } catch {
        setError('Unable to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [category.slug, pagination.limit, pushQueryState]
  );

  const handleSortChange = (value: string) => {
    setSortBy(value);
    fetchProducts(1, value, material, availability);
  };

  const handleMaterialChange = (value: string) => {
    setMaterial(value);
    fetchProducts(1, sortBy, value, availability);
  };

  const handleAvailabilityChange = (value: string) => {
    setAvailability(value);
    fetchProducts(1, sortBy, material, value);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || (pagination.pages > 0 && nextPage > pagination.pages)) return;
    fetchProducts(nextPage, sortBy, material, availability);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">{category.name}</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {category.seoContent || category.description || `Explore our ${category.name.toLowerCase()} collection.`}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
          <select
            value={sortBy}
            onChange={(event) => handleSortChange(event.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-300 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            value={material}
            onChange={(event) => handleMaterialChange(event.target.value)}
            placeholder="Filter by material"
            className="h-11 px-3 rounded-lg border border-neutral-300 text-sm"
          />

          <select
            value={availability}
            onChange={(event) => handleAvailabilityChange(event.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-300 text-sm"
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span className="text-sm text-neutral-500 md:ml-auto">
            {loading ? 'Loading...' : `${pagination.total} product${pagination.total === 1 ? '' : 's'}`}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!loading && cardProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-300 rounded-xl">
            <p className="text-neutral-600">No products found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {cardProducts.map((product) => (
              <ProductCardProduction key={product.id} product={product} showQuickAdd showBadges />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={loading || pagination.page <= 1}
              className="inline-flex items-center gap-1 px-4 h-10 border border-neutral-300 rounded-lg text-sm disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <span className="text-sm text-neutral-600">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={loading || pagination.page >= pagination.pages}
              className="inline-flex items-center gap-1 px-4 h-10 border border-neutral-300 rounded-lg text-sm disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
