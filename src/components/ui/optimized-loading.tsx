/**
 * 🚀 OPTIMIZED LOADING COMPONENTS
 * 
 * Centralized loading states with smooth animations
 * Eliminates loading flicker and provides professional UX
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
  loadingComponent,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {loadingComponent || (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Laddar...</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rows = 1
}) => {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-muted rounded",
            i === rows - 1 && "w-3/4", // Last row shorter
            className
          )}
        />
      ))}
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Laddar sida..."
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <h2 className="text-xl font-semibold">{message}</h2>
        <p className="text-sm text-muted-foreground">
          Förbereder din upplevelse...
        </p>
      </div>
    </div>
  );
};