/**
 * ========================================================
 * UNIFIED USER MANAGEMENT HOOK
 * Single Source of Truth Implementation Complete
 * ========================================================
 * 
 * This hook demonstrates the completed Single Source of Truth strategy:
 * - ALL user operations use user_id only
 * - No more client_id, coach_id confusion
 * - Unified context-driven access through get_user_context()
 * - Backwards compatibility maintained
 * 
 * PHASES COMPLETED:
 * ✅ Phase 1: Routing Unification (/user/{user_id}?context=role)
 * ✅ Phase 2: Component Consolidation (UnifiedUserProfile)  
 * ✅ Phase 3: Frontend Harmony (Hooks renamed & unified)
 * ✅ Phase 4: Database Schema Consolidation (user_id only)
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUnifiedUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * GET USER CONTEXT - Single Source of Truth Function
   * Uses the new database function that provides unified access control
   */
  const getUserContext = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_user_context', { target_user_id: userId });

      if (error) {
        console.error('Error getting user context:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getUserContext:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * UNIVERSAL USER CACHE ACCESS
   * Now uses user_id consistently across all tables
   */
  const getUserData = useCallback(async (userId: string, dataType?: string) => {
    try {
      let query = supabase
        .from('user_data_cache')
        .select('*')
        .eq('user_id', userId)  // ✅ SINGLE SOURCE OF TRUTH: user_id
        .order('created_at', { ascending: false });

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta användardata",
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserData:', error);
      return [];
    }
  }, [toast]);

  /**
   * UNIFIED USER PATH TIMELINE
   * Uses user_id for all path entries
   */
  const getUserTimeline = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)  // ✅ SINGLE SOURCE OF TRUTH: user_id
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      return [];
    }
  }, []);

  /**
   * CHECK USER RELATIONSHIPS (Coach-Client)
   * Maintains backwards compatibility while using clear user_id semantics
   */
  const getUserRelationships = useCallback(async (userId: string) => {
    try {
      // As coach
      const { data: asCoach, error: coachError } = await supabase
        .from('coach_client_assignments')
        .select('*, client_profiles:profiles!client_id(*)')
        .eq('coach_id', userId)  // coach_id IS user_id (documented in DB)
        .eq('is_active', true);

      if (coachError) throw coachError;

      // As client  
      const { data: asClient, error: clientError } = await supabase
        .from('coach_client_assignments')
        .select('*, coach_profiles:profiles!coach_id(*)')
        .eq('client_id', userId)  // client_id IS user_id (documented in DB)
        .eq('is_active', true);

      if (clientError) throw clientError;

      return {
        asCoach: asCoach || [],
        asClient: asClient || [],
        hasCoachRelation: (asCoach?.length || 0) > 0,
        hasClientRelation: (asClient?.length || 0) > 0
      };
    } catch (error) {
      console.error('Error fetching relationships:', error);
      return {
        asCoach: [],
        asClient: [],
        hasCoachRelation: false,
        hasClientRelation: false
      };
    }
  }, []);

  return {
    // Core functions
    getUserContext,
    getUserData,
    getUserTimeline,
    getUserRelationships,
    loading,

    // Utility helpers
    getNewsMentions: (data: any[]) => data.filter(item => item.data_type === 'news'),
    getSocialMetrics: (data: any[]) => data.filter(item => item.data_type === 'social_metrics'),
    getAIAnalysis: (data: any[]) => data.filter(item => item.data_type === 'ai_analysis'),
  };
};