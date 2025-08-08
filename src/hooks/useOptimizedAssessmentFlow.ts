import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PillarKey } from '@/types/sixPillarsModular';

interface AssessmentFlowState {
  currentStep: number;
  totalSteps: number;
  isCompleting: boolean;
  hasUnsavedChanges: boolean;
  errorRetryCount: number;
}

interface AssessmentResult {
  success: boolean;
  analysis?: string;
  actionables?: any[];
  nextRecommendation?: string;
}

export const useOptimizedAssessmentFlow = (pillarKey: PillarKey) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [flowState, setFlowState] = useState<AssessmentFlowState>({
    currentStep: 1,
    totalSteps: 10,
    isCompleting: false,
    hasUnsavedChanges: false,
    errorRetryCount: 0
  });

  const saveProgress = useCallback(async (answers: Record<string, any>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('assessment_states')
        .upsert({
          user_id: user.id,
          assessment_type: pillarKey,
          form_data: answers,
          current_step: flowState.currentStep.toString(),
          last_saved_at: new Date().toISOString()
        });

      if (error) throw error;

      setFlowState(prev => ({ ...prev, hasUnsavedChanges: false }));
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }, [user, pillarKey, flowState.currentStep]);

  const completeAssessment = useCallback(async (
    answers: Record<string, any>,
    scores: Record<string, number>
  ): Promise<AssessmentResult> => {
    if (!user) {
      return { success: false };
    }

    setFlowState(prev => ({ ...prev, isCompleting: true }));

    try {
      // 1. Save assessment round
      const { data: assessmentRound, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: user.id,
          created_by: user.id,
          pillar_type: pillarKey,
          answers,
          scores,
          comments: 'Optimized assessment flow completion'
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // 2. Get AI analysis
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('universal-assessment-analyzer', {
          body: {
            template_id: pillarKey,
            client_id: user.id,
            answers,
            calculated_scores: {
              overall: Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length,
              pillar_scores: scores
            },
            context: pillarKey
          }
        });

      if (analysisError) {
        console.warn('AI analysis failed, continuing without it:', analysisError);
      }

      // 3. Generate actionables if analysis succeeded
      let actionables = [];
      if (analysisResult?.success) {
        const { data: actionablesResult } = await supabase.functions
          .invoke('enhanced-ai-planning', {
            body: {
              user_id: user.id,
              preferences: {
                intensity: 'moderate',
                duration: 4,
                frequency: 'few-times-week'
              },
              assessment_data: {
                pillar_type: pillarKey,
                scores,
                analysis: analysisResult.analysis
              }
            }
          });

        if (actionablesResult?.success) {
          actionables = actionablesResult.plan?.tasks || [];
        }
      }

      // 4. Clean up draft state
      await supabase
        .from('assessment_states')
        .delete()
        .match({
          user_id: user.id,
          assessment_type: pillarKey
        });

      setFlowState(prev => ({ 
        ...prev, 
        isCompleting: false,
        hasUnsavedChanges: false
      }));

      toast({
        title: "Assessment slutförd!",
        description: `Din ${pillarKey}-bedömning är nu klar och AI-analys genererad.`,
      });

      return {
        success: true,
        analysis: analysisResult?.analysis || 'Assessment completed successfully',
        actionables,
        nextRecommendation: actionables.length > 0 ? 
          'Kolla din kalender för personliga utvecklingsaktiviteter' : 
          'Överväg att ta nästa pillar-assessment'
      };

    } catch (error: any) {
      console.error('Assessment completion error:', error);
      
      setFlowState(prev => ({ 
        ...prev, 
        isCompleting: false,
        errorRetryCount: prev.errorRetryCount + 1
      }));

      toast({
        title: "Något gick fel",
        description: "Försök igen om en stund.",
        variant: "destructive"
      });

      return { 
        success: false
      };
    }
  }, [user, pillarKey, toast]);

  const updateStep = useCallback((step: number) => {
    setFlowState(prev => ({
      ...prev,
      currentStep: step,
      hasUnsavedChanges: true
    }));
  }, []);

  const resetFlow = useCallback(() => {
    setFlowState({
      currentStep: 1,
      totalSteps: 10,
      isCompleting: false,
      hasUnsavedChanges: false,
      errorRetryCount: 0
    });
  }, []);

  return {
    flowState,
    saveProgress,
    completeAssessment,
    updateStep,
    resetFlow
  };
};