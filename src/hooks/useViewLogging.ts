import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

interface ViewLogEvent {
  event: 'view_empty' | '404';
  path: string;
  metadata?: Record<string, any>;
}

/**
 * Hook för att logga UI-problem efter rensningar
 * - 404-händelser
 * - Vyer som visar "No data" för länge
 */
export const useViewLogging = () => {
  const location = useLocation();
  const { user } = useAuth();
  const loggedPaths = useRef(new Set<string>());

  const logEvent = useCallback(async (eventData: ViewLogEvent) => {
    try {
      // Deduplicate logs för samma path+event inom sessionen
      const logKey = `${eventData.event}-${eventData.path}`;
      if (loggedPaths.current.has(logKey)) {
        return;
      }
      
      // Use explicit type casting since TypeScript types haven't updated yet
      await supabase.from('server_log_events').insert({
        user_id: user?.id || null,
        event: eventData.event,
        path: eventData.path,
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          ...eventData.metadata
        }
      } as any);

      loggedPaths.current.add(logKey);
      
      // Console log för development debugging
      console.warn(`[UI Telemetry] ${eventData.event}:`, {
        path: eventData.path,
        userId: user?.id,
        metadata: eventData.metadata
      });
    } catch (error) {
      console.error('Failed to log view event:', error);
    }
  }, [user?.id]);

  // Log 404 events automatically
  const log404 = useCallback(() => {
    logEvent({
      event: '404',
      path: location.pathname,
      metadata: {
        search: location.search,
        hash: location.hash
      }
    });
  }, [location, logEvent]);

  // Log empty view events
  const logEmptyView = useCallback((additionalMetadata?: Record<string, any>) => {
    logEvent({
      event: 'view_empty',
      path: location.pathname,
      metadata: {
        search: location.search,
        ...additionalMetadata
      }
    });
  }, [location, logEvent]);

  return {
    log404,
    logEmptyView,
    logEvent
  };
};

/**
 * Hook för att automatiskt logga 404-händelser
 * Används i NotFound-komponenten
 */
export const use404Logging = () => {
  const { log404 } = useViewLogging();
  
  useEffect(() => {
    log404();
  }, [log404]);
};

/**
 * Hook för att logga vyer som visar "No data" för länge
 * @param hasData - Om vyn har data att visa
 * @param loading - Om vyn fortfarande laddar
 * @param thresholdSeconds - Antal sekunder innan loggning (default: 10)
 */
export const useEmptyViewLogging = (
  hasData: boolean, 
  loading: boolean, 
  thresholdSeconds: number = 10
) => {
  const { logEmptyView } = useViewLogging();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    // Reset when props change
    loggedRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Start timer if view is empty and not loading
    if (!hasData && !loading && !loggedRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (!loggedRef.current) {
          logEmptyView({
            threshold_seconds: thresholdSeconds,
            loading_state: loading,
            has_data: hasData
          });
          loggedRef.current = true;
        }
      }, thresholdSeconds * 1000);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasData, loading, thresholdSeconds, logEmptyView]);
};