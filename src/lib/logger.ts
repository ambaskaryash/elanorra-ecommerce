export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error | unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatError(error: unknown): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      };
    }
    return { message: String(error) };
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: unknown) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = this.formatError(error);
    }

    // In development, print readable logs
    if (this.isDevelopment) {
      const color = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[90m', // Gray
      }[level];
      const reset = '\x1b[0m';

      console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`);
      if (context) console.log('Context:', context);
      if (error) console.error('Error:', error);
      return;
    }

    // In production, print structured JSON logs for Vercel/CloudWatch/Datadog
    console.log(JSON.stringify(entry));
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: unknown) {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: unknown, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
