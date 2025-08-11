import { useCallback } from 'react';
import { useUnifiedNavigation } from './useUnifiedNavigation';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { PillarKey } from '@/types/sixPillarsModular';

interface NavigationResult {
  shouldNavigate: boolean;
  url?: string;
  reason?: string;
}

export const useIntelligentPillarNavigation = () => {
  const { navigate } = useUnifiedNavigation();
  const { user } = useAuth();

  const navigateToPillar = useCallback(async (pillarKey: PillarKey): Promise<NavigationResult> => {
    if (!user) {
      return {
        shouldNavigate: true,
        url: '/login',
        reason: 'authentication_required'
      };
    }

    try {
      // Check if user has completed this pillar
      const { data: existingAssessment } = await supabase
        .from('assessment_rounds')
        .select('id, scores, ai_analysis')
        .eq('user_id', user.id)
        .eq('pillar_type', pillarKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Check for in-progress draft
      const { data: draftState } = await supabase
        .from('assessment_states')
        .select('current_step, form_data')
        .eq('user_id', user.id)
        .eq('assessment_type', pillarKey)
        .single();

      if (draftState) {
        // Resume in-progress assessment
        return {
          shouldNavigate: true,
          url: `/pillar-journey?pillar=${pillarKey}&resume=true`,
          reason: 'resume_draft'
        };
      }

      if (existingAssessment?.ai_analysis) {
        // Show results and offer retake
        return {
          shouldNavigate: true,
          url: `/pillar-journey?pillar=${pillarKey}&view=results`,
          reason: 'view_completed'
        };
      }

      // Start new assessment - show intro first
      return {
        shouldNavigate: true,
        url: `/pillar-journey?pillar=${pillarKey}&view=intro`,
        reason: 'start_new'
      };

    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to standard pillar page
      return {
        shouldNavigate: true,
        url: `/six-pillars?pillar=${pillarKey}`,
        reason: 'fallback'
      };
    }
  }, [user]);

  const smartNavigate = useCallback(async (pillarKey: PillarKey) => {
    const result = await navigateToPillar(pillarKey);
    if (result.shouldNavigate && result.url) {
      navigate(result.url);
    }
    return result;
  }, [navigateToPillar, navigate]);

  const navigateToNextPillar = useCallback(async (currentPillar: PillarKey) => {
    const pillarOrder: PillarKey[] = ['self_care', 'skills', 'talent', 'brand', 'economy'];
    const currentIndex = pillarOrder.indexOf(currentPillar);
    
    if (currentIndex === -1 || currentIndex === pillarOrder.length - 1) {
      // Go to journey overview
      navigate('/pillar-journey');
      return;
    }

    const nextPillar = pillarOrder[currentIndex + 1];
    await smartNavigate(nextPillar);
  }, [smartNavigate, navigate]);

  return {
    navigateToPillar,
    smartNavigate,
    navigateToNextPillar
  };
};