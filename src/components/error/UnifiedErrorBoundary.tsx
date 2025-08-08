/**
 * 🛡️ COMPREHENSIVE ERROR BOUNDARY SYSTEM V2
 * SCRUM-TEAM QA ENGINEER & SOLUTION ARCHITECT COLLABORATION
 * 
 * Konsoliderar alla error boundaries till en unified architecture
 * Budget: 1 miljard kronor development standard
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { globalErrorHandler } from '@/utils/globalErrorHandler';
import { logger } from '@/utils/productionLogger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  level: 'critical' | 'page' | 'component' | 'feature';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  context?: string;
}

/**
 * 🎯 UNIFIED ERROR BOUNDARY CLASS
 * Hanterar alla error scenarios med intelligent recovery
 */
export class UnifiedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging with context
    const errorContext = {
      level: this.props.level,
      context: this.props.context,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'UnifiedErrorBoundary'
    };

    // Log to our global error handler
    globalErrorHandler.reportError(error, errorContext);
    
    // Custom error callback
    this.props.onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
      error
    });

    // Auto-retry for component level errors (non-critical)
    if (this.props.level === 'component' && this.props.enableRetry !== false) {
      this.scheduleRetry();
    }
  }

  private scheduleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.retryTimeoutId = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1
        }));
      }, Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)); // Exponential backoff
    }
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { error, errorId, retryCount } = this.state;
    const { level, maxRetries = 3 } = this.props;
    
    const isProduction = process.env.NODE_ENV === 'production';
    const canRetry = retryCount < maxRetries;

    // Different UI based on error level
    switch (level) {
      case 'critical':
        return this.renderCriticalError();
      
      case 'page':
        return this.renderPageError();
      
      case 'component':
      case 'feature':
        return this.renderComponentError();
      
      default:
        return this.renderGenericError();
    }
  }

  private renderCriticalError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Critical System Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>
                A critical error has occurred. Please refresh the page or contact support if the problem persists.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderPageError() {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <CardTitle>Page Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                This page encountered an error. You can try refreshing or return to the home page.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleManualRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderComponentError() {
    const canRetry = this.state.retryCount < (this.props.maxRetries || 3);
    
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-center gap-2 mb-2">
          <Bug className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Component Error</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          This component failed to load. {canRetry ? 'It will retry automatically.' : 'Maximum retries reached.'}
        </p>
        
        {canRetry && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={this.handleManualRetry}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Now
          </Button>
        )}
        
        {!canRetry && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={this.handleReload}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh Page
          </Button>
        )}
      </div>
    );
  }

  private renderGenericError() {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An unexpected error occurred. Please try again.
          <Button 
            size="sm" 
            variant="outline" 
            onClick={this.handleManualRetry}
            className="mt-2 ml-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
}

/**
 * 🎯 SPECIALIZED ERROR BOUNDARY COMPONENTS
 */

// Critical application errors
export const CriticalErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <UnifiedErrorBoundary {...props} level="critical" />
);

// Page-level errors  
export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <UnifiedErrorBoundary {...props} level="page" />
);

// Component-level errors with auto-retry
export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <UnifiedErrorBoundary {...props} level="component" enableRetry={true} />
);

// Feature-specific errors
export const FeatureErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level' | 'context'> & { feature: string }> = ({ feature, ...props }) => (
  <UnifiedErrorBoundary {...props} level="feature" context={feature} />
);

/**
 * 🔧 ERROR BOUNDARY HIGHER-ORDER COMPONENT
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ComponentErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * 🎯 SPECIALIZED ERROR BOUNDARIES FOR SHIMMS FEATURES
 */

// Stefan AI features
export const StefanAIErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary feature="Stefan AI">
    {children}
  </FeatureErrorBoundary>
);

// Pillar assessments
export const PillarErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary feature="Pillar Assessment">
    {children}
  </FeatureErrorBoundary>
);

// Messaging system
export const MessagingErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <FeatureErrorBoundary feature="Messaging System">
    {children}
  </FeatureErrorBoundary>
);

// Dashboard widgets
export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ComponentErrorBoundary enableRetry={true} maxRetries={2}>
    {children}
  </ComponentErrorBoundary>
);

export default {
  UnifiedErrorBoundary,
  CriticalErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  FeatureErrorBoundary,
  withErrorBoundary,
  StefanAIErrorBoundary,
  PillarErrorBoundary,
  MessagingErrorBoundary,
  DashboardErrorBoundary
};