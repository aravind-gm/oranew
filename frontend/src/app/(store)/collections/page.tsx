'use client';

/**
 * Shop All — /collections
 * 
 * Full catalogue view. All active products, sorted by popularity.
 * Complete filter rail: Category, Price, Material, Availability, Sort.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function ShopAllPage() {
  return (
    <CollectionPageShell
      config={{
        title: 'All Jewellery',
        subtitle: 'Explore our complete collection',
        apiParams: {
          status: 'active',
        },
        defaultSort: 'popularity',
        filters: {
          showCategory: true,
          showPrice: true,
          showMaterial: true,
          showAvailability: true,
          showSort: true,
        },
        showBadges: true,
        showQuickAdd: true,
      }}
    />
  );
}
