import { ReactNode } from 'react';
import { Metadata } from 'next';
import '../globals.css';
import './admin-dark-theme.css';
import AdminRootShell from './AdminRootShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminRootShell>{children}</AdminRootShell>;
}