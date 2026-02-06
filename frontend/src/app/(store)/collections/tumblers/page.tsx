'use client';

/**
 * Tumblers — /collections/tumblers
 * 
 * Category page for tumblers / drinkware.
 * Query: category = 'tumblers'
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function TumblersPage() {
  return (
    <CollectionPageShell
      config={{
        title: 'Tumblers',
        subtitle: 'Designed for everyday elegance',
        apiParams: {
          category: 'tumblers',
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
        emptyMessage: 'Tumblers are coming soon. Explore our full collection in the meantime.',
      }}
    />
  );
}
