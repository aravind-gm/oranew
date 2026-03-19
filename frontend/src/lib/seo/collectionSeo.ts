import { cache } from 'react';

const SITE_URL = 'https://orashop.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.orashop.in/api';

export interface CategorySeoData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  seoContent?: string | null;
  isActive?: boolean;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CategoryListingProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  primaryImage: {
    id: string;
    imageUrl: string;
    altText?: string | null;
    isPrimary?: boolean;
  } | null;
  primaryImageAlt?: string | null;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  inStock?: boolean;
  stockQuantity?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CategoryListingResponse {
  products: CategoryListingProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface CategoryProductsParams {
  slug: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  material?: string;
  availability?: string;
  isTumbler?: boolean;
}

export function formatCategoryTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizeCategorySlug(rawSlug: string): string {
  const slug = rawSlug.toLowerCase().trim();
  if (slug === 'tumbler') return 'tumblers';
  return slug;
}

export function categoryTitleFallback(categoryName: string): string {
  return `Buy ${categoryName} Online | ORA Jewellery`;
}

export function categoryDescriptionFallback(categoryName: string): string {
  return `Shop premium ${categoryName} at ORA Jewellery.`;
}

export function toAbsoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return `${SITE_URL}/oralogo.png`;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export const getCategorySeo = cache(async (slug: string): Promise<CategorySeoData | null> => {
  try {
    const response = await fetch(`${API_URL}/categories/${encodeURIComponent(slug)}?minimal=true`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.data || null;
  } catch {
    return null;
  }
});

export const getCategoryProducts = cache(
  async ({
    slug,
    page = 1,
    limit = 24,
    sortBy = '-createdAt',
    material,
    availability,
    isTumbler,
  }: CategoryProductsParams): Promise<CategoryListingResponse> => {
    const params = new URLSearchParams({
      category: slug,
      page: String(page),
      limit: String(limit),
      view: 'listing',
      sortBy,
    });

    if (material) params.set('material', material);
    if (availability === 'in-stock') params.set('inStock', 'true');
    if (availability === 'new') params.set('isNew', 'true');
    if (availability === 'bestseller') params.set('isBestseller', 'true');
    if (isTumbler) params.set('isTumbler', 'true');

    try {
      const response = await fetch(`${API_URL}/products?${params.toString()}`, {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        return {
          products: [],
          pagination: { total: 0, page, limit, pages: 0 },
        };
      }

      const payload = await response.json();
      return {
        products: payload?.data || [],
        pagination: payload?.pagination || { total: 0, page, limit, pages: 0 },
      };
    } catch {
      return {
        products: [],
        pagination: { total: 0, page, limit, pages: 0 },
      };
    }
  }
);

export function buildCollectionPageJsonLd({
  category,
  products,
  canonicalUrl,
}: {
  category: CategorySeoData;
  products: CategoryListingProduct[];
  canonicalUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description:
      category.metaDescription || category.description || categoryDescriptionFallback(category.name),
    url: canonicalUrl,
    mainEntity: products.map((product) => ({
      '@type': 'Product',
      name: product.name,
      url: `${SITE_URL}/products/${product.slug}`,
      image: toAbsoluteUrl(product.primaryImage?.imageUrl),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: Number(product.finalPrice || product.price || 0).toFixed(2),
        availability:
          Number(product.stockQuantity || 0) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
    })),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Collections',
          item: `${SITE_URL}/collections`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: canonicalUrl,
        },
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'ORA Jewellery',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/oralogo.png`,
      },
    },
  };
}

export function buildCategoryBreadcrumbJsonLd({
  category,
  canonicalUrl,
}: {
  category: CategorySeoData;
  canonicalUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Collections',
        item: `${SITE_URL}/collections`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: canonicalUrl,
      },
    ],
  };
}

export const collectionSeoConstants = {
  SITE_URL,
  API_URL,
};
