import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { MobileContainer, MobileTouchButton } from '@/components/ui/mobile-responsive';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToTracking(errorData);
    }
  };

  sendErrorToTracking = async (errorData: any) => {
    try {
      // This would integrate with your error tracking service
      // For now, we'll use a simple endpoint that could be implemented
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (trackingError) {
      console.error('Failed to send error to tracking service:', trackingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render different UI based on error level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  renderErrorUI() {
    const { level = 'component' } = this.props;
    const { error, errorId } = this.state;

    if (level === 'critical') {
      return this.renderCriticalError();
    }

    if (level === 'page') {
      return this.renderPageError();
    }

    return this.renderComponentError();
  }

  renderCriticalError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MobileContainer>
          <Card className="max-w-md mx-auto shadow-mobile-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-mobile-xl text-destructive">
                Kritiskt systemfel
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-mobile-sm text-muted-foreground">
                Ett oväntat fel inträffade som påverkade hela applikationen. 
                Vi har automatiskt rapporterat detta fel.
              </p>
              
              <div className="text-mobile-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                Fel-ID: {this.state.errorId}
              </div>

              <div className="flex flex-col gap-2">
                <MobileTouchButton 
                  onClick={this.handleReload}
                  variant="md"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ladda om applikationen
                </MobileTouchButton>
                
                <MobileTouchButton 
                  onClick={this.handleGoHome}
                  variant="md"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Gå till startsidan
                </MobileTouchButton>
              </div>
            </CardContent>
          </Card>
        </MobileContainer>
      </div>
    );
  }

  renderPageError() {
    return (
      <MobileContainer className="py-8">
        <Card className="max-w-lg mx-auto shadow-mobile-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
              <Bug className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle className="text-mobile-lg">
              Något gick fel på denna sida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-mobile-sm text-muted-foreground text-center">
              Vi kunde inte ladda innehållet. Försök igen eller gå tillbaka till startsidan.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-mobile-xs bg-muted p-3 rounded">
                <summary className="cursor-pointer font-medium">
                  Teknisk information (endast utveckling)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <MobileTouchButton 
                onClick={this.handleRetry}
                variant="md"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Försök igen
              </MobileTouchButton>
              
              <MobileTouchButton 
                onClick={this.handleGoHome}
                variant="md"
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Home className="h-4 w-4 mr-2" />
                Startsida
              </MobileTouchButton>
            </div>
          </CardContent>
        </Card>
      </MobileContainer>
    );
  }

  renderComponentError() {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-mobile-sm font-medium text-destructive mb-1">
              Komponentfel
            </h3>
            <p className="text-mobile-xs text-muted-foreground mb-3">
              Denna del av sidan kunde inte laddas korrekt.
            </p>
            
            <Button 
              onClick={this.handleRetry}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Försök igen
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for easier error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specific error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical">
    {children}
  </ErrorBoundary>
);