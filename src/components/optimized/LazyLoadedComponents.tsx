/**
 * 🚀 LAZY LOADED COMPONENTS
 * SCRUM-TEAM SIMPLIFIED COMPONENT LOADING SYSTEM
 */
import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/productionLogger';

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
 * Simple Loading Fallback
 */
const SimpleLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin mr-2" />
    <span>Loading component...</span>
  </div>
);

/**
 * Error Fallback Component
 */
const SimpleErrorFallback: React.FC<{ error?: string }> = ({ error }) => (
  <Alert variant="destructive" className="my-4">
    <AlertDescription>
      Failed to load component. {error && `Error: ${error}`}
    </AlertDescription>
  </Alert>
);

/**
 * Simple Lazy Component Wrapper
 */
export const createSimpleLazyComponent = (
  importFunction: () => Promise<{ default: React.ComponentType<any> }>
) => {
  const LazyComponent = lazy(importFunction);

  const WrappedComponent: React.FC<any> = (props) => (
    <Suspense fallback={<SimpleLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return WrappedComponent;
};

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
  } else {
    setTimeout(() => {
      componentImport().catch(error => {
        logger.warn('Component preload failed', { error: error.message });
      });
    }, 100);
  }
};

/**
 * Route-Based Preloading Hook
 */
export const useRouteBasedPreloading = () => {
  React.useEffect(() => {
    // Preload commonly accessed components
    preloadComponent(() => import('@/pages/Dashboard'));
  }, []);
};