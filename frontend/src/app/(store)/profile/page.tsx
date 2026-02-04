'use client';

import { redirect } from 'next/navigation';

// This page redirects to /account/profile for profile management
export default function ProfilePage() {
  redirect('/account/profile');
}
