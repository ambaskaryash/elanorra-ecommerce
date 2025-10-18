import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest, identifier?: string) => {
    const now = Date.now();
    const key = identifier || getClientIdentifier(request);
    
    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
    
    // Initialize or get current count
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }
    
    // Increment count
    store[key].count++;
    
    // Check if limit exceeded
    if (store[key].count > config.maxRequests) {
      const resetTime = new Date(store[key].resetTime);
      return {
        success: false,
        error: config.message || 'Too many requests, please try again later.',
        resetTime,
        remaining: 0,
      };
    }
    
    return {
      success: true,
      remaining: config.maxRequests - store[key].count,
      resetTime: new Date(store[key].resetTime),
    };
  };
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for different proxy setups)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  let ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  return ip.trim();
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
  
  // Moderate limits for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Too many API requests, please slow down.',
  },
  
  // Lenient limits for general endpoints
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    message: 'Too many requests, please slow down.',
  },
  
  // Very strict for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    message: 'Too many password reset attempts, please try again in 1 hour.',
  },
  
  // Newsletter subscription
  newsletter: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 subscriptions per hour
    message: 'Too many subscription attempts, please try again later.',
  },
};

// Helper function to create rate limit response
export function createRateLimitResponse(error: string, resetTime: Date) {
  return new Response(
    JSON.stringify({
      error,
      resetTime: resetTime.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString(),
      },
    }
  );
}