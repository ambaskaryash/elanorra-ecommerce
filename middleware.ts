import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders, applyRateLimit, configureCORS, defaultSecurityConfig } from '@/lib/security';

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  
  // Create response
  let response = NextResponse.next();

  // Apply security headers to all requests
  response = applySecurityHeaders(response, defaultSecurityConfig);

  // Configure CORS for API routes
  if (pathname.startsWith('/api/')) {
    response = configureCORS(request, response, defaultSecurityConfig.allowedOrigins);
    
    // Apply rate limiting to API routes
    const rateLimit = applyRateLimit(request);
    
    if (!rateLimit.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime || Date.now()) / 1000)),
          'X-RateLimit-Limit': String(100),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime || Date.now()),
        }
      });
    }

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', String(100));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime || Date.now()));
  }

  // Guard admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const isAdmin = Boolean(token && (token as any).isAdmin);

      if (!token || !isAdmin) {
        const callbackUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(`${origin}/auth/login?redirect=${callbackUrl}`);
      }
    } catch {
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(`${origin}/auth/login?redirect=${callbackUrl}`);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};