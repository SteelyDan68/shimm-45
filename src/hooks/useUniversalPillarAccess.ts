/**
 * 🌟 UNIVERSAL PILLAR ACCESS HOOK
 * 
 * SINGLE SOURCE OF TRUTH för pillar progress - tillgänglig för ALLA roller
 * Hantera både user_id och målspecifik användare (för admin/coach användare)
 * Fungerar för: superadmin, admin, coach, client
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PillarKey } from '@/types/sixPillarsModular';

export interface PillarProgress {
  pillar_key: PillarKey;
  pillar_type: PillarKey;
  progress_percentage: number;
  completion_count: number;
  last_activity: string | null;
  is_active: boolean;
  current_level: number;
  next_milestone: string | null;
  metadata: Record<string, any>;
}

export interface UniversalPillarStats {
  total_completed: number;
  active_pillars: number;
  overall_progress: number;
  recent_activities: number;
  user_level: number;
}

export interface UniversalPillarAccessReturn {
  // Data
  pillarProgress: PillarProgress[];
  stats: UniversalPillarStats;
  loading: boolean;
  error: string | null;

  // Access Control
  canView: boolean;
  canEdit: boolean;
  targetUser: string | null;

  // Actions
  refreshData: () => Promise<void>;
  updatePillarProgress: (pillarKey: PillarKey, data: any) => Promise<boolean>;
  activatePillar: (pillarKey: PillarKey) => Promise<boolean>;
  deactivatePillar: (pillarKey: PillarKey) => Promise<boolean>;
  
  // Real-time tracking
  trackActivity: (pillarKey: PillarKey, activityType: string, data?: any) => Promise<void>;
}

const PILLAR_KEYS: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'];

export const useUniversalPillarAccess = (targetUserId?: string): UniversalPillarAccessReturn => {
  const { user, hasRole, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  // State
  const [pillarProgress, setPillarProgress] = useState<PillarProgress[]>([]);
  const [stats, setStats] = useState<UniversalPillarStats>({
    total_completed: 0,
    active_pillars: 0,
    overall_progress: 0,
    recent_activities: 0,
    user_level: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine effective user ID
  const effectiveUserId = targetUserId || user?.id;

  // Access Control Logic
  const { canView, canEdit } = useMemo(() => {
    if (!user || !effectiveUserId) {
      return { canView: false, canEdit: false };
    }

    // SUPERADMIN - God Mode
    if (isSuperAdmin) {
      return { canView: true, canEdit: true };
    }

    // Self access
    if (effectiveUserId === user.id) {
      return { canView: true, canEdit: true };
    }

    // Admin access
    if (hasRole('admin')) {
      return { canView: true, canEdit: true };
    }

    // Coach access to their clients
    if (hasRole('coach')) {
      // TODO: Check if targetUserId is a client of this coach
      return { canView: true, canEdit: true };
    }

    // Default - no access
    return { canView: false, canEdit: false };
  }, [user, effectiveUserId, isSuperAdmin, hasRole]);

  // Fetch pillar progress from path_entries (SINGLE SOURCE OF TRUTH)
  const fetchPillarProgress = useCallback(async () => {
    if (!effectiveUserId || !canView) {
      setPillarProgress([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🎯 Universal Pillar Access: Fetching for user:', effectiveUserId);

      // Get all path entries for this user with pillar-related content
      const { data: pathEntries, error: pathError } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', effectiveUserId)
        .or('type.eq.pillar_activation,type.eq.pillar_assessment,type.eq.pillar_completion,type.eq.pillar_milestone')
        .order('timestamp', { ascending: false });

      if (pathError) throw pathError;

      // Process path entries to create pillar progress
      const progressMap = new Map<PillarKey, PillarProgress>();

      // Initialize all pillars
      PILLAR_KEYS.forEach(key => {
        progressMap.set(key, {
          pillar_key: key,
          pillar_type: key,
          progress_percentage: 0,
          completion_count: 0,
          last_activity: null,
          is_active: false,
          current_level: 1,
          next_milestone: null,
          metadata: {}
        });
      });

      // Process entries
      pathEntries?.forEach(entry => {
        const entryMetadata = entry.metadata as any;
        const pillarKey = entryMetadata?.pillar_key || entryMetadata?.pillar_type;
        if (!pillarKey || !PILLAR_KEYS.includes(pillarKey)) return;

        const pillar = progressMap.get(pillarKey);
        if (!pillar) return;

        // Update based on entry type
        switch (entry.type) {
          case 'pillar_activation':
            pillar.is_active = true;
            break;
          
          case 'pillar_assessment':
          case 'pillar_completion':
            pillar.completion_count += 1;
            pillar.progress_percentage = Math.min(100, pillar.completion_count * 20);
            break;
          
          case 'pillar_milestone':
            const entryMetadata2 = entry.metadata as any;
            pillar.current_level = entryMetadata2?.level || pillar.current_level;
            break;
        }

        // Update last activity
        if (!pillar.last_activity || entry.timestamp > pillar.last_activity) {
          pillar.last_activity = entry.timestamp;
        }

        // Merge metadata
        const entryMetadata3 = entry.metadata as any;
        pillar.metadata = { ...pillar.metadata, ...entryMetadata3 };
      });

      const progressArray = Array.from(progressMap.values());
      setPillarProgress(progressArray);

      // Calculate stats
      const activePillars = progressArray.filter(p => p.is_active).length;
      const totalCompleted = progressArray.reduce((sum, p) => sum + p.completion_count, 0);
      const overallProgress = progressArray.reduce((sum, p) => sum + p.progress_percentage, 0) / 6;
      const recentActivities = pathEntries?.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({
        total_completed: totalCompleted,
        active_pillars: activePillars,
        overall_progress: Math.round(overallProgress),
        recent_activities: recentActivities,
        user_level: Math.floor(totalCompleted / 10) + 1
      });

      console.log('✅ Universal Pillar Access: Data loaded', {
        progressArray,
        stats: { activePillars, totalCompleted, overallProgress }
      });

    } catch (err: any) {
      console.error('❌ Universal Pillar Access: Error loading data:', err);
      setError(err.message || 'Failed to load pillar progress');
      toast({
        title: "Fel",
        description: "Kunde inte ladda pillar progress: " + err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, canView, toast]);

  // Update pillar progress
  const updatePillarProgress = useCallback(async (pillarKey: PillarKey, data: any): Promise<boolean> => {
    if (!effectiveUserId || !canEdit) {
      toast({
        title: "Åtkomst nekad",
        description: "Du har inte behörighet att uppdatera pillar progress",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: effectiveUserId,
          created_by: user?.id,
          type: 'pillar_assessment',
          title: `${pillarKey} assessment update`,
          details: `Pillar progress updated for ${pillarKey}`,
          content: JSON.stringify(data),
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          created_by_role: hasRole('admin') ? 'admin' : hasRole('coach') ? 'coach' : 'client',
          metadata: {
            pillar_key: pillarKey,
            pillar_type: pillarKey,
            assessment_data: data,
            updated_by: user?.id
          }
        });

      if (error) throw error;

      await fetchPillarProgress();
      return true;

    } catch (err: any) {
      console.error('❌ Update pillar progress error:', err);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera pillar progress: " + err.message,
        variant: "destructive"
      });
      return false;
    }
  }, [effectiveUserId, canEdit, user?.id, hasRole, fetchPillarProgress, toast]);

  // Activate pillar
  const activatePillar = useCallback(async (pillarKey: PillarKey): Promise<boolean> => {
    if (!effectiveUserId || !canEdit) return false;

    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: effectiveUserId,
          created_by: user?.id,
          type: 'pillar_activation',
          title: `${pillarKey} aktiverad`,
          details: `Pillar ${pillarKey} har aktiverats för utveckling`,
          content: JSON.stringify({ pillar_key: pillarKey, activated: true }),
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          created_by_role: hasRole('admin') ? 'admin' : hasRole('coach') ? 'coach' : 'client',
          metadata: {
            pillar_key: pillarKey,
            pillar_type: pillarKey,
            action: 'activate'
          }
        });

      if (error) throw error;

      await fetchPillarProgress();
      return true;

    } catch (err: any) {
      console.error('❌ Activate pillar error:', err);
      return false;
    }
  }, [effectiveUserId, canEdit, user?.id, hasRole, fetchPillarProgress]);

  // Deactivate pillar
  const deactivatePillar = useCallback(async (pillarKey: PillarKey): Promise<boolean> => {
    if (!effectiveUserId || !canEdit) return false;

    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: effectiveUserId,
          created_by: user?.id,
          type: 'pillar_deactivation',
          title: `${pillarKey} inaktiverad`,
          details: `Pillar ${pillarKey} har inaktiverats`,
          content: JSON.stringify({ pillar_key: pillarKey, activated: false }),
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          created_by_role: hasRole('admin') ? 'admin' : hasRole('coach') ? 'coach' : 'client',
          metadata: {
            pillar_key: pillarKey,
            pillar_type: pillarKey,
            action: 'deactivate'
          }
        });

      if (error) throw error;

      await fetchPillarProgress();
      return true;

    } catch (err: any) {
      console.error('❌ Deactivate pillar error:', err);
      return false;
    }
  }, [effectiveUserId, canEdit, user?.id, hasRole, fetchPillarProgress]);

  // Track activity
  const trackActivity = useCallback(async (pillarKey: PillarKey, activityType: string, data?: any): Promise<void> => {
    if (!effectiveUserId || !canEdit) return;

    try {
      await supabase
        .from('path_entries')
        .insert({
          user_id: effectiveUserId,
          created_by: user?.id,
          type: 'pillar_activity',
          title: `${pillarKey} aktivitet: ${activityType}`,
          details: `Aktivitet registrerad för ${pillarKey}`,
          content: JSON.stringify(data || {}),
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          created_by_role: hasRole('admin') ? 'admin' : hasRole('coach') ? 'coach' : 'client',
          metadata: {
            pillar_key: pillarKey,
            pillar_type: pillarKey,
            activity_type: activityType,
            ...data
          }
        });

      // Refresh data silently
      await fetchPillarProgress();

    } catch (err: any) {
      console.error('❌ Track activity error:', err);
    }
  }, [effectiveUserId, canEdit, user?.id, hasRole, fetchPillarProgress]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchPillarProgress();
  }, [fetchPillarProgress]);

  // Load data on mount and dependencies change
  useEffect(() => {
    if (effectiveUserId && canView) {
      fetchPillarProgress();
    }
  }, [effectiveUserId, canView, fetchPillarProgress]);

  return {
    // Data
    pillarProgress,
    stats,
    loading,
    error,

    // Access Control
    canView,
    canEdit,
    targetUser: effectiveUserId,

    // Actions
    refreshData,
    updatePillarProgress,
    activatePillar,
    deactivatePillar,
    trackActivity
  };
};