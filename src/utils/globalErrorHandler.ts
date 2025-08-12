/**
 * 🌍 GLOBAL ERROR HANDLING SYSTEM
 * SCRUM-TEAM COMPREHENSIVE ERROR MANAGEMENT
 */
import { logger } from './productionLogger';

interface GlobalErrorHandler {
  initialize: () => void;
  reportError: (error: Error, context?: any) => void;
  handleUnhandledRejection: (event: PromiseRejectionEvent) => void;
  handleGlobalError: (event: ErrorEvent) => void;
}

class GlobalErrorHandlerImpl implements GlobalErrorHandler {
  private isInitialized = false;
  private errorQueue: Array<{ error: Error; context?: any; timestamp: number }> = [];
  private readonly MAX_QUEUE_SIZE = 50;

  initialize() {
    if (this.isInitialized) {
      logger.warn('Global Error Handler already initialized');
      return;
    }

    // Handle uncaught JavaScript errors
    window.addEventListener('error', this.handleGlobalError);
    
    // Handle unhandled Promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Handle React hydration errors specifically
    window.addEventListener('error', this.handleReactErrors);

    this.isInitialized = true;
    logger.info('🛡️ Global Error Handler Initialized');
  }

  handleGlobalError = (event: ErrorEvent) => {
    const error = event.error || new Error(event.message);
    
    const context = {
      type: 'javascript_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    this.reportError(error, context);
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    
    const context = {
      type: 'unhandled_promise_rejection',
      reason: event.reason,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    this.reportError(error, context);
    
    // Prevent default browser handling
    event.preventDefault();
  };

  private handleReactErrors = (event: ErrorEvent) => {
    // Check if this is a React hydration error
    if (event.message && event.message.includes('hydrat')) {
      const error = new Error(`React Hydration Error: ${event.message}`);
      const context = {
        type: 'react_hydration_error',
        filename: event.filename,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      
      this.reportError(error, context);
    }
  };

  reportError(error: Error, context?: any) {
    const errorReport = {
      error,
      context,
      timestamp: Date.now()
    };

    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift();
    }

    // Log error
    logger.error('Global Error Caught', error, {
      context,
      queueSize: this.errorQueue.length
    });

    // Try to gracefully handle common errors
    this.attemptGracefulRecovery(error, context);
  }

  private attemptGracefulRecovery(error: Error, context?: any) {
    // Network errors - show offline notification
    if (error.message.includes('fetch') || error.message.includes('network')) {
      this.showNetworkErrorNotification();
      return;
    }

    // Chunk loading errors - offer page refresh
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      this.handleChunkLoadError();
      return;
    }

    // Memory errors - clear cache and reload
    if (error.message.includes('memory') || error.message.includes('Maximum call stack')) {
      this.handleMemoryError();
      return;
    }

    // Generic fallback - show error notification
    this.showGenericErrorNotification(error);
  }

  private showNetworkErrorNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Network error detected. Check your connection.</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  private handleChunkLoadError() {
    const shouldReload = confirm(
      'The application needs to reload to load new content. Reload now?'
    );
    
    if (shouldReload) {
      window.location.reload();
    }
  }

  private handleMemoryError() {
    if (confirm('The application is running low on memory. Clear cache and reload?')) {
      // Clear localStorage
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore if localStorage is not available
      }
      
      // Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore if sessionStorage is not available
      }
      
      window.location.reload();
    }
  }

  private showGenericErrorNotification(error: Error) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start gap-2">
        <svg class="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <div class="font-medium">Something went wrong</div>
          <div class="text-sm opacity-90 mt-1">${error.message.substring(0, 100)}...</div>
          <button onclick="window.location.reload()" class="text-sm underline mt-2">Refresh page</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  // Public method to get error statistics
  getErrorStatistics() {
    const now = Date.now();
    const last24Hours = this.errorQueue.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);
    const lastHour = this.errorQueue.filter(e => now - e.timestamp < 60 * 60 * 1000);
    
    return {
      total: this.errorQueue.length,
      last24Hours: last24Hours.length,
      lastHour: lastHour.length,
      mostRecentError: this.errorQueue[this.errorQueue.length - 1] || null
    };
  }

  // Clean up event listeners
  destroy() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleReactErrors);
    this.isInitialized = false;
    logger.info('Global Error Handler Destroyed');
  }
}

// Singleton instance
export const globalErrorHandler = new GlobalErrorHandlerImpl();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  globalErrorHandler.initialize();
}

// Export types and utilities
export type { GlobalErrorHandler };
export { GlobalErrorHandlerImpl };