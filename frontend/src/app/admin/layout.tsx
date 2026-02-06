import { ReactNode } from 'react';
import '../globals.css';
import './admin-dark-theme.css';
import AdminRootShell from './AdminRootShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminRootShell>{children}</AdminRootShell>;
}