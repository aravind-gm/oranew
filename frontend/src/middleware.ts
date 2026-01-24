import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // IMPORTANT: This middleware does NOT redirect checkout routes to login.
  // Authentication for checkout is handled by the pages themselves using Zustand authStore
  // and Axios interceptors. This prevents double-redirect issues.
  
  const pathname = request.nextUrl.pathname;
  
  // Checkout routes are NOT protected at middleware level
  // They use client-side hydration-aware auth checks instead
  // This allows the auth state to load from localStorage before checking
  if (pathname.startsWith('/checkout')) {
    // Allow all checkout routes to proceed
    // The page components will check auth when they hydrate
    return NextResponse.next();
  }
  
  // Auth routes are always accessible
  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  // Public routes
  if (pathname === '/' || pathname.startsWith('/products')) {
    return NextResponse.next();
  }
  
  // All other routes proceed normally
  // (e.g., admin routes, dashboard, etc.)
  return NextResponse.next();
}

// Configure which routes use this middleware
// We're not protecting any routes at middleware level for auth
// All auth is handled client-side to support hydration-based state
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
