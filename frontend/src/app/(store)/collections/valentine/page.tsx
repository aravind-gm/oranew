/**
 * Server-side Redirect: /collections/valentine → /collections/valentine-special
 * Using Next.js redirect() for SEO-friendly 308 permanent redirect
 */

import { redirect } from 'next/navigation';

export default function ValentinePage() {
  redirect('/collections/valentine-special');
}

