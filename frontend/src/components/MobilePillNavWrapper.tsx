'use client';

import { useAuthStore } from '@/store/authStore';
import MobilePillNav from './MobilePillNav';

export default function MobilePillNavWrapper() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <MobilePillNav 
      items={[
        { label: '💕 Valentine\'s', href: '/valentine-drinkware', icon: '💕' },
        { label: 'Collections', href: '/collections' },
        { label: 'Our Story', href: '/about' },
        { label: 'Contact', href: '/contact' },
        ...(isAdmin ? [{ label: 'Admin', href: '/admin' }] : [])
      ]}
    />
  );
}
