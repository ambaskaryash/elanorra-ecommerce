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

    // In production, send logs to external services asynchronously
    // Don't await to avoid blocking the main thread
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(error).catch((err) => {
        console.error('Failed to send error to external logger:', err);
      });
    }
  }

  private async sendToExternalLogger(error: ErrorLog): Promise<void> {
    try {
      // Send to multiple external logging services based on environment configuration
      const promises: Promise<void>[] = [];

      // 1. Send to Sentry (if configured)
      if (process.env.SENTRY_DSN) {
        promises.push(this.sendToSentry(error));
      }

      // 2. Send to DataDog (if configured)
      if (process.env.DATADOG_API_KEY) {
        promises.push(this.sendToDataDog(error));
      }

      // 3. Send to CloudWatch (if configured)
      if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
        promises.push(this.sendToCloudWatch(error));
      }

      // 4. Send to custom webhook (if configured)
      if (process.env.ERROR_WEBHOOK_URL) {
        promises.push(this.sendToWebhook(error));
      }

      // 5. Store in database for analysis (always enabled in production)
      if (process.env.NODE_ENV === 'production') {
        promises.push(this.storeInDatabase(error));
      }

      // Execute all logging operations in parallel
      await Promise.allSettled(promises);
    } catch (logError) {
      // Fallback: log to console if external logging fails
      console.error('Failed to send error to external logger:', logError);
      console.error('Original error:', error);
    }
  }

  private async sendToSentry(error: ErrorLog): Promise<void> {
    try {
      // Dynamic import to avoid bundling Sentry if not used
      const sentryModule = await this.dynamicImport('@sentry/nextjs');
      if (!sentryModule) {
        console.warn('Sentry not installed. Install @sentry/nextjs to enable Sentry logging.');
        return;
      }

      sentryModule.withScope((scope: any) => {
        scope.setTag('errorType', error.type);
        scope.setLevel(this.getSentryLevel(error.statusCode));
        scope.setContext('errorDetails', {
          statusCode: error.statusCode,
          userId: error.userId,
          requestId: error.requestId,
          url: error.url,
          method: error.method,
          userAgent: error.userAgent,
          ip: error.ip,
        });
        
        if (error.userId) {
          scope.setUser({ id: error.userId });
        }

        const sentryError = new Error(error.message);
        sentryError.stack = error.stack;
        sentryModule.captureException(sentryError);
      });
    } catch (err) {
      console.error('Failed to send error to Sentry:', err);
    }
  }

  private async sendToDataDog(error: ErrorLog): Promise<void> {
    try {
      const response = await fetch('https://http-intake.logs.datadoghq.com/v1/input/' + process.env.DATADOG_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': process.env.DATADOG_API_KEY!,
        },
        body: JSON.stringify({
          ddsource: 'nodejs',
          ddtags: `env:${process.env.NODE_ENV},service:elanorra-ecommerce,error_type:${error.type}`,
          hostname: process.env.HOSTNAME || 'unknown',
          message: error.message,
          level: this.getDataDogLevel(error.statusCode),
          timestamp: error.timestamp.toISOString(),
          attributes: {
            error: {
              type: error.type,
              statusCode: error.statusCode,
              stack: error.stack,
              details: error.details,
            },
            request: {
              userId: error.userId,
              requestId: error.requestId,
              url: error.url,
              method: error.method,
              userAgent: error.userAgent,
              ip: error.ip,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`DataDog API responded with status: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to send error to DataDog:', err);
    }
  }

  private async sendToCloudWatch(error: ErrorLog): Promise<void> {
    try {
      // Dynamic import to avoid bundling AWS SDK if not used
      const awsModule = await this.dynamicImport('@aws-sdk/client-cloudwatch-logs');
      if (!awsModule) {
        console.warn('AWS SDK not installed. Install @aws-sdk/client-cloudwatch-logs to enable CloudWatch logging.');
        return;
      }

      const { CloudWatchLogsClient, PutLogEventsCommand } = awsModule;

      const client = new CloudWatchLogsClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const logGroupName = process.env.CLOUDWATCH_LOG_GROUP || '/aws/lambda/elanorra-errors';
      const logStreamName = `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`;

      const command = new PutLogEventsCommand({
        logGroupName,
        logStreamName,
        logEvents: [
          {
            timestamp: error.timestamp.getTime(),
            message: JSON.stringify({
              level: 'ERROR',
              message: error.message,
              type: error.type,
              statusCode: error.statusCode,
              stack: error.stack,
              details: error.details,
              userId: error.userId,
              requestId: error.requestId,
              url: error.url,
              method: error.method,
              userAgent: error.userAgent,
              ip: error.ip,
            }),
          },
        ],
      });

      await client.send(command);
    } catch (err) {
      console.error('Failed to send error to CloudWatch:', err);
    }
  }

  private async sendToWebhook(error: ErrorLog): Promise<void> {
    try {
      const response = await fetch(process.env.ERROR_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Elanorra-ErrorLogger/1.0',
        },
        body: JSON.stringify({
          timestamp: error.timestamp.toISOString(),
          level: 'error',
          service: 'elanorra-ecommerce',
          environment: process.env.NODE_ENV,
          error: {
            type: error.type,
            message: error.message,
            statusCode: error.statusCode,
            stack: error.stack,
            details: error.details,
          },
          request: {
            userId: error.userId,
            requestId: error.requestId,
            url: error.url,
            method: error.method,
            userAgent: error.userAgent,
            ip: error.ip,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to send error to webhook:', err);
    }
  }

  private async storeInDatabase(error: ErrorLog): Promise<void> {
    try {
      // Dynamic import to avoid bundling Prisma if not needed
      const prismaModule = await this.dynamicImport('@prisma/client');
      if (!prismaModule) {
        console.warn('Prisma client not available for database logging.');
        return;
      }

      const { PrismaClient } = prismaModule;
      const prisma = new PrismaClient();
      
      await prisma.errorLog.create({
        data: {
          timestamp: error.timestamp,
          type: error.type,
          message: error.message,
          statusCode: error.statusCode,
          stack: error.stack,
          details: error.details ? JSON.stringify(error.details) : null,
          userId: error.userId,
          requestId: error.requestId,
          userAgent: error.userAgent,
          ip: error.ip,
          url: error.url,
          method: error.method,
        },
      });

      await prisma.$disconnect();
    } catch (err) {
      console.error('Failed to store error in database:', err);
    }
  }

  private async dynamicImport(moduleName: string): Promise<any> {
    try {
      return await import(moduleName);
    } catch (error) {
      return null;
    }
  }

  private getSentryLevel(statusCode: number): 'error' | 'warning' | 'info' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warning';
    return 'info';
  }

  private getDataDogLevel(statusCode: number): 'error' | 'warn' | 'info' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
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