import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * 🛡️ PRODUCTION-GRADE ERROR BOUNDARY
 * - Comprehensive error catching och logging
 * - Graceful fallback UI med recovery options
 * - Error reporting för debugging
 * - Context-aware error handling
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('🚨 Error Boundary Caught Error:', {
      error,
      errorInfo,
      context: this.props.context,
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to external service (if needed)
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to error logging service
      await fetch('/api/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_id: this.state.errorId,
          message: error.message,
          stack_trace: error.stack,
          component_stack: errorInfo.componentStack,
          context: this.props.context,
          url: window.location.href,
          user_agent: navigator.userAgent,
          retry_count: this.retryCount,
          timestamp: new Date().toISOString()
        })
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Något gick fel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <Bug className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p>
                      <strong>Error:</strong> {this.state.error?.message}
                    </p>
                    {this.props.context && (
                      <p>
                        <strong>Context:</strong> {this.props.context}
                      </p>
                    )}
                    <p className="text-xs text-red-600">
                      Error ID: {this.state.errorId}
                    </p>
                    {this.retryCount > 0 && (
                      <p className="text-xs text-red-600">
                        Retry attempts: {this.retryCount}/{this.maxRetries}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Vad du kan göra:
                </p>
                <div className="flex flex-wrap gap-2">
                  {this.retryCount < this.maxRetries && (
                    <Button
                      onClick={this.handleRetry}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Försök igen ({this.maxRetries - this.retryCount} kvar)
                    </Button>
                  )}
                  
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Återställ
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Home className="h-3 w-3" />
                    Gå hem
                  </Button>
                  
                  <Button
                    onClick={this.handleReload}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Ladda om sidan
                  </Button>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Teknisk information (endast i development)
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {this.state.error?.stack}
                    </pre>
                    <pre className="whitespace-pre-wrap mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props as P} />
    </ErrorBoundary>
  ));
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specialized error boundaries for different contexts
export const AIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="AI Processing"
    fallback={
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>AI-tjänst temporärt otillgänglig</strong>
          <br />
          Systemet försöker återansluta automatiskt. Försök igen om en stund.
        </AlertDescription>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);

export const DatabaseErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="Database Operations"
    fallback={
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Databasfel</strong>
          <br />
          Kunde inte ladda eller spara data. Kontrollera din internetanslutning och försök igen.
        </AlertDescription>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);

export const UIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    context="User Interface"
    fallback={
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Gränssnittsfel</strong>
          <br />
          En del av gränssnittet kunde inte laddas korrekt. Försök ladda om sidan.
        </AlertDescription>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);