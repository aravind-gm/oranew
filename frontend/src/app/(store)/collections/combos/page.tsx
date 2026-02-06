'use client';

/**
 * Combos for Her — /collections/combos
 * 
 * Jewellery bundles / combo sets.
 * Query: is_combo = true
 * UI: Show savings, CTA "Add Combo", no wishlist.
 */

import CollectionPageShell from '@/components/collections/CollectionPageShell';

export default function CombosPage() {
  return (
    <CollectionPageShell
      config={{
        title: 'Combos for Her',
        subtitle: 'Perfectly paired, better together',
        apiParams: {
          isCombo: true,
        },
        defaultSort: 'popularity',
        filters: {
          showCategory: false,
          showPrice: true,
          showMaterial: true,
          showAvailability: false,
          showSort: true,
        },
        showBadges: true,
        showQuickAdd: true,
        ctaLabel: 'Add Combo',
        emptyMessage: 'Combo sets are being curated. Explore our full collection in the meantime.',
      }}
    />
  );
}
