'use client';

/**
 * Redirect: /valentines-special → /collections/valentine-special
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ValentinesSpecialRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/collections/valentine-special');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-neutral-500 text-sm animate-pulse">Redirecting to Valentine&apos;s Special…</p>
    </div>
  );
}
