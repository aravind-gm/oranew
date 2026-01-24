import { Cormorant_Garamond, Inter } from 'next/font/google';
import { ReactNode } from 'react';
import '../globals.css';
import './admin-dark-theme.css';

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

export default function AdminLayout({ children }: { children: ReactNode }) {
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
      {/* Admin Layout - Hard isolated dark theme */}
      {/* CSS containment prevents variable cascade to public site */}
      {/* data-admin-root attribute ensures NO color leakage to storefront */}
      {children}
    </div>
  );
}