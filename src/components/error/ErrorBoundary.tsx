/**
 * 🛡️ ENTERPRISE-GRADE ERROR BOUNDARY
 * SCRUM-TEAM GLOBAL ERROR HANDLING SYSTEM
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/utils/productionLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `ERR_${Date.now()}`;
    
    this.setState({
      errorInfo,
      errorId
    });

    // Log error with full context
    logger.error('Error Boundary Caught Error', error, {
      errorData: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      errorId,
      level: this.props.level,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service
    this.reportError(error, errorInfo, errorId);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // Report to external monitoring service if configured
      if ((window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: this.props.level === 'critical'
        });
      }

      // Could integrate with Sentry, LogRocket, etc.
      // await fetch('/api/error-reporting', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     errorId,
      //     error: error.message,
      //     stack: error.stack,
      //     componentStack: errorInfo.componentStack,
      //     level: this.props.level
      //   })
      // });
    } catch (reportingError) {
      logger.error('Failed to report error', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info(`Error Boundary Retry Attempt: ${this.retryCount}/${this.maxRetries}`);
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    } else {
      logger.warn('Error Boundary Max Retries Exceeded');
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Component Stack:
${this.state.errorInfo?.componentStack || 'Not available'}

Stack Trace:
${this.state.error?.stack || 'Not available'}
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Level-specific error UI
      switch (this.props.level) {
        case 'critical':
          return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
              <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <CardTitle className="text-2xl">Critical System Error</CardTitle>
                  <CardDescription>
                    The application has encountered a critical error and needs to restart.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error ID: {this.state.errorId}</AlertTitle>
                    <AlertDescription>
                      Please report this error to support for immediate assistance.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={this.handleGoHome} className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Go to Homepage
                    </Button>
                    <Button variant="outline" onClick={this.handleReportBug} className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Report Bug
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );

        case 'page':
          return (
            <div className="min-h-[400px] flex items-center justify-center p-4">
              <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <CardTitle>Page Error</CardTitle>
                  <CardDescription>
                    This page encountered an error and couldn't load properly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error ID: {this.state.errorId}</AlertTitle>
                    <AlertDescription>
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2 justify-center">
                    {this.retryCount < this.maxRetries && (
                      <Button onClick={this.handleRetry} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again ({this.maxRetries - this.retryCount} left)
                      </Button>
                    )}
                    <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Go Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );

        case 'component':
          return (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Component Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>This component failed to load. ID: {this.state.errorId}</span>
                {this.retryCount < this.maxRetries && (
                  <Button size="sm" variant="outline" onClick={this.handleRetry}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          );

        default:
          return (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try refreshing the page.</AlertDescription>
            </Alert>
          );
      }
    }

    return this.props.children;
  }
}

// Convenience wrappers for different levels
export const CriticalErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="critical" />
);

export const PageErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" />
);

export const ComponentErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" />
);