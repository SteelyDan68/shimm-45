import { Suspense, lazy, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * 🚀 LAZY LOADING WRAPPER
 * Optimerar laddning av tunga komponenter
 */
export const LazyLoadWrapper = memo(({ 
  children, 
  fallback, 
  className 
}: LazyLoadWrapperProps) => {
  const defaultFallback = (
    <div className={`space-y-4 ${className}`}>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
});

LazyLoadWrapper.displayName = 'LazyLoadWrapper';

// Lazy-loaded komponenter för stora delar av appen
export const LazyClientJourneyOrchestrator = lazy(() => 
  import('@/components/ClientJourney/ClientJourneyOrchestrator').then(module => ({
    default: module.ClientJourneyOrchestrator
  }))
);

export const LazyNeuroplasticTaskGenerator = lazy(() => 
  import('@/components/Tasks/NeuroplasticTaskGenerator').then(module => ({
    default: module.NeuroplasticTaskGenerator
  }))
);

export const LazyUnifiedAIIntegrationTest = lazy(() => 
  import('@/components/Testing/UnifiedAIIntegrationTest').then(module => ({
    default: module.UnifiedAIIntegrationTest
  }))
);

export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/Analytics/AnalyticsDashboard').then(module => ({
    default: module.AnalyticsDashboard
  }))
);

export const LazyCoachingDashboard = lazy(() => 
  import('@/components/AICoaching/CoachingDashboard').then(module => ({
    default: module.CoachingDashboard
  }))
);