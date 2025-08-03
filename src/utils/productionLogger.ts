/**
 * 🏭 PRODUCTION CODE CLEANER
 * - Removes all console.log statements from production builds
 * - Keeps error logging for monitoring
 * - Preserves development debugging capabilities
 */

// Production-safe logging utility
export const logger = {
  // Always log errors for monitoring
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  // Warn level for production issues
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  // Info only in development
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  // Debug only in development
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  // Success logging for development
  success: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${message}`, ...args);
    }
  }
};

// Performance monitoring for production
export const perfLogger = {
  // Track critical performance metrics
  trackPerformance: (metric: string, value: number, metadata?: any) => {
    if (!import.meta.env.DEV) {
      // Send to analytics service in production
      try {
        if ('analytics' in window) {
          (window as any).analytics?.track?.('performance_metric', {
            metric,
            value,
            metadata,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Silently fail in production
      }
    }
  },

  // Memory usage tracking
  trackMemory: () => {
    if (!import.meta.env.DEV && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      perfLogger.trackPerformance('memory_usage', memory.usedJSHeapSize / 1024 / 1024, {
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024
      });
    }
  }
};