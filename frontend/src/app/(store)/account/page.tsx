import AccountDashboard from '@/components/account/AccountDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Server-rendered Account Page
 *
 * 1. Reads access_token from HttpOnly cookies
 * 2. Calls backend /api/auth/me with that cookie
 * 3. If unauthenticated → redirects to login
 * 4. If authenticated  → renders real user data via <AccountDashboard>
 *
 * No client-side auth check, no placeholder UI, no race conditions.
 */
export default async function AccountPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // No token — middleware should catch this, but double-check
  if (!accessToken) {
    redirect('/auth/login?from=/account');
  }

  // Fetch real user from backend, forwarding the cookie
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `access_token=${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    // Token invalid / expired — redirect to login
    redirect('/auth/login?from=/account');
  }

  const data = await res.json();

  if (!data.success || !data.user) {
    redirect('/auth/login?from=/account');
  }

  // Pass verified user data to the client component
  return <AccountDashboard user={data.user} />;
}
