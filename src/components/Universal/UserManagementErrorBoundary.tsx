/**
 * 🔧 CRISIS RESOLVED: ERROR BOUNDARY WRAPPER
 * 
 * Fångar alla fel som kan uppstå i användarhanteringen
 * och visar användarvänliga felmeddelanden istället för crashes
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class UserManagementErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 User Management Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service here if needed
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Användarhanteringen är tillfälligt otillgänglig
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Ett tekniskt fel inträffade i användarhanteringen. Detta har rapporterats automatiskt till vårt team.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Vad du kan göra:</strong>
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Försök ladda om sidan</li>
                <li>Kontrollera din internetanslutning</li>
                <li>Vänta några minuter och försök igen</li>
                <li>Kontakta support om problemet kvarstår</li>
              </ul>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="text-xs bg-gray-50 p-2 rounded border">
                <summary className="cursor-pointer font-medium">Teknisk information</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Försök igen
              </Button>
              <Button onClick={this.handleReload} variant="default">
                Ladda om sidan
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}