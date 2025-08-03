/**
 * SIMPLIFIED ASSESSMENT STATE FIX
 * 
 * 🚨 AKUT FIX för WelcomeAssessmentCard state management
 * Focus: Fixa det omedelbara problemet med "Börja nu" knappen
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeAssessmentData, WelcomeAssessmentResult } from '@/types/welcomeAssessment';
import { useToast } from '@/hooks/use-toast';

export interface AssessmentStatus {
  hasCompleted: boolean;
  hasInProgress: boolean;
  latestAssessment: any | null;
  canStart: boolean;
  canResume: boolean;
  shouldRestart: boolean;
  statusMessage: string;
}

export const useWelcomeAssessmentFixed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // CORE FIX: Proper assessment status check
  const getAssessmentStatus = useCallback(async (): Promise<AssessmentStatus> => {
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
      // Check för COMPLETED assessment (MUST have ai_analysis)
      const { data: completedAssessment, error: completedError } = await supabase
        .from('welcome_assessments')
        .select('*')
        .eq('user_id', user.id)
        .not('ai_analysis', 'is', null) // KEY FIX: Must have AI analysis
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completedError) {
        console.error('Error checking completed assessment:', completedError);
      }

      // Check för IN PROGRESS från assessment_states table  
      const { data: draftAssessment, error: draftError } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_type', 'welcome')
        .is('completed_at', null)
        .order('last_saved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draftError) {
        console.error('Error checking draft assessment:', draftError);
      }

      // DECISION LOGIC - den kritiska logiken
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
          statusMessage: `Slutförd för ${daysSince} dagar sedan`
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
      console.error('Error getting assessment status:', error);
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
  }, [user]);

  const submitWelcomeAssessment = useCallback(async (
    assessmentData: WelcomeAssessmentData,
    isDraft: boolean = false
  ): Promise<WelcomeAssessmentResult | null> => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att göra bedömningen",
        variant: "destructive",
      });
      return null;
    }

    setSubmitting(true);
    try {
      if (isDraft) {
        // Save as draft with proper JSON conversion
        const { data: draft, error: draftError } = await supabase
          .from('assessment_states')
          .upsert({
            user_id: user.id,
            assessment_type: 'welcome',
            form_data: assessmentData as any, // JSON conversion
            current_step: 'in_progress',
            auto_save_count: 1,
            last_saved_at: new Date().toISOString()
          })
          .select()
          .single();

        if (draftError) {
          console.error('Draft save error:', draftError);
          return null;
        }

        return draft as any;
      }

      // FINAL SUBMISSION
      // First, call the AI analysis function
      const { data: aiResult, error: aiError } = await supabase.functions.invoke(
        'analyze-welcome-assessment',
        {
          body: {
            user_id: user.id,
            assessment_data: assessmentData,
          },
        }
      );

      if (aiError) {
        console.error('AI analysis error:', aiError);
        toast({
          title: "AI-analys misslyckades",
          description: "Bedömningen sparades men utan AI-analys",
          variant: "destructive",
        });
      }

      // Save the final assessment
      const { data: savedAssessment, error: saveError } = await supabase
        .from('welcome_assessments')
        .insert({
          user_id: user.id,
          wheel_of_life_scores: assessmentData.wheelOfLife,
          adaptive_questions: assessmentData.adaptiveQuestions,
          free_text_responses: assessmentData.freeTextResponses,
          quick_wins: assessmentData.quickWins,
          ai_analysis: aiResult?.analysis || null,
          recommendations: aiResult?.recommendations || {},
          overall_score: aiResult?.overall_score || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Save error:', saveError);
        toast({
          title: "Fel",
          description: "Kunde inte spara bedömningen",
          variant: "destructive",
        });
        return null;
      }

      // Clean up draft from assessment_states
      await supabase
        .from('assessment_states')
        .delete()
        .eq('user_id', user.id)
        .eq('assessment_type', 'welcome');

      // Update user journey state  
      await supabase
        .from('user_journey_states')
        .upsert({
          user_id: user.id,
          current_phase: 'ai_analysis_complete',
          completed_assessments: ['welcome'],
          next_recommended_assessment: aiResult?.next_recommended_pillar || 'self_care',
          journey_progress: 25,
          last_activity_at: new Date().toISOString(),
          metadata: {
            welcome_completed_at: new Date().toISOString(),
            ai_analysis_completed_at: new Date().toISOString(),
            lowest_wheel_areas: aiResult?.lowest_areas || [],
            highest_wheel_areas: aiResult?.highest_areas || [],
            assessment_insights_available: true,
          },
        });

      toast({
        title: "Bedömning slutförd!",
        description: "Din välkomstbedömning har sparats och analyserats",
      });

      return savedAssessment;

    } catch (error) {
      console.error('Welcome assessment submission error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [user, toast]);

  const clearDraft = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('assessment_states')
        .delete()
        .eq('user_id', user.id)
        .eq('assessment_type', 'welcome');

      return true;
    } catch (error) {
      console.error('Error clearing draft:', error);
      return false;
    }
  }, [user]);

  return {
    loading,
    submitting,
    getAssessmentStatus,
    submitWelcomeAssessment,
    clearDraft
  };
};