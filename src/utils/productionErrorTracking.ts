import { logger, perfLogger } from '@/utils/productionLogger';

/**
 * 🔍 PRODUCTION ERROR TRACKING SERVICE
 * - Centralized error reporting for production
 * - Performance monitoring
 * - User feedback integration
 * - Automated error categorization
 */

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'api' | 'auth' | 'performance' | 'unknown';
  metadata?: any;
}

class ProductionErrorTracker {
  private errorQueue: ErrorReport[] = [];
  private sessionId: string;
  private userId?: string;
  private isProduction: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = !import.meta.env.DEV;
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        severity: this.categorizeSeverity(event.error),
        category: this.categorizeError(event.error)
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        severity: 'high',
        category: 'api'
      });
    });

    // React error boundary integration
    window.addEventListener('react-error', (event: any) => {
      this.reportError({
        message: event.detail.message,
        stack: event.detail.stack,
        url: window.location.href,
        severity: 'high',
        category: 'ui',
        metadata: {
          componentStack: event.detail.componentStack
        }
      });
    });
  }

  private setupPerformanceMonitoring() {
    if (!this.isProduction) return;

    // Monitor large DOM mutations
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        const largeChanges = mutations.filter(m => 
          m.addedNodes.length > 50 || m.removedNodes.length > 50
        );
        
        if (largeChanges.length > 0) {
          perfLogger.trackPerformance('large_dom_mutation', largeChanges.length);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Monitor memory usage periodically
    setInterval(() => {
      perfLogger.trackMemory();
    }, 30000); // Every 30 seconds

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          perfLogger.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
          perfLogger.trackPerformance('first_contentful_paint', navigation.responseEnd - navigation.fetchStart);
          perfLogger.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        }
      }, 1000);
    });
  }

  private categorizeSeverity(error: any): ErrorReport['severity'] {
    if (!error) return 'low';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) return 'medium';
    if (message.includes('auth') || message.includes('permission')) return 'high';
    if (message.includes('crash') || message.includes('fatal')) return 'critical';
    
    return 'medium';
  }

  private categorizeError(error: any): ErrorReport['category'] {
    if (!error) return 'unknown';
    
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('api')) return 'api';
    if (message.includes('auth') || message.includes('login') || message.includes('token')) return 'auth';
    if (stack.includes('react') || stack.includes('component')) return 'ui';
    if (message.includes('performance') || message.includes('timeout')) return 'performance';
    
    return 'unknown';
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  reportError({
    message,
    stack,
    url = window.location.href,
    severity = 'medium',
    category = 'unknown',
    metadata
  }: Partial<ErrorReport>) {
    const errorReport: ErrorReport = {
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: message || 'Unknown error',
      stack,
      userAgent: navigator.userAgent,
      url,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      severity,
      category,
      metadata
    };

    // Log error appropriately
    if (severity === 'critical') {
      logger.error(`CRITICAL ERROR [${errorReport.errorId}]: ${message}`, undefined, errorReport);
    } else if (severity === 'high') {
      logger.error(`HIGH PRIORITY ERROR [${errorReport.errorId}]: ${message}`, undefined, errorReport);
    } else {
      logger.warn(`ERROR [${errorReport.errorId}]: ${message}`, errorReport);
    }

    // Queue for batch sending in production
    if (this.isProduction) {
      this.errorQueue.push(errorReport);
      this.scheduleErrorUpload();
    }
  }

  private scheduleErrorUpload() {
    // Debounce error uploads
    if (this.errorQueue.length >= 5) {
      this.uploadErrors();
    } else {
      setTimeout(() => {
        if (this.errorQueue.length > 0) {
          this.uploadErrors();
        }
      }, 5000);
    }
  }

  private async uploadErrors() {
    if (this.errorQueue.length === 0) return;

    const errorsToUpload = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to Supabase error logging
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://gcoorbcglxczmukzcmqs.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb29yYmNnbHhjem11a3pjbXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTE3NzYsImV4cCI6MjA2OTM4Nzc3Nn0.5gNGvMZ6aG3UXoYR6XbJPqn8L8ktMYaFbZIQ4mZTFf4'
      );

      await supabase.functions.invoke('error-logger', {
        body: { errors: errorsToUpload }
      });

    } catch (uploadError) {
      logger.error('Failed to upload errors:', uploadError);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errorsToUpload);
    }
  }

  // Public API for manual error reporting
  reportManualError(message: string, metadata?: any) {
    this.reportError({
      message,
      severity: 'medium',
      category: 'unknown',
      metadata
    });
  }

  reportAPIError(endpoint: string, error: any, metadata?: any) {
    this.reportError({
      message: `API Error: ${endpoint} - ${error.message || error}`,
      stack: error.stack,
      severity: 'high',
      category: 'api',
      metadata: { endpoint, ...metadata }
    });
  }

  reportAuthError(error: any, metadata?: any) {
    this.reportError({
      message: `Auth Error: ${error.message || error}`,
      stack: error.stack,
      severity: 'high',
      category: 'auth',
      metadata
    });
  }
}

// Global instance
export const errorTracker = new ProductionErrorTracker();

// React hook for error tracking
export const useErrorTracking = () => {
  return {
    reportError: errorTracker.reportManualError.bind(errorTracker),
    reportAPIError: errorTracker.reportAPIError.bind(errorTracker),
    reportAuthError: errorTracker.reportAuthError.bind(errorTracker),
    setUserId: errorTracker.setUserId.bind(errorTracker)
  };
};