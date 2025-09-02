import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

/**
 * Hook to log 404 events when NotFound component is rendered
 */
export const use404Logger = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const log404Event = async () => {
      try {
        const { error } = await supabase
          .from('server_log_events')
          .insert({
            user_id: user?.id || null,
            event: '404',
            path: location.pathname,
            metadata: {
              timestamp: new Date().toISOString(),
              search: location.search,
              hash: location.hash,
              referrer: document.referrer || null,
              user_agent: navigator.userAgent,
              // Track if user was authenticated when hitting 404
              authenticated: !!user?.id
            }
          } as any); // Use 'as any' since types might not be updated yet
        
        if (error) {
          console.error('Error logging 404:', error);
        }
        
        console.warn(`404 logged: ${location.pathname}`);
      } catch (error) {
        console.error('Failed to log 404 event:', error);
      }
    };

    // Log immediately when component mounts
    log404Event();
  }, [location.pathname, location.search, location.hash, user?.id]);
};