/**
 * 🚀 NCCS Production Logger System
 * Enterprise-grade logging för miljard-kronors applikationer
 * ZERO console.* statements i production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class ProductionLogger {
  private isDevelopment = import.meta.env.DEV;
  private sessionId = this.generateSessionId();
  private context: Record<string, any> = {};
  private userId?: string;

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setContext(newContext: Record<string, any>) {
    this.context = { ...this.context, ...newContext };
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.context = { ...this.context, userId };
  }

  clearContext() {
    this.context = {};
  }

  private createLogEntry(level: LogLevel, message: string, error?: Error, additionalContext?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...additionalContext },
      error,
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private sendToBackend(entry: LogEntry) {
    // I produktionsmiljö: skicka till logging edge function
    if (!this.isDevelopment) {
      try {
        // Send to Supabase edge function för server-side logging
        fetch('https://gcoorbcglxczmukzcmqs.supabase.co/functions/v1/log', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb29yYmNnbHhjem11a3pjbXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTE3NzYsImV4cCI6MjA2OTM4Nzc3Nn0.5gNGvMZ6aG3UXoYR6XbJPqn8L8ktMYaFbZIQ4mZTFf4`
          },
          body: JSON.stringify(entry)
        }).catch(() => {
          // Silent fail för logging - vi vill inte krascha appen
        });
      } catch {
        // Silent fail
      }
    }
  }

  private formatDevelopmentLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const contextStr = Object.keys(entry.context || {}).length > 0 
      ? `\n  Context: ${JSON.stringify(entry.context, null, 2)}` 
      : '';
    const errorStr = entry.error ? `\n  Error: ${entry.error.stack}` : '';
    
    return `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`;
  }

  debug(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('debug', message, undefined, context);
    
    if (this.isDevelopment) {
      console.debug(this.formatDevelopmentLog(entry));
    }
    this.sendToBackend(entry);
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, undefined, context);
    
    if (this.isDevelopment) {
      console.info(this.formatDevelopmentLog(entry));
    }
    this.sendToBackend(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, undefined, context);
    
    if (this.isDevelopment) {
      console.warn(this.formatDevelopmentLog(entry));
    }
    this.sendToBackend(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, error, context);
    
    if (this.isDevelopment) {
      console.error(this.formatDevelopmentLog(entry));
    }
    this.sendToBackend(entry);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('fatal', message, error, context);
    
    // Fatal errors alltid loggas, även i production
    console.error(`FATAL: ${message}`, error);
    this.sendToBackend(entry);
  }

  // Performance logging
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // API response logging
  apiResponse(endpoint: string, status: number, duration: number, context?: Record<string, any>) {
    const message = `API ${endpoint} responded with ${status} in ${duration}ms`;
    const logContext = { endpoint, status, duration, ...context };
    
    if (status >= 400) {
      this.error(message, undefined, logContext);
    } else {
      this.debug(message, logContext);
    }
  }

  // User action tracking
  userAction(action: string, context?: Record<string, any>) {
    this.info(`User action: ${action}`, { action_type: 'user_interaction', ...context });
  }

  // Success logging (for compatibility)
  success(message: string, context?: Record<string, any>) {
    this.info(`✅ ${message}`, context);
  }
}

// Performance logger class
class PerformanceLogger {
  private startTimes = new Map<string, number>();

  start(label: string) {
    this.startTimes.set(label, performance.now());
    logger.debug(`⏱️ Performance tracking started: ${label}`);
  }

  end(label: string) {
    const startTime = this.startTimes.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.startTimes.delete(label);
      logger.info(`⏱️ Performance tracking ended: ${label}`, { duration_ms: duration });
      return duration;
    }
    logger.warn(`Performance tracking not found for label: ${label}`);
    return 0;
  }

  measure(label: string, fn: () => any) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    logger.info(`⏱️ Performance measure: ${label}`, { duration_ms: duration });
    return result;
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    logger.info(`⏱️ Performance measure (async): ${label}`, { duration_ms: duration });
    return result;
  }

  // Legacy compatibility methods
  trackPerformance(metric: string, value: number, context?: Record<string, any>) {
    logger.info(`📊 Performance metric: ${metric}`, { metric, value, ...context });
  }

  trackMemory(context?: Record<string, any>) {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      logger.info('💾 Memory usage', { 
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        ...context 
      });
    }
  }
}

// Export singleton instances
export const logger = new ProductionLogger();
export const perfLogger = new PerformanceLogger();

// Development helper för migration
export const devLog = {
  log: (message: any, ...args: any[]) => logger.debug(String(message), { args }),
  error: (message: any, ...args: any[]) => logger.error(String(message), args[0] instanceof Error ? args[0] : undefined, { args }),
  warn: (message: any, ...args: any[]) => logger.warn(String(message), { args }),
  info: (message: any, ...args: any[]) => logger.info(String(message), { args })
};

// Production-safe console replacement (används under migration)
export const safeConsole = {
  log: (...args: any[]) => logger.debug(args.map(String).join(' ')),
  error: (...args: any[]) => logger.error(args.map(String).join(' ')),
  warn: (...args: any[]) => logger.warn(args.map(String).join(' ')),
  info: (...args: any[]) => logger.info(args.map(String).join(' '))
};