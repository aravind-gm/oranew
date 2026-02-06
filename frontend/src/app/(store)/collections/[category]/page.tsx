'use client';

/**
 * Dynamic Collections Category Page
 * Handles routes like /collections/[category] for any category not
 * explicitly defined (new-arrivals, combos, gifts-for-her, valentine, tumblers, offers).
 * 
 * Renders a real collection page driven by the category slug from the URL.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';
import { use } from 'react';

interface Props {
  params: Promise<{
    category: string;
  }>;
}

function formatCategoryTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function CollectionsCategoryPage({ params }: Props) {
  const { category } = use(params);
  const title = formatCategoryTitle(category);

  return (
    <CollectionPageShell
      config={{
        title,
        subtitle: `Explore our ${title.toLowerCase()} collection`,
        apiParams: {
          category: category,
          status: 'active',
        },
        defaultSort: 'popularity',
        filters: {
          showCategory: false,
          showPrice: true,
          showMaterial: true,
          showAvailability: true,
          showSort: true,
        },
        showBadges: true,
        showQuickAdd: true,
        emptyMessage: `No products found in ${title}. Explore our full collection instead.`,
      }}
    />
  );
}
