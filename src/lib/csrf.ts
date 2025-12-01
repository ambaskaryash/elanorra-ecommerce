import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  generateCSRFToken, 
  validateCSRFToken,
} from '@/lib/validation';

// CSRF token configuration
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const CSRF_TOKEN_MAX_AGE = 3600000; // 1 hour in milliseconds

export interface CSRFTokenData {
  token: string;
  timestamp: number;
}

/**
 * Generate a new CSRF token with timestamp
 */
export function generateCSRFTokenWithTimestamp(): CSRFTokenData {
  return {
    token: generateCSRFToken(),
    timestamp: Date.now()
  };
}

/**
 * Get CSRF token from request headers or cookies
 */
export function getCSRFTokenFromRequestHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER);
}

export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFTokenFromRequest(request: NextRequest): boolean {
  const headerToken = getCSRFTokenFromRequestHeader(request);
  const cookieToken = getCSRFTokenFromCookie(request);
  if (!headerToken || !cookieToken) {
    return false;
  }
  // Double-submit cookie pattern: compare header token to cookie token using HMAC secret
  return validateCSRFToken(headerToken, cookieToken, CSRF_SECRET);
}

/**
 * CSRF protection middleware for API routes
 * Use this for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse | Response>
): Promise<NextResponse> {
  // Skip CSRF protection for GET and HEAD requests
  if (request.method === 'GET' || request.method === 'HEAD') {
    const result = await handler(request);
    return result instanceof NextResponse ? result : new NextResponse(result.body, result);
  }

  // Skip CSRF protection in development if explicitly disabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
    console.warn('⚠️ CSRF protection disabled in development');
    const result = await handler(request);
    return result instanceof NextResponse ? result : new NextResponse(result.body, result);
  }

  try {
    // Validate CSRF token by comparing header and cookie values
    const isValidCSRF = validateCSRFTokenFromRequest(request);
    if (!isValidCSRF) {
      console.warn(`CSRF validation failed on ${request.method} ${request.url}`);
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // CSRF validation passed, proceed with the request
    const result = await handler(request);
    return result instanceof NextResponse ? result : new NextResponse(result.body, result);
  } catch (error) {
    console.error('CSRF protection error:', error);
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to get a new CSRF token
 * This should be called by the frontend to get a token before making state-changing requests
 */
export async function generateCSRFTokenResponse(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const tokenData = generateCSRFTokenWithTimestamp();
    
    // Create response with CSRF token
    const response = NextResponse.json({
      csrfToken: tokenData.token,
      expiresAt: tokenData.timestamp + CSRF_TOKEN_MAX_AGE
    });

    // Set CSRF token in cookie (httpOnly for security, server compares cookie vs header)
    response.cookies.set(CSRF_TOKEN_COOKIE, tokenData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_MAX_AGE / 1000, // Convert to seconds
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create CSRF-protected API route handler
 */
export function createCSRFProtectedHandler(
  handlers: {
    GET?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>;
    POST?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>;
    PUT?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>;
    DELETE?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>;
    PATCH?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>;
  }
) {
  return {
    GET: handlers.GET,
    POST: handlers.POST ? (req: NextRequest, ...args: any[]) => 
      withCSRFProtection(req, (r) => handlers.POST!(r, ...args)) : undefined,
    PUT: handlers.PUT ? (req: NextRequest, ...args: any[]) => 
      withCSRFProtection(req, (r) => handlers.PUT!(r, ...args)) : undefined,
    DELETE: handlers.DELETE ? (req: NextRequest, ...args: any[]) => 
      withCSRFProtection(req, (r) => handlers.DELETE!(r, ...args)) : undefined,
    PATCH: handlers.PATCH ? (req: NextRequest, ...args: any[]) => 
      withCSRFProtection(req, (r) => handlers.PATCH!(r, ...args)) : undefined,
  };
}