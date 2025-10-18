import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Admin-specific rate limiter with stricter limits
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // Limit each IP to 50 requests per windowMs for admin routes
  message: 'Too many admin requests from this IP, please try again later.',
});

export interface AdminMiddlewareOptions {
  requireSuperAdmin?: boolean;
  logAction?: string;
  requireConfirmation?: boolean;
}

export async function adminMiddleware(
  request: NextRequest,
  options: AdminMiddlewareOptions = {}
): Promise<NextResponse | null> {
  try {
    // Apply admin-specific rate limiting
    const rateLimitResult = await adminLimiter(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many admin requests',
          retryAfter: rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000) : 900
        },
        { status: 429 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin privileges
    if (!session.user.isAdmin) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized admin access attempt by user ${session.user.id} at ${new Date().toISOString()}`);
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Additional security checks
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Log admin action if specified
    if (options.logAction) {
      console.log(`Admin Action: ${session.user.id} - ${options.logAction} - IP: ${ip} - UA: ${userAgent} - ${new Date().toISOString()}`);
    }

    // Check for suspicious patterns
    if (userAgent && (
      userAgent.includes('bot') || 
      userAgent.includes('crawler') || 
      userAgent.includes('spider')
    )) {
      console.warn(`Suspicious admin access attempt from bot: ${userAgent} - IP: ${ip}`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // All checks passed
    return null;
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to wrap admin routes
export function withAdminAuth(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: AdminMiddlewareOptions = {}
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const middlewareResponse = await adminMiddleware(request, options);
    if (middlewareResponse) {
      return middlewareResponse;
    }
    return handler(request, ...args);
  };
}

// Security headers for admin routes
export function addAdminSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Admin-Route', 'true');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Admin session validation
export async function validateAdminSession(request: NextRequest): Promise<{
  valid: boolean;
  session?: any;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { valid: false, error: 'No session found' };
    }

    if (!session.user.isAdmin) {
      return { valid: false, error: 'Not an admin user' };
    }

    // Additional session validation can be added here
    // e.g., check session expiry, user status, etc.

    return { valid: true, session };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}