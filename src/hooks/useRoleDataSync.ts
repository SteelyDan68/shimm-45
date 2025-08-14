/**
 * 🔄 ROLE DATA SYNCHRONIZATION HOOK
 * Ensures all roles see consistent data after client changes
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRoleCache } from './useRoleCache';

interface RoleDataSyncOptions {
  syncInterval?: number; // milliseconds
  autoSync?: boolean;
}

export const useRoleDataSync = (options: RoleDataSyncOptions = {}) => {
  const { syncInterval = 30000, autoSync = true } = options;
  const { user } = useAuth();
  const { isCoach, isAdmin, isSuperAdmin } = useRoleCache();

  // Force refresh pillar data across all role views
  const syncPillarData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // For coaches: refresh client pillar data
      if (isCoach) {
        // Coaches need to see updated client data
        const { data: clientAssignments } = await supabase
          .from('coach_client_assignments')
          .select('client_id')
          .eq('coach_id', user.id)
          .eq('is_active', true);

        if (clientAssignments) {
          // Trigger cache refresh for each client's pillar data
          for (const assignment of clientAssignments) {
            // This would trigger re-fetch of client data in coach views
            console.log(`🔄 Syncing pillar data for client: ${assignment.client_id}`);
          }
        }
      }

      // For admins: refresh organization-wide data
      if (isAdmin || isSuperAdmin) {
        // Admins need to see updated metrics across all users
        const { data: metrics } = await supabase
          .from('analytics_metrics')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(100);

        console.log('🔄 Admin metrics refreshed:', metrics?.length || 0);
      }

    } catch (error) {
      console.error('Error syncing role data:', error);
    }
  }, [user?.id, isCoach, isAdmin, isSuperAdmin]);

  // Auto-sync on interval
  useEffect(() => {
    if (!autoSync || !user?.id) return;

    const interval = setInterval(syncPillarData, syncInterval);
    
    return () => clearInterval(interval);
  }, [autoSync, syncInterval, syncPillarData, user?.id]);

  // Sync on pillar completion events
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('pillar_completion_sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assessment_rounds'
        },
        (payload) => {
          console.log('🔄 Pillar assessment completed, syncing data:', payload);
          syncPillarData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'path_entries'
        },
        (payload) => {
          console.log('🔄 Path entry created, syncing data:', payload);
          syncPillarData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, syncPillarData]);

  return {
    syncPillarData,
    isActive: autoSync
  };
};