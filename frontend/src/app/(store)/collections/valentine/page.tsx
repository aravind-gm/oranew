'use client';

/**
 * Valentine's Collection — /collections/valentine
 * 
 * Seasonal Valentine's curated page.
 * Query: collection = 'valentine', status = 'active'
 * Rules: Curated order, emotion > filters, hide technical filters.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function ValentinePage() {
  return (
    <CollectionPageShell
      config={{
        title: "Valentine's Collection",
        subtitle: 'Crafted to celebrate love',
        apiParams: {
          collection: 'valentine',
          status: 'active',
        },
        defaultSort: 'popularity',
        filters: {
          showCategory: false,
          showPrice: true,
          showMaterial: false,
          showAvailability: false,
          showSort: false,
        },
        showBadges: true,
        showQuickAdd: true,
        emptyMessage: "Our Valentine's collection is being prepared. Check back soon for pieces crafted to celebrate love.",
      }}
    />
  );
}
