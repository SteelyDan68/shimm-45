/**
 * 🚀 LAZY LOADED COMPONENTS
 * SCRUM-TEAM ADVANCED COMPONENT LOADING SYSTEM
 */
import React, { Suspense, lazy, ComponentType } from 'react';
import { ComponentErrorBoundary } from '@/components/error/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { logger } from '@/utils/productionLogger';

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  retryDelay?: number;
  maxRetries?: number;
}

interface LazyLoadingSkeletonProps {
  variant?: 'card' | 'list' | 'dashboard' | 'form';
  count?: number;
}

/**
 * Enhanced Skeleton Components for Different UI Patterns
 */
export const LazyLoadingSkeleton: React.FC<LazyLoadingSkeletonProps> = ({ 
  variant = 'card', 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-[100px] w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-[100px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
                <Skeleton className="h-6 w-[60px]" />
              </div>
            ))}
          </div>
        );

      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-[100px] w-full" />
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6 max-w-md">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-[120px] mt-4" />
          </div>
        );

      default:
        return <Skeleton className="h-[200px] w-full" />;
    }
  };

  return (
    <div className="animate-pulse">
      {renderSkeleton()}
    </div>
  );
};

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <Alert variant="destructive" className="my-4">
    <AlertDescription className="flex items-center justify-between">
      <span>Failed to load component: {error.message}</span>
      <Button size="sm" variant="outline" onClick={retry}>
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

/**
 * Enhanced Lazy Component Wrapper with Retry Logic
 */
export const createLazyComponent = <P extends object>(
  componentImport: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
): React.FC<P> => {
  const {
    fallback: CustomFallback,
    errorFallback: CustomErrorFallback = DefaultErrorFallback,
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  // Create the lazy component
  const LazyComponent = lazy(componentImport);

  // Wrapper component with retry logic
  const LazyWrapper: React.FC<P> = (props) => {
    const [retryCount, setRetryCount] = React.useState(0);
    const [retryKey, setRetryKey] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      if (retryCount < maxRetries) {
        logger.info(`Retrying lazy component load (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setRetryKey(prev => prev + 1);
        }, retryDelay);
      } else {
        logger.error('Max retries exceeded for lazy component');
      }
    }, [retryCount]);

    const DefaultFallback = CustomFallback || (() => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading component...</span>
      </div>
    ));

    return (
      <ComponentErrorBoundary
        fallback={<CustomErrorFallback error={new Error('Component failed to load')} retry={handleRetry} />}
      >
        <Suspense fallback={<DefaultFallback />}>
          <LazyComponent {...props} />
        </Suspense>
  
  return LazyWrapper;
};

/**
 * Pre-configured Lazy Components for Common Use Cases
 */

// Simple lazy loading without complex retry logic for now
export const LazyDashboard = React.lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
export const LazyPhaseExecutionManager = React.lazy(() => import('@/components/PhaseExecutionManager').then(module => ({ default: module.PhaseExecutionManager })));

/**
 * Preload Utility for Important Components
 */
export const preloadComponent = (componentImport: () => Promise<any>) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentImport().catch(error => {
        logger.warn('Component preload failed', { error: error.message });
      });
    });
  }
};

/**
 * Route-Based Preloading Hook
 */
export const useRouteBasedPreloading = () => {
  React.useEffect(() => {
    // Simple preloading for now
    preloadComponent(() => import('@/pages/Dashboard'));
  }, []);
};