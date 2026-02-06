'use client';

/**
 * Offers — /collections/offers
 * 
 * Products with active discounts.
 * Query: discount_percentage > 0
 * Rules: Subtle discount display, no loud colors, luxury pricing layout.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function OffersPage() {
  return (
    <CollectionPageShell
      config={{
        title: 'Offers',
        subtitle: 'Limited-time savings on selected designs',
        apiParams: {
          hasDiscount: true,
        },
        defaultSort: 'popularity',
        filters: {
          showCategory: true,
          showPrice: true,
          showMaterial: true,
          showAvailability: false,
          showSort: true,
        },
        showBadges: true,
        showQuickAdd: true,
        badgeOverride: 'discount-only',
        emptyMessage: 'No offers available right now. Check back soon for special pricing on selected designs.',
      }}
    />
  );
}
