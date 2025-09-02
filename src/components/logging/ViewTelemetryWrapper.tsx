import React from 'react';
import { useEmptyViewLogging } from '@/hooks/useViewLogging';

interface ViewTelemetryWrapperProps {
  children: React.ReactNode;
  hasData: boolean;
  loading: boolean;
  viewName?: string;
  thresholdSeconds?: number;
  className?: string;
}

/**
 * Universal wrapper för view telemetry
 * Automatiskt loggar vyer som är tomma för länge efter UI-rensningar
 */
export const ViewTelemetryWrapper: React.FC<ViewTelemetryWrapperProps> = ({
  children,
  hasData,
  loading,
  viewName,
  thresholdSeconds = 10,
  className
}) => {
  // Log automatiskt om vyn är tom för länge
  useEmptyViewLogging(hasData, loading, thresholdSeconds);

  return (
    <div className={className} data-view-name={viewName}>
      {children}
    </div>
  );
};

/**
 * Exempel på användning i en befintlig komponent:
 * 
 * const MyComponent = () => {
 *   const { data, loading } = useMyData();
 *   
 *   return (
 *     <ViewTelemetryWrapper 
 *       hasData={data && data.length > 0} 
 *       loading={loading}
 *       viewName="MyComponent"
 *     >
 *       {loading ? (
 *         <div>Loading...</div>
 *       ) : data?.length > 0 ? (
 *         <div>Data här...</div>
 *       ) : (
 *         <div>No data available</div>
 *       )}
 *     </ViewTelemetryWrapper>
 *   );
 * };
 */