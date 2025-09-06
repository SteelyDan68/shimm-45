/**
 * 🚀 PRODUCTION-READY LOGGING SYSTEM
 * 
 * Centralized logging with intelligent levels for SHIMMS stability
 * Eliminates console spam and provides structured error tracking
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogContext {
  component?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

class ShimmsLogger {
  private level: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO;
  private context: LogContext = {};

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const ctx = this.context.component ? `[${this.context.component}]` : '';
    return `${timestamp} ${level} ${ctx} ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
  }

  error(message: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }
}

export const logger = new ShimmsLogger();