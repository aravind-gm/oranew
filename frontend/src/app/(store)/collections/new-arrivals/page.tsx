'use client';

/**
 * New Arrivals — /collections/new-arrivals
 * 
 * Latest designs, sorted by created_at DESC.
 * "New" badge only. No manual sorting. No best-seller logic.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function NewArrivalsPage() {
  return (
    <CollectionPageShell
      config={{
        title: 'New Arrivals',
        subtitle: 'Latest designs, just launched',
        apiParams: {
          status: 'active',
          isNew: true,
        },
        defaultSort: 'newest',
        filters: {
          showCategory: true,
          showPrice: true,
          showMaterial: true,
          showAvailability: false,
          showSort: false,
        },
        showBadges: true,
        showQuickAdd: true,
        badgeOverride: 'new-only',
        emptyMessage: 'New pieces are being added soon. Explore our full collection in the meantime.',
      }}
    />
  );
}
