/**
 * 🎨 UNIFIED LOADING STATES SYSTEM
 * SCRUM-TEAM CONSISTENT LOADING UX IMPLEMENTATION
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  className?: string;
}

export interface SkeletonPatternProps {
  pattern: 'card' | 'list' | 'dashboard' | 'form' | 'table' | 'chat' | 'profile';
  count?: number;
  animated?: boolean;
  className?: string;
}

export interface ConnectionStateProps {
  isOnline: boolean;
  isReconnecting?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Universal Loading Component with Multiple Variants
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  text = 'Loading...',
  showText = true,
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const renderVariant = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={cn('flex items-center justify-center gap-2', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {showText && (
              <span className={cn('text-muted-foreground', textSizeClasses[size])}>
                {text}
              </span>
            )}
          </div>
        );

      case 'skeleton':
        return (
          <div className={cn('space-y-2', className)}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            {showText && (
              <div className={cn('text-center text-muted-foreground', textSizeClasses[size])}>
                {text}
              </div>
            )}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('flex items-center justify-center gap-2', className)}>
            <div className={cn(
              'bg-primary rounded-full animate-pulse',
              sizeClasses[size]
            )} />
            {showText && (
              <span className={cn('text-muted-foreground animate-pulse', textSizeClasses[size])}>
                {text}
              </span>
            )}
          </div>
        );

      case 'dots':
        return (
          <div className={cn('flex items-center justify-center gap-1', className)}>
            <div className={cn('bg-primary rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '0ms' }} />
            <div className={cn('bg-primary rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '150ms' }} />
            <div className={cn('bg-primary rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '300ms' }} />
            {showText && (
              <span className={cn('ml-2 text-muted-foreground', textSizeClasses[size])}>
                {text}
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return renderVariant();
};

/**
 * Skeleton Patterns for Different UI Components
 */
export const SkeletonPattern: React.FC<SkeletonPatternProps> = ({
  pattern,
  count = 1,
  animated = true,
  className
}) => {
  const baseClass = animated ? 'animate-pulse' : '';

  const renderPattern = () => {
    switch (pattern) {
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          <Card key={i} className={cn('p-6', baseClass, className)}>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ));

      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('flex items-center space-x-4 p-3 border rounded', baseClass, className)}>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        );

      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <Card key={i} className={cn('p-6', baseClass, className)}>
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6 max-w-md">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('space-y-2', baseClass, className)}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-32 mt-6" />
          </div>
        );

      case 'table':
        return (
          <div className={cn('space-y-3', baseClass, className)}>
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-3 border-b">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            {/* Table Rows */}
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 p-3 border-b">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={cn('space-y-3', baseClass, className)}>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary/10 rounded-lg p-3 max-w-xs">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                {/* Response message */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-xs">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div className={cn('max-w-md mx-auto', baseClass, className)}>
            {/* Profile Header */}
            <div className="text-center mb-6">
              <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
            {/* Profile Details */}
            <div className="space-y-4">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <Skeleton className={cn('h-20 w-full', baseClass, className)} />;
    }
  };

  return <div>{renderPattern()}</div>;
};

/**
 * Connection State Indicator
 */
export const ConnectionState: React.FC<ConnectionStateProps> = ({
  isOnline,
  isReconnecting = false,
  onRetry,
  className
}) => {
  if (isOnline && !isReconnecting) {
    return null; // Don't show anything when online and connected
  }

  if (isReconnecting) {
    return (
      <Alert className={cn('border-yellow-200 bg-yellow-50', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Reconnecting...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>You're offline. Some features may not work.</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Progressive Loading Component
 */
export interface ProgressiveLoadingProps {
  stages: Array<{
    name: string;
    duration: number;
    completed: boolean;
  }>;
  currentStage: number;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  stages,
  currentStage,
  className
}) => {
  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Loading...</h3>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage List */}
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div key={index} className="flex items-center gap-2">
              {stage.completed ? (
                <div className="h-2 w-2 rounded-full bg-green-500" />
              ) : index === currentStage ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-muted" />
              )}
              <span className={cn(
                'text-sm',
                stage.completed ? 'text-green-600' : 
                index === currentStage ? 'text-primary' : 'text-muted-foreground'
              )}>
                {stage.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};