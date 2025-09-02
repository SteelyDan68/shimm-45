import { ReactNode } from 'react';
import { useViewEmptyLogger } from '@/hooks/useViewEmptyLogger';

interface ViewEmptyTrackerProps {
  /** Content to render */
  children: ReactNode;
  /** Whether the view should be considered "empty" */
  isEmpty: boolean;
  /** Component name for logging purposes */
  componentName: string;
  /** Timeout in ms before logging empty view (default: 3000) */
  timeout?: number;
  /** Fallback content to show when empty (optional) */
  emptyStateContent?: ReactNode;
}

/**
 * Wrapper component that tracks empty views and logs them after a timeout
 */
export const ViewEmptyTracker = ({ 
  children, 
  isEmpty, 
  componentName, 
  timeout = 3000,
  emptyStateContent
}: ViewEmptyTrackerProps) => {
  // Log empty view if it stays empty for too long
  useViewEmptyLogger({ isEmpty, componentName, timeout });

  // Show empty state if provided and view is empty
  if (isEmpty && emptyStateContent) {
    return <>{emptyStateContent}</>;
  }

  return <>{children}</>;
};