import TumblersCollectionClient from '@/components/collections/TumblersCollectionClient';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  categoryDescriptionFallback,
  categoryTitleFallback,
  getCategoryProducts,
  getCategorySeo,
  toAbsoluteUrl,
} from '@/lib/seo/collectionSeo';
import type { Metadata } from 'next';

const SITE_URL = 'https://orashop.in';
const CATEGORY_SLUG = 'tumblers';

function canonicalUrl(): string {
  return `${SITE_URL}/collections/${CATEGORY_SLUG}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const category = await getCategorySeo(CATEGORY_SLUG);
  const categoryName = category?.name || 'Tumblers';
  const title = category?.metaTitle || categoryTitleFallback(categoryName);
  const description =
    category?.metaDescription ||
    category?.description ||
    categoryDescriptionFallback(categoryName);
  const canonical = category?.canonicalUrl || canonicalUrl();
  const image = toAbsoluteUrl(category?.ogImage || category?.imageUrl || '/oralogo.png');

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
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

export default async function TumblersPage() {
  const [category, listing] = await Promise.all([
    getCategorySeo(CATEGORY_SLUG),
    getCategoryProducts({
      slug: CATEGORY_SLUG,
      page: 1,
      limit: 50,
      sortBy: '-createdAt',
      isTumbler: true,
    }),
  ]);

  const resolvedCategory =
    category ||
    ({
      id: 'virtual-tumblers',
      name: 'Tumblers',
      slug: CATEGORY_SLUG,
      description: 'Premium tumblers and mugs by ORA Jewellery.',
    } as const);

  const canonical = category?.canonicalUrl || canonicalUrl();

  const collectionSchema = buildCollectionPageJsonLd({
    category: resolvedCategory,
    products: listing.products,
    canonicalUrl: canonical,
  });

  const breadcrumbSchema = buildCategoryBreadcrumbJsonLd({
    category: resolvedCategory,
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
      <TumblersCollectionClient initialProducts={listing.products} />
    </>
  );
}
