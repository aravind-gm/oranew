'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

interface LayoutShellProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  addToCartPopup: React.ReactNode;
  promotionalAds: React.ReactNode;
  children: React.ReactNode;
}

export default function LayoutShell({
  header,
  footer,
  addToCartPopup,
  promotionalAds,
  children,
}: LayoutShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    // Admin routes: no storefront header/footer/popups
    return (
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    );
  }

  // Storefront routes: full layout
  return (
    <>
      {header}
      <main className="min-h-screen">
        {children}
      </main>
      {footer}
      {addToCartPopup}
      {promotionalAds}
    </>
  );
}
