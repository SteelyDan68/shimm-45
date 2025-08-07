/**
 * 🚀 LAZY COMPONENT LOADER
 * Implementerar intelligent code splitting och lazy loading
 */

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LazyLoadConfig {
  fallback?: React.ComponentType;
  delay?: number;
  preload?: boolean;
  errorBoundary?: boolean;
}

/**
 * 🎯 INTELLIGENT LAZY LOADING
 * Skapar lazy-loaded components med optimerad fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: LazyLoadConfig = {}
): LazyExoticComponent<T> {
  const {
    delay = 200,
    preload = false,
  } = config;

  const LazyComponent = lazy(() => {
    // Lägg till artificiell delay för att undvika flash of loading
    return Promise.all([
      importFn(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]).then(([componentModule]) => componentModule);
  });

  // Optional preloading för kritiska components
  if (preload) {
    // Trigger preload efter en kort delay
    setTimeout(() => {
      importFn();
    }, 1000);
  }

  return LazyComponent;
}

/**
 * 🎯 OPTIMIZED LOADING FALLBACKS
 * Intelligent loading states som matchar komponentens layout
 */
const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-8 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    </div>
  </div>
);

const UserListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const FormSkeleton = () => (
  <Card className="max-w-2xl">
    <CardContent className="p-6 space-y-6">
      <Skeleton className="h-6 w-48" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </CardContent>
  </Card>
);

/**
 * 🎯 SMART LOADING WRAPPER
 * Väljer rätt loading state baserat på component type
 */
interface SmartSuspenseProps {
  children: React.ReactNode;
  fallbackType?: 'dashboard' | 'userlist' | 'form' | 'minimal' | 'custom';
  customFallback?: React.ComponentType;
}

export const SmartSuspense: React.FC<SmartSuspenseProps> = ({
  children,
  fallbackType = 'minimal',
  customFallback: CustomFallback
}) => {
  const getFallback = () => {
    if (CustomFallback) {
      return <CustomFallback />;
    }

    switch (fallbackType) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'userlist':
        return <UserListSkeleton />;
      case 'form':
        return <FormSkeleton />;
      case 'minimal':
      default:
        return (
          <div className="flex items-center justify-center min-h-32">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        );
    }
  };

  return <Suspense fallback={getFallback()}>{children}</Suspense>;
};

/**
 * 🎯 PRECOMPUTED LAZY COMPONENTS
 * Pre-konfigurerade lazy components för vanliga sidor
 */
// Note: These lazy components are available for future use when pages have default exports

export default { createLazyComponent, SmartSuspense };