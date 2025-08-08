import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    errorId: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  attemptCount: number;
}

export class AIErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      attemptCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ai-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      attemptCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('AI Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to analytics/monitoring service
    this.logErrorToAnalytics(error, errorInfo);
  }

  private logErrorToAnalytics(error: Error, errorInfo: React.ErrorInfo) {
    // This would integrate with your analytics service
    try {
      // Example: Send to analytics
      const errorData = {
        error_id: this.state.errorId,
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        context: this.props.context || 'unknown',
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      };

      // In real implementation, send to your error tracking service
      console.log('Error logged:', errorData);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private resetError = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: '',
      attemptCount: prevState.attemptCount + 1
    }));
  };

  private getErrorType(error: Error): 'ai-processing' | 'network' | 'timeout' | 'validation' | 'unknown' {
    const message = error.message.toLowerCase();
    
    if (message.includes('ai') || message.includes('processing') || message.includes('analysis')) {
      return 'ai-processing';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('time out')) {
      return 'timeout';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    return 'unknown';
  }

  private getErrorSolution(errorType: string): string {
    switch (errorType) {
      case 'ai-processing':
        return 'AI-analysen misslyckades. Försök igen eller kontakta support om problemet kvarstår.';
      case 'network':
        return 'Nätverksfel upptäckt. Kontrollera din internetuppkoppling och försök igen.';
      case 'timeout':
        return 'Begäran tog för lång tid. Stefan kan vara överbelastad, försök igen om en stund.';
      case 'validation':
        return 'Datan kunde inte valideras. Kontrollera dina inmatningar och försök igen.';
      default:
        return 'Ett oväntat fel uppstod. Försök igen eller kontakta support.';
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            errorId={this.state.errorId}
          />
        );
      }

      // Default error UI
      const errorType = this.getErrorType(this.state.error);
      const solution = this.getErrorSolution(errorType);
      const isRetryable = this.state.attemptCount < 3;

      return (
        <Card className="w-full border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              AI-systemfel upptäckt
              <Badge variant="outline" className="ml-auto">
                {errorType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Message */}
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="font-medium text-sm">Felmeddelande:</div>
              <div className="text-sm text-muted-foreground mt-1">
                {this.state.error.message}
              </div>
            </div>

            {/* Solution */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-sm mb-2">Rekommenderad lösning:</div>
              <div className="text-sm text-muted-foreground">
                {solution}
              </div>
            </div>

            {/* Error Details */}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Teknisk information (klicka för detaljer)
              </summary>
              <div className="mt-2 p-2 bg-muted/20 rounded font-mono text-xs">
                <div><strong>Error ID:</strong> {this.state.errorId}</div>
                <div><strong>Context:</strong> {this.props.context || 'N/A'}</div>
                <div><strong>Attempt:</strong> {this.state.attemptCount + 1}</div>
                <div><strong>Stack:</strong></div>
                <pre className="whitespace-pre-wrap text-xs mt-1">
                  {this.state.error.stack}
                </pre>
              </div>
            </details>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isRetryable && (
                <Button
                  onClick={this.resetError}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  Försök igen
                </Button>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center gap-2"
              >
                Ladda om sidan
              </Button>

              {this.state.attemptCount >= 3 && (
                <Button
                  onClick={() => {
                    // Navigate to support or contact page
                    window.location.href = '/support?error_id=' + this.state.errorId;
                  }}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Kontakta support
                </Button>
              )}
            </div>

            {/* Retry Status */}
            {!isRetryable && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Maximalt antal försök uppnått. Kontakta support för hjälp.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with AI Error Boundary
export function withAIErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <AIErrorBoundary context={context}>
        <Component {...props} />
      </AIErrorBoundary>
    );
  };
}

// Hook for programmatically handling AI errors
export function useAIErrorHandler() {
  const { toast } = useToast();

  const handleAIError = (error: Error, context?: string) => {
    console.error(`AI Error in ${context}:`, error);
    
    toast({
      title: "AI-systemfel",
      description: `Ett fel uppstod under ${context || 'AI-bearbetning'}. Försök igen.`,
      variant: "destructive"
    });
  };

  const handleAISuccess = (message: string) => {
    toast({
      title: "Framgång!",
      description: message,
      variant: "default"
    });
  };

  return {
    handleAIError,
    handleAISuccess
  };
}