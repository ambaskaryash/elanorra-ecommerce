import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
}

export class CustomError extends Error {
  public type: ErrorType;
  public statusCode: number;
  public details?: any;

  constructor(type: ErrorType, message: string, statusCode: number, details?: any) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'CustomError';
  }
}

// Predefined error classes
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(ErrorType.VALIDATION, message, 400, details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(ErrorType.AUTHENTICATION, message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorType.AUTHORIZATION, message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(ErrorType.NOT_FOUND, `${resource} not found`, 404);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(ErrorType.RATE_LIMIT, message, 429);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed') {
    super(ErrorType.DATABASE, message, 500);
  }
}

export class ExternalAPIError extends CustomError {
  constructor(service: string, message?: string) {
    super(
      ErrorType.EXTERNAL_API,
      message || `External service ${service} is unavailable`,
      503
    );
  }
}

// Error logging interface
export interface ErrorLog {
  timestamp: Date;
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
}

// Logger class
export class Logger {
  private static instance: Logger;
  private logs: ErrorLog[] = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(error: ErrorLog): void {
    this.logs.push(error);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Log:', {
        timestamp: error.timestamp.toISOString(),
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack,
      });
    }

    // In production, you might want to send logs to external services
    // like Sentry, LogRocket, or your own logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(error);
    }
  }

  private sendToExternalLogger(error: ErrorLog): void {
    // TODO: Implement external logging service integration
    // Examples:
    // - Sentry.captureException(error)
    // - Send to CloudWatch, DataDog, etc.
    // - Store in database for analysis
  }

  public getLogs(): ErrorLog[] {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

// Global error handler
export function handleError(error: unknown, context?: {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
}): NextResponse {
  const logger = Logger.getInstance();
  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof CustomError) {
    appError = {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    };
  } else if (error instanceof ZodError) {
    appError = {
      type: ErrorType.VALIDATION,
      message: 'Validation failed',
      statusCode: 400,
      details: error.issues,
      stack: error.stack,
    };
  } else if (error instanceof Error) {
    // Check for specific database errors
    if (error.message.includes('Unique constraint')) {
      appError = {
        type: ErrorType.DATABASE,
        message: 'Resource already exists',
        statusCode: 409,
        details: error.message,
        stack: error.stack,
      };
    } else if (error.message.includes('Record to update not found')) {
      appError = {
        type: ErrorType.NOT_FOUND,
        message: 'Resource not found',
        statusCode: 404,
        details: error.message,
        stack: error.stack,
      };
    } else {
      appError = {
        type: ErrorType.INTERNAL,
        message: 'Internal server error',
        statusCode: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: error.stack,
      };
    }
  } else {
    appError = {
      type: ErrorType.INTERNAL,
      message: 'Unknown error occurred',
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    };
  }

  // Log the error
  logger.log({
    timestamp: new Date(),
    type: appError.type,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    stack: appError.stack,
    ...context,
  });

  // Return appropriate response
  const responseBody: any = {
    error: appError.message,
    type: appError.type,
  };

  // Include details in development mode
  if (process.env.NODE_ENV === 'development' && appError.details) {
    responseBody.details = appError.details;
  }

  return NextResponse.json(responseBody, { status: appError.statusCode });
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error, {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        // IP extraction would need to be implemented based on your setup
      });
    }
  };
}

// Client-side error boundary helper
export function logClientError(error: Error, errorInfo?: any): void {
  const logger = Logger.getInstance();
  
  logger.log({
    timestamp: new Date(),
    type: ErrorType.INTERNAL,
    message: error.message,
    statusCode: 0, // Client-side error
    details: errorInfo,
    stack: error.stack,
  });
}

// Validation helper
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }
}

// Performance monitoring
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      if (duration > 1000) { // Log slow operations
        console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
      }
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Operation failed: ${operation} failed after ${duration}ms`, error);
      reject(error);
    }
  });
}