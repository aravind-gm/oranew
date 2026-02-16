import { NextRequest, NextResponse } from 'next/server';

// ============================================
// PROTECTED ROUTES
// ============================================
const PROTECTED_ROUTES = ['/account', '/admin'];

// ============================================
// MIDDLEWARE MATCHER
// ============================================
// These routes will run through middleware
export const config = {
  matcher: [
    // Admin and account routes
    '/admin/:path*',
    '/account/:path*',
    // Auth routes that need to check if already logged in
    '/auth/login',
    '/auth/complete-profile',
  ],
};

/**
 * Simple JWT decode without verification
 * Only use for reading claims, not for security validation
 * Security validation happens on backend
 */
function decodeJWT(token: string): any {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[Middleware] Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
    return decoded;
  } catch (error) {
    console.error('[Middleware] JWT decode error:', error);
    return null;
  }
}

/**
 * Main middleware handler
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // STEP 1: Read access_token from cookies
  // ============================================
  const accessToken = request.cookies.get('access_token')?.value;

  // ============================================
  // STEP 2: Handle protected routes (/admin, /account)
  // ============================================
  if (pathname.startsWith('/admin') || pathname.startsWith('/account')) {
    if (!accessToken) {
      // No token - redirect to login
      console.log('[Middleware] ❌ No access_token in cookies, redirecting to login from', pathname);
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Decode token to check expiration and role
    const decoded = decodeJWT(accessToken);

    if (!decoded) {
      // Invalid token format
      console.log('[Middleware] ❌ Invalid token format, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Check token expiration
    if (decoded.exp) {
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      if (Date.now() > expiryTime) {
        // Token expired
        console.log('[Middleware] ❌ Token expired, redirecting to login');
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        // Clear expired cookies
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        return response;
      }
    }

    // ============================================
    // STEP 3: Admin-specific checks
    // ============================================
    if (pathname.startsWith('/admin')) {
      const userRole = decoded.role || decoded.user_role;

      if (userRole !== 'ADMIN') {
        // Not an admin - redirect to account
        console.log('[Middleware] ❌ User role is', userRole, 'not ADMIN, redirecting to /account');
        return NextResponse.redirect(new URL('/account', request.url));
      }

      // Admin check passed
      console.log('[Middleware] ✅ Admin access granted for user with role:', userRole);
    }

    // ============================================
    // STEP 4: Account route checks
    // ============================================
    if (pathname.startsWith('/account')) {
      // Account requires valid token, which we already verified above
      console.log('[Middleware] ✅ Account access granted');
    }

    // Token is valid - allow access
    // Modify response headers to pass user info (for client hydration)
    const response = NextResponse.next();
    
    // Pass decoded token info via response headers for client hydration
    response.headers.set('x-user-id', decoded.sub || decoded.userId || decoded.id || '');
    response.headers.set('x-user-role', decoded.role || decoded.user_role || 'user');
    response.headers.set('x-user-email', decoded.email || '');
    response.headers.set('x-auth-valid', 'true');
    
    return response;
  }

  // ============================================
  // STEP 5: Auth routes (/auth/login, /auth/complete-profile)
  // ============================================
  if (pathname === '/auth/login' || pathname === '/auth/complete-profile') {
    // If already logged in, redirect to account
    if (accessToken) {
      const decoded = decodeJWT(accessToken);

      if (decoded && (!decoded.exp || Date.now() < decoded.exp * 1000)) {
        // Valid token - already logged in
        console.log('[Middleware] ✅ User already logged in, redirecting from', pathname, 'to /account');
        return NextResponse.redirect(new URL('/account', request.url));
      }
    }
  }

  // Default: allow request to continue
  return NextResponse.next();
}
