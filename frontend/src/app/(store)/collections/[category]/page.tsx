import CollectionClient from '@/components/collections/CollectionClient';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  categoryDescriptionFallback,
  categoryTitleFallback,
  formatCategoryTitle,
  getCategoryProducts,
  getCategorySeo,
  normalizeCategorySlug,
  toAbsoluteUrl,
} from '@/lib/seo/collectionSeo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const SITE_URL = 'https://orashop.in';

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    material?: string;
    availability?: string;
  }>;
}

function normalizePage(value?: string): number {
  const parsed = Number(value || '1');
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function buildCanonical(baseCanonical: string, page: number): string {
  // Canonical policy: keep base URL for page 1, append page query for deeper pages.
  if (page <= 1) return baseCanonical;
  return `${baseCanonical}?page=${page}`;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const query = await searchParams;

  const categorySlug = normalizeCategorySlug(rawCategory);
  const page = normalizePage(query.page);
  const sort = query.sort || '-createdAt';
  const material = query.material || '';
  const availability = query.availability || '';

  const [category, listing] = await Promise.all([
    getCategorySeo(categorySlug),
    getCategoryProducts({
      slug: categorySlug,
      page,
      sortBy: sort,
      material,
      availability,
    }),
  ]);

  const fallbackName = formatCategoryTitle(categorySlug);
  const categoryName = category?.name || fallbackName;
  const defaultCanonical = `${SITE_URL}/collections/${categorySlug}`;
  const canonicalBase = category?.canonicalUrl || defaultCanonical;
  const canonical = buildCanonical(canonicalBase, page);

  // Invalid category or out-of-range pagination should not be indexed.
  const invalidPage = !category || !category.isActive || (listing.pagination.pages > 0 && page > listing.pagination.pages);

  const title = category?.metaTitle || categoryTitleFallback(categoryName);
  const description =
    category?.metaDescription ||
    category?.description ||
    categoryDescriptionFallback(categoryName);

  const image = toAbsoluteUrl(category?.ogImage || category?.imageUrl || '/oralogo.png');

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: invalidPage
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'ORA Jewellery',
      type: 'website',
      locale: 'en_IN',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: categoryName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function CollectionsCategoryPage({ params, searchParams }: Props) {
  const { category: rawCategory } = await params;
  const query = await searchParams;

  const categorySlug = normalizeCategorySlug(rawCategory);
  const page = normalizePage(query.page);
  const sort = query.sort || '-createdAt';
  const material = query.material || '';
  const availability = query.availability || '';

  const [category, listing] = await Promise.all([
    getCategorySeo(categorySlug),
    getCategoryProducts({
      slug: categorySlug,
      page,
      sortBy: sort,
      material,
      availability,
    }),
  ]);

  if (!category || !category.isActive) {
    notFound();
  }

  const baseCanonical = category.canonicalUrl || `${SITE_URL}/collections/${category.slug}`;
  const canonical = buildCanonical(baseCanonical, page);

  const collectionSchema = buildCollectionPageJsonLd({
    category,
    products: listing.products,
    canonicalUrl: canonical,
  });

  const breadcrumbSchema = buildCategoryBreadcrumbJsonLd({
    category,
    canonicalUrl: canonical,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <CollectionClient
        category={category}
        initialProducts={listing.products}
        initialPagination={listing.pagination}
        initialSortBy={sort}
        initialMaterial={material}
        initialAvailability={availability}
      />
    </>
  );
}
