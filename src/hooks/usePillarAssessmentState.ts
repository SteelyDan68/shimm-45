/**
 * PILLAR ASSESSMENT STATE MANAGER
 * 
 * Specific hook för Six Pillars assessment state management
 * Använder samma mönster som Welcome Assessment
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { PillarKey } from '@/types/sixPillarsModular';
import { useToast } from '@/hooks/use-toast';

export interface PillarAssessmentStatus {
  hasCompleted: boolean;
  hasInProgress: boolean;
  latestAssessment: any | null;
  canStart: boolean;
  canResume: boolean;
  shouldRestart: boolean;
  statusMessage: string;
  lastScore?: number;
}

export const usePillarAssessmentState = (pillarKey: PillarKey) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getAssessmentStatus = useCallback(async (): Promise<PillarAssessmentStatus> => {
    if (!user) {
      return {
        hasCompleted: false,
        hasInProgress: false,
        latestAssessment: null,
        canStart: false,
        canResume: false,
        shouldRestart: false,
        statusMessage: "Inte inloggad"
      };
    }

    setLoading(true);
    try {
      // Check för COMPLETED pillar assessment (MUST have ai_analysis)
      const { data: completedAssessment, error: completedError } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('pillar_key', pillarKey)
        .not('ai_analysis', 'is', null) // KEY: Must have AI analysis
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completedError) {
        console.error('Error checking completed pillar assessment:', completedError);
      }

      // Check för IN PROGRESS från assessment_states table  
      const { data: draftAssessment, error: draftError } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_type', 'pillar')
        .eq('assessment_key', pillarKey)
        .is('completed_at', null)
        .order('last_saved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draftError) {
        console.error('Error checking draft pillar assessment:', draftError);
      }

      // DECISION LOGIC för pillar assessments
      if (completedAssessment) {
        const daysSince = Math.floor(
          (Date.now() - new Date(completedAssessment.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          hasCompleted: true,
          hasInProgress: false,
          latestAssessment: completedAssessment,
          canStart: false,
          canResume: false,
          shouldRestart: true,
          statusMessage: `Slutförd för ${daysSince} dagar sedan`,
          lastScore: completedAssessment.calculated_score
        };
      }

      if (draftAssessment) {
        const hoursOld = Math.floor(
          (Date.now() - new Date(draftAssessment.last_saved_at).getTime()) / (1000 * 60 * 60)
        );

        if (hoursOld > 168) { // 7 days = expired
          return {
            hasCompleted: false,
            hasInProgress: false,
            latestAssessment: null,
            canStart: true,
            canResume: false,
            shouldRestart: true,
            statusMessage: "Påbörjat test för länge sedan, börja om"
          };
        }

        return {
          hasCompleted: false,
          hasInProgress: true,
          latestAssessment: draftAssessment,
          canStart: false,
          canResume: true,
          shouldRestart: false,
          statusMessage: `Påbörjat för ${hoursOld} timmar sedan`
        };
      }

      // NOT STARTED
      return {
        hasCompleted: false,
        hasInProgress: false,
        latestAssessment: null,
        canStart: true,
        canResume: false,
        shouldRestart: false,
        statusMessage: "Inte påbörjat"
      };

    } catch (error) {
      console.error('Error getting pillar assessment status:', error);
      return {
        hasCompleted: false,
        hasInProgress: false,
        latestAssessment: null,
        canStart: true,
        canResume: false,
        shouldRestart: false,
        statusMessage: "Fel vid kontroll av status"
      };
    } finally {
      setLoading(false);
    }
  }, [user, pillarKey]);

  const clearDraft = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('assessment_states')
        .delete()
        .eq('user_id', user.id)
        .eq('assessment_type', 'pillar')
        .eq('assessment_key', pillarKey);

      return true;
    } catch (error) {
      console.error('Error clearing pillar assessment draft:', error);
      return false;
    }
  }, [user, pillarKey]);

  return {
    loading,
    getAssessmentStatus,
    clearDraft
  };
};