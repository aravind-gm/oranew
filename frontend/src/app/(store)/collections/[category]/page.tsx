'use client';

/**
 * Dynamic Collections Category Page
 * Handles routes like /collections/gifts, /collections/combos, etc.
 * Redirects to the main collections page with category query parameter
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  params: {
    category: string;
  };
}

export default function CollectionsCategoryPage({ params }: Props) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to collections page with category query param
    // This allows us to use the same collections page logic for all category routes
    router.push(`/collections?category=${encodeURIComponent(params.category)}`);
  }, [params.category, router]);

  // Return empty/loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-text-secondary">Loading collection...</p>
      </div>
    </div>
  );
}
