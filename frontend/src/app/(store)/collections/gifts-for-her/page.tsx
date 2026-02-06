'use client';

/**
 * Gifts for Her — /collections/gifts-for-her
 * 
 * Gifting-intent jewellery. Occasions: gift, birthday, anniversary.
 * Simplified filters: Price + Ready-to-ship only.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function GiftsForHerPage() {
  return (
    <CollectionPageShell
      config={{
        title: 'Gifts for Her',
        subtitle: 'Thoughtful jewellery for every moment',
        apiParams: {
          occasion: 'gift,birthday,anniversary',
        },
        defaultSort: 'popularity',
        filters: {
          showCategory: false,
          showPrice: true,
          showMaterial: false,
          showAvailability: true,
          showSort: true,
        },
        showBadges: true,
        showQuickAdd: true,
        emptyMessage: 'Gift-worthy pieces are being curated. Explore our full collection for ideas.',
      }}
    />
  );
}
