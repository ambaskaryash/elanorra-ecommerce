import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { applySecurityHeaders, applyRateLimit, configureCORS, defaultSecurityConfig } from '@/lib/security';

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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
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