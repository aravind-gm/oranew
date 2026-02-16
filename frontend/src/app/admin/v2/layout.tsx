import { Cormorant_Garamond, Inter } from 'next/font/google';
import { ReactNode } from 'react';
import '../../globals.css';
import './admin-v2-reset.css';

// Force dynamic rendering to prevent static pre-rendering
// Static pages can't access auth cookies, causing redirect loops
export const dynamic = 'force-dynamic';

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

export const metadata = {
  title: 'ORA Admin Panel - Jewellery Store Management',
  description: 'Enterprise-grade admin panel for ORA Jewellery store management',
};

export default function AdminV2Layout({ children }: { children: ReactNode }) {
  return (
    <div 
      data-admin-v2="true"
      className={`${inter.variable} ${cormorant.variable} font-sans`}
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f6f7f9',
        color: '#111827',
        minHeight: '100vh',
        isolation: 'isolate',
      }}
    >
      {children}
    </div>
  );
}
