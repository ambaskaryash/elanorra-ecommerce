import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { applySecurityHeaders, applyRateLimit, configureCORS, defaultSecurityConfig } from '@/lib/security';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Apply security headers
  const response = NextResponse.next();
  applySecurityHeaders(response, defaultSecurityConfig);

  // Configure CORS
  configureCORS(req, response);

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(req);
  if (!rateLimitResult.allowed) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rateLimitResult.resetTime || Date.now()) / 1000)),
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetTime || Date.now()),
      }
    });
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    // Additional admin route protection
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Note: Admin check will need to be implemented in the actual admin pages
      // since we can't easily access the database in middleware
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