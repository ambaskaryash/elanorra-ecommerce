# External Logging Configuration

This document describes how to configure external logging services for the Elanorra e-commerce application.

## Overview

The application supports multiple external logging services that can be configured via environment variables. The logging system is designed to be flexible and fail gracefully if services are not configured or unavailable.

## Supported Services

### 1. Sentry (Error Tracking)

Sentry provides real-time error tracking and performance monitoring.

**Environment Variables:**
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Installation:**
```bash
npm install @sentry/nextjs
```

**Features:**
- Real-time error tracking
- Performance monitoring
- User context tracking
- Stack trace analysis
- Error grouping and alerts

### 2. DataDog (Log Management)

DataDog provides comprehensive log management and monitoring.

**Environment Variables:**
```env
DATADOG_API_KEY=your-datadog-api-key
```

**Features:**
- Centralized log management
- Real-time log streaming
- Advanced filtering and search
- Custom dashboards and alerts
- Log correlation with metrics

### 3. AWS CloudWatch (Cloud Logging)

CloudWatch provides native AWS logging and monitoring.

**Environment Variables:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CLOUDWATCH_LOG_GROUP=/aws/lambda/elanorra-errors
```

**Installation:**
```bash
npm install @aws-sdk/client-cloudwatch-logs
```

**Features:**
- Native AWS integration
- Log retention policies
- CloudWatch Insights for querying
- Integration with other AWS services

### 4. Custom Webhook (Generic HTTP Endpoint)

Send logs to any HTTP endpoint for custom processing.

**Environment Variables:**
```env
ERROR_WEBHOOK_URL=https://your-webhook-endpoint.com/errors
```

**Features:**
- Flexible integration with any service
- Custom payload format
- Retry logic with exponential backoff
- Authentication headers support

### 5. Database Logging (Built-in)

Store error logs in the application database for analysis.

**Configuration:**
- Automatically enabled in production
- Uses the existing Prisma database connection
- Stores structured error data with indexing

**Features:**
- Persistent error storage
- Structured data with indexes
- Integration with admin dashboard
- Custom retention policies

## Configuration Examples

### Development Environment (.env.local)
```env
NODE_ENV=development
# Only console logging enabled in development
```

### Production Environment (.env.production)
```env
NODE_ENV=production

# Sentry Configuration
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# DataDog Configuration
DATADOG_API_KEY=your-datadog-api-key

# AWS CloudWatch Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CLOUDWATCH_LOG_GROUP=/aws/lambda/elanorra-errors

# Custom Webhook
ERROR_WEBHOOK_URL=https://your-logging-service.com/webhook

# Database logging is automatically enabled in production
```

## Error Log Structure

All external logging services receive a standardized error log structure:

```typescript
interface ErrorLog {
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
```

## Error Types

The system categorizes errors into the following types:

- `VALIDATION_ERROR` - Input validation failures
- `AUTHENTICATION_ERROR` - Authentication failures
- `AUTHORIZATION_ERROR` - Permission denied errors
- `NOT_FOUND_ERROR` - Resource not found
- `RATE_LIMIT_ERROR` - Rate limiting violations
- `DATABASE_ERROR` - Database operation failures
- `EXTERNAL_API_ERROR` - Third-party API failures
- `INTERNAL_ERROR` - Unexpected server errors

## Performance Considerations

- All external logging operations are performed asynchronously
- Failed logging operations don't affect the main application flow
- Dynamic imports are used to avoid bundling unused dependencies
- Parallel execution of multiple logging services
- Graceful degradation when services are unavailable

## Security Best Practices

1. **Environment Variables**: Store all API keys and secrets in environment variables
2. **Network Security**: Use HTTPS for all external logging endpoints
3. **Data Sanitization**: Sensitive data is automatically filtered from logs
4. **Access Control**: Restrict access to logging dashboards and APIs
5. **Retention Policies**: Configure appropriate log retention periods

## Monitoring and Alerts

### Recommended Alerts

1. **High Error Rate**: Alert when error rate exceeds threshold
2. **Critical Errors**: Immediate notification for 5xx errors
3. **Authentication Failures**: Alert on suspicious login attempts
4. **Database Errors**: Monitor database connectivity issues
5. **External API Failures**: Track third-party service outages

### Dashboard Metrics

- Error rate by type and endpoint
- Response time percentiles
- User error patterns
- Geographic error distribution
- Error resolution time

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Install required packages for each service
2. **Invalid Credentials**: Verify API keys and authentication
3. **Network Connectivity**: Check firewall and network settings
4. **Rate Limits**: Monitor API usage limits for external services
5. **Payload Size**: Ensure error details don't exceed service limits

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_LOGGING=true
```

This will output additional information about the logging process to the console.

## Migration Guide

### From Console Logging

1. Choose your preferred external logging service(s)
2. Install required dependencies
3. Configure environment variables
4. Deploy and verify logs are being received
5. Set up dashboards and alerts

### Adding New Services

1. Implement a new method in the `Logger` class
2. Add environment variable checks
3. Update the `sendToExternalLogger` method
4. Add configuration documentation
5. Test the integration

## Support

For issues with external logging configuration:

1. Check the application logs for error messages
2. Verify environment variable configuration
3. Test network connectivity to external services
4. Review service-specific documentation
5. Contact the development team for assistance