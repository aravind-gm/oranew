/**
 * Server-side Redirect: /valentines-special → /collections/valentine-special
 * Using Next.js redirect() for SEO-friendly 308 permanent redirect
 */

import { redirect } from 'next/navigation';

export default function ValentinesSpecialRedirect() {
  redirect('/collections/valentine-special');
}

