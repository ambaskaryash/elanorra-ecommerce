// Security utilities for production deployment
import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableSecurityHeaders: boolean;
  allowedOrigins: string[];
  maxAge: number;
}

export const defaultSecurityConfig: SecurityConfig = {
  enableCSP: process.env.CSP_ENABLED === 'true',
  enableHSTS: process.env.HSTS_ENABLED === 'true',
  enableSecurityHeaders: process.env.SECURITY_HEADERS_ENABLED === 'true',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000'), // 30 days
};

/**
 * Content Security Policy configuration
 */
export const getCSPHeader = (nonce?: string): string => {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${nonce ? `'nonce-${nonce}'` : ''} https://js.razorpay.com https://checkout.razorpay.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
    "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://api.clerk.com https://*.api.clerk.com",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  return cspDirectives.join('; ');
};

/**
 * Security headers for production
 */
export const getSecurityHeaders = (config: SecurityConfig = defaultSecurityConfig) => {
  const headers: Record<string, string> = {};

  if (config.enableSecurityHeaders) {
    // Prevent clickjacking
    headers['X-Frame-Options'] = 'DENY';
    
    // Prevent MIME type sniffing
    headers['X-Content-Type-Options'] = 'nosniff';
    
    // Enable XSS protection
    headers['X-XSS-Protection'] = '1; mode=block';
    
    // Referrer policy
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    
    // Permissions policy
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
  }

  if (config.enableHSTS && process.env.NODE_ENV === 'production') {
    // HTTP Strict Transport Security
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  if (config.enableCSP) {
    // Content Security Policy
    headers['Content-Security-Policy'] = getCSPHeader();
  }

  return headers;
};

/**
 * Apply security headers to response
 */
export const applySecurityHeaders = (
  response: NextResponse,
  config: SecurityConfig = defaultSecurityConfig
): NextResponse => {
  const headers = getSecurityHeaders(config);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};

/**
 * CORS configuration
 */
export const configureCORS = (
  request: NextRequest,
  response: NextResponse,
  allowedOrigins: string[] = []
): NextResponse => {
  const origin = request.headers.get('origin');
  
  if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    // Only allow specified origins in production
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Simple in-memory rate limiter (use Redis in production)
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (record.count >= config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string, config: RateLimitConfig): number {
    const record = this.requests.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - record.count);
  }

  getResetTime(identifier: string): number | null {
    const record = this.requests.get(identifier);
    return record ? record.resetTime : null;
  }
}

export const rateLimiter = new InMemoryRateLimiter();

/**
 * Apply rate limiting to request
 */
export const applyRateLimit = (
  request: NextRequest,
  config: RateLimitConfig = defaultRateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number | null } => {
  // Use IP address as identifier (in production, consider using user ID for authenticated requests)
  const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
  
  const allowed = rateLimiter.isAllowed(identifier, config);
  const remaining = rateLimiter.getRemainingRequests(identifier, config);
  const resetTime = rateLimiter.getResetTime(identifier);

  return { allowed, remaining, resetTime };
};

/**
 * Validate environment variables for security
 */
export const validateSecurityEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required');
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Check NEXTAUTH_SECRET strength in production
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret && secret.length < 32) {
      errors.push('NEXTAUTH_SECRET should be at least 32 characters long in production');
    }

    if (!process.env.NEXTAUTH_URL) {
      errors.push('NEXTAUTH_URL is required in production');
    }

    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      errors.push('NEXTAUTH_URL should use HTTPS in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};