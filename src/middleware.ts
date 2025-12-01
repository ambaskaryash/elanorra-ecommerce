import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { applySecurityHeaders, applyRateLimit, configureCORS, defaultSecurityConfig } from '@/lib/security';

// Session timeout configuration (context-aware for e-commerce)
const SESSION_TIMEOUTS = {
  DEFAULT: 2 * 60 * 60 * 1000,      // 2 hours for regular browsing
  CHECKOUT: 15 * 60 * 1000,         // 15 minutes for checkout pages
  ADMIN: 30 * 60 * 1000,            // 30 minutes for admin panel
  CART: 60 * 60 * 1000,             // 1 hour for cart pages
} as const;

// Helper function to get timeout based on pathname
function getSessionTimeout(pathname: string): number {
  if (pathname.startsWith('/checkout')) {
    return SESSION_TIMEOUTS.CHECKOUT;
  }
  if (pathname.startsWith('/admin')) {
    return SESSION_TIMEOUTS.ADMIN;
  }
  if (pathname.includes('/cart') || pathname.includes('/account/orders')) {
    return SESSION_TIMEOUTS.CART;
  }
  return SESSION_TIMEOUTS.DEFAULT;
}

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Apply security headers
  const response = NextResponse.next();
  applySecurityHeaders(response, defaultSecurityConfig);

  // Configure CORS
  configureCORS(req, response);

  // Bypass middleware effects for API routes to avoid auth-related 500s
  // API routes handle their own auth logic where required
  if (req.nextUrl.pathname.startsWith('/api')) {
    return response;
  }

  // Apply rate limiting (skip for newsletter endpoints in development)
  const pathname = req.nextUrl.pathname;
  const isNewsletterEndpoint = pathname.startsWith('/api/newsletter') || pathname.startsWith('/api/newsletter/templates');
  const shouldBypassRateLimit = process.env.NODE_ENV !== 'production' && isNewsletterEndpoint;

  if (!shouldBypassRateLimit) {
    const rateLimitResult = applyRateLimit(req);
    if (!rateLimitResult.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime || Date.now()) / 1000)),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime || Date.now()),
        },
      });
    }
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Check session timeout
    if (sessionClaims) {
      const sessionCreatedAt = sessionClaims.iat ? sessionClaims.iat * 1000 : Date.now();
      const sessionAge = Date.now() - sessionCreatedAt;
      const currentTimeout = getSessionTimeout(req.nextUrl.pathname);
      
      if (sessionAge > currentTimeout) {
        // Session has expired, redirect to sign-in with a message
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('session_expired', 'true');
        return NextResponse.redirect(signInUrl);
      }
    }
    
    // Admin route protection - redirect to home with error message
    if (isAdminRoute(req)) {
      // Set a header to indicate admin access was attempted
      // The actual permission check will be done in the admin pages using RBAC
      response.headers.set('X-Admin-Route-Attempted', 'true');
      
      // Note: We can't easily check database permissions in middleware
      // So we'll handle the actual admin permission check in the admin pages
      // This ensures User Level profiles are redirected appropriately
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};