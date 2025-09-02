import React from 'react';
import { useEmptyViewLogging } from '@/hooks/useViewLogging';

interface EmptyStateLoggerProps {
  hasData: boolean;
  loading: boolean;
  children: React.ReactNode;
  thresholdSeconds?: number;
  className?: string;
}

/**
 * Wrapper komponent som automatiskt loggar tomma vyer
 * Används för att detektera view-problem efter UI-rensningar
 */
export const EmptyStateLogger: React.FC<EmptyStateLoggerProps> = ({
  hasData,
  loading,
  children,
  thresholdSeconds = 10,
  className
}) => {
  // Log automatiskt om vyn är tom för länge
  useEmptyViewLogging(hasData, loading, thresholdSeconds);

  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * HOC för att wrappe befintliga komponenter med empty state logging
 */
export const withEmptyStateLogging = <P extends object>(
  Component: React.ComponentType<P>,
  getEmptyStateProps: (props: P) => { hasData: boolean; loading: boolean; thresholdSeconds?: number }
) => {
  const WrappedComponent = (props: P) => {
    const { hasData, loading, thresholdSeconds } = getEmptyStateProps(props);
    
    useEmptyViewLogging(hasData, loading, thresholdSeconds);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withEmptyStateLogging(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};