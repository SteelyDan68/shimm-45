/**
 * 🚨 CRITICAL ERROR HANDLER
 * Hanterar kritiska fel som hotar systemstabiliteten
 */

import { Component, ReactNode, ErrorInfo } from 'react';
import { errorTracker } from '@/utils/productionErrorTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class CriticalErrorHandler extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `critical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Rapportera kritiskt fel
    errorTracker.reportError({
      message: `Critical Error: ${error.message}`,
      stack: error.stack,
      severity: 'critical',
      category: 'ui',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'CriticalErrorHandler'
      }
    });

    // Kalla callback om det finns
    this.props.onError?.(error, errorInfo);

    // Toast för omedelbar feedback
    toast.error('Ett kritiskt fel har uppstått', {
      description: 'Systemet försöker återställa sig automatiskt',
      duration: 10000
    });

    // Automatisk återställning efter 30 sekunder
    setTimeout(() => {
      this.handleRecover();
    }, 30000);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
    toast.success('System återställt', {
      description: 'Du kan nu fortsätta använda applikationen'
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Kritiskt systemfel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Ett oväntat fel har inträffat. Systemet försöker återställa sig automatiskt.
              </p>
              
              {this.state.errorId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Fel-ID:</strong> {this.state.errorId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spara denna kod för support.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={this.handleRecover}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Försök igen
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Ladda om sida
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Felet har rapporterats automatiskt till utvecklingsteamet.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}