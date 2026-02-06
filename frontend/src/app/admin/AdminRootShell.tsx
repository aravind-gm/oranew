'use client';

import { usePathname } from 'next/navigation';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

export default function AdminRootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isV2 = pathname?.startsWith('/admin/v2');

  if (isV2) {
    // V2 admin: transparent wrapper, let v2/layout.tsx handle all styling
    return (
      <div
        data-admin-root="true"
        className={`${inter.variable} ${cormorant.variable}`}
        style={{
          minHeight: '100vh',
        }}
      >
        {children}
      </div>
    );
  }

  // Old admin: dark theme
  return (
    <div
      data-admin-root="true"
      style={{
        backgroundColor: '#111827',
        color: '#f3f4f6',
        minHeight: '100vh',
        isolation: 'isolate',
        contain: 'layout style paint',
      } as React.CSSProperties}
      className={`${inter.variable} ${cormorant.variable}`}
    >
      {children}
    </div>
  );
}
