/**
 * Logger Utility - Structured logging for production
 * Supports different log levels and formats
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  userRole?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  private formatLog(level: LogLevel, message: string, error?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0 ? JSON.stringify(this.context) : '';
    const errorStr = error ? `\n${error.stack || error}` : '';

    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}${errorStr}`;
  }

  debug(message: string, metadata?: Record<string, any>) {
    const log = this.formatLog(LogLevel.DEBUG, message);
    console.log(log);

    if (metadata) {
      console.log('  Details:', metadata);
    }
  }

  info(message: string, metadata?: Record<string, any>) {
    const log = this.formatLog(LogLevel.INFO, message);
    console.log('ℹ️ ' + log);

    if (metadata) {
      console.log('  Details:', metadata);
    }
  }

  warn(message: string, error?: any, metadata?: Record<string, any>) {
    const log = this.formatLog(LogLevel.WARN, message, error);
    console.warn('⚠️ ' + log);

    if (metadata) {
      console.warn('  Details:', metadata);
    }
  }

  error(message: string, error?: any, metadata?: Record<string, any>) {
    const log = this.formatLog(LogLevel.ERROR, message, error);
    console.error('❌ ' + log);

    if (metadata) {
      console.error('  Details:', metadata);
    }
  }

  fatal(message: string, error?: any, metadata?: Record<string, any>) {
    const log = this.formatLog(LogLevel.FATAL, message, error);
    console.error('🔴 FATAL: ' + log);

    if (metadata) {
      console.error('  Details:', metadata);
    }

    // In production, this should trigger alerts
    if (process.env.NODE_ENV === 'production') {
      // Send alert to monitoring service
    }
  }
}

export const logger = new Logger();

export default logger;
