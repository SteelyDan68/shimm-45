/**
 * 🤖 AI COMPONENT WRAPPER
 * 
 * Standardiserad wrapper för alla AI-drivna komponenter med:
 * - AIErrorBoundaryWrapper för robust felhantering
 * - Loading states och graceful degradation
 * - Performance monitoring för AI-operationer
 */

import React, { Suspense } from 'react';
import { AIErrorBoundaryWrapper } from '@/components/error/AIErrorBoundaryWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

interface AIComponentWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallbackMessage?: string;
  enableAutoRetry?: boolean;
  loadingMessage?: string;
}

const AILoadingFallback: React.FC<{ message?: string; componentName: string }> = ({ 
  message = 'AI analyserar...', 
  componentName 
}) => (
  <Card className="border-blue-200 bg-blue-50/30">
    <CardContent className="p-6">
      <div className="flex items-center justify-center space-x-3">
        <div className="relative">
          <Brain className="h-6 w-6 text-blue-600" />
          <Loader2 className="h-3 w-3 animate-spin text-blue-400 absolute -top-1 -right-1" />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-blue-700">
            {message}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {componentName}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AIComponentWrapper: React.FC<AIComponentWrapperProps> = ({
  children,
  componentName,
  fallbackMessage,
  enableAutoRetry = true,
  loadingMessage
}) => {
  return (
    <AIErrorBoundaryWrapper
      aiComponentName={componentName}
      enableAutoRetry={enableAutoRetry}
      maxRetries={3}
      onError={(error, errorInfo) => {
        console.error(`AI Component Error in ${componentName}:`, error, errorInfo);
        
        // Rapport till analytics (om tillgängligt)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'ai_component_error', {
            component_name: componentName,
            error_message: error.message,
            error_stack: error.stack?.substring(0, 500)
          });
        }
      }}
    >
      <Suspense 
        fallback={
          <AILoadingFallback 
            message={loadingMessage}
            componentName={componentName}
          />
        }
      >
        {children}
      </Suspense>
    </AIErrorBoundaryWrapper>
  );
};

// Convenience HOC för enklare användning
export const withAIWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options: Omit<AIComponentWrapperProps, 'children' | 'componentName'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AIComponentWrapper componentName={componentName} {...options}>
      <Component {...props} />
    </AIComponentWrapper>
  );
  
  WrappedComponent.displayName = `withAIWrapper(${Component.displayName || Component.name})`;
  return WrappedComponent;
};