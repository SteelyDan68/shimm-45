import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

interface ViewEmptyLoggerOptions {
  /** Timeout in milliseconds to wait before logging empty view (default: 3000) */
  timeout?: number;
  /** Condition to check if view is empty */
  isEmpty: boolean;
  /** Component name or identifier for logging */
  componentName?: string;
}

/**
 * Hook to log views that remain empty for too long
 */
export const useViewEmptyLogger = ({ 
  timeout = 3000, 
  isEmpty, 
  componentName 
}: ViewEmptyLoggerOptions) => {
  const location = useLocation();
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Reset logged flag when location changes
    hasLoggedRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isEmpty && !hasLoggedRef.current) {
      // Start timer for empty view
      timeoutRef.current = setTimeout(async () => {
        if (hasLoggedRef.current) return; // Prevent duplicate logs
        
        hasLoggedRef.current = true;
        
        try {
          const { error } = await supabase
            .from('server_log_events')
            .insert({
              user_id: user?.id || null,
              event: 'view_empty',
              path: location.pathname,
              metadata: {
                component: componentName,
                timeout_ms: timeout,
                timestamp: new Date().toISOString(),
                search: location.search,
                hash: location.hash,
                user_agent: navigator.userAgent
              }
            } as any); // Use 'as any' since types might not be updated yet
          
          if (error) {
            console.error('Error logging empty view:', error);
          }
          
          console.warn(`Empty view logged: ${location.pathname} (component: ${componentName})`);
        } catch (error) {
          console.error('Failed to log empty view:', error);
        }
      }, timeout);
    }

    // Cleanup on unmount or when view is no longer empty
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isEmpty, timeout, location.pathname, location.search, location.hash, user?.id, componentName]);
};