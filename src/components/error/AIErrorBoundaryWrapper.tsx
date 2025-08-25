/**
 * 🔧 AI ERROR BOUNDARY WRAPPER
 * 
 * Specialiserad ErrorBoundary för AI-drivna komponenter med:
 * - Automatisk återförsök efter timeout
 * - AI-specifika felmeddelanden  
 * - "Try Again"-funktionalitet
 * - Graceful degradation för AI-tjänster
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Brain, Network, Clock } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  aiComponentName?: string;
  enableAutoRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRetrying: boolean;
}

export class AIErrorBoundaryWrapper extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    retryCount: 0,
    isRetrying: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      retryCount: 0,
      isRetrying: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 AI Error Boundary (${this.props.aiComponentName || 'Unknown'}):`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Rapportera fel
    this.props.onError?.(error, errorInfo);

    // Automatisk återförsök för vissa feltyper
    if (this.props.enableAutoRetry && this.canAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleAutoRetry();
    }
  }

  private canAutoRetry = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('fetch') ||
           message.includes('ai') ||
           message.includes('processing');
  };

  private scheduleAutoRetry = () => {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    
    this.setState({ isRetrying: true });
    
    // Exponentiell backoff: 2s, 4s, 8s
    const delay = Math.pow(2, this.state.retryCount + 1) * 1000;
    
    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }

    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));
  };

  private getErrorIcon = (): React.ElementType => {
    if (!this.state.error) return AlertTriangle;
    
    const message = this.state.error.message.toLowerCase();
    if (message.includes('ai') || message.includes('analysis')) return Brain;
    if (message.includes('network') || message.includes('fetch')) return Network;
    if (message.includes('timeout')) return Clock;
    return AlertTriangle;
  };

  private getErrorTitle = (): string => {
    const componentName = this.props.aiComponentName || 'AI-komponenten';
    
    if (!this.state.error) return `${componentName} är otillgänglig`;
    
    const message = this.state.error.message.toLowerCase();
    if (message.includes('ai') || message.includes('analysis')) return 'AI-analys misslyckades';
    if (message.includes('network')) return 'Nätverksfel';
    if (message.includes('timeout')) return 'Tidsgräns överskriden';
    return `Fel i ${componentName}`;
  };

  private getErrorDescription = (): string => {
    if (!this.state.error) return 'Ett oväntat fel inträffade';
    
    const message = this.state.error.message.toLowerCase();
    if (message.includes('ai') || message.includes('analysis')) {
      return 'Stefan AI kunde inte slutföra analysen. Detta kan bero på hög belastning eller tillfällig otillgänglighet.';
    }
    if (message.includes('network')) {
      return 'Kunde inte ansluta till AI-tjänsten. Kontrollera din internetuppkoppling.';
    }
    if (message.includes('timeout')) {
      return 'AI-bearbetningen tog för lång tid. Stefan kan vara överbelastad.';
    }
    return 'Ett tekniskt fel inträffade i AI-komponenten.';
  };

  public componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Använd custom fallback om det finns
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const ErrorIcon = this.getErrorIcon();
      const canRetry = this.state.retryCount < (this.props.maxRetries || 3);

      return (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <ErrorIcon className="h-5 w-5" />
              {this.getErrorTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                {this.getErrorDescription()}
              </AlertDescription>
            </Alert>

            {this.state.retryCount > 0 && (
              <div className="text-sm text-muted-foreground">
                Försök {this.state.retryCount} av {this.props.maxRetries || 3}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Vad du kan göra:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Försök ladda om komponenten</li>
                <li>Kontrollera din internetanslutning</li>
                <li>Vänta en stund och försök igen</li>
                <li>Kontakta support om problemet kvarstår</li>
              </ul>
            </div>

            <div className="flex gap-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry} 
                  disabled={this.state.isRetrying}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Försöker igen...' : 'Försök igen'}
                </Button>
              )}
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                size="sm"
              >
                Ladda om sidan
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs bg-gray-100 p-2 rounded border mt-4">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Utvecklarinformation
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-gray-600">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC för enkel användning
export const withAIErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AIErrorBoundaryWrapper {...options}>
      <Component {...props} />
    </AIErrorBoundaryWrapper>
  );
  
  WrappedComponent.displayName = `withAIErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};