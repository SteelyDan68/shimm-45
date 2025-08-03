/**
 * COMPREHENSIVE ASSESSMENT STATE MANAGEMENT SYSTEM
 * 
 * 🏗️ Solution Architect: Unified state management för alla assessments
 * 📊 Data Scientist: Robust state tracking med draft/completed/in-progress
 * 🎯 UX Expert: Controlled user journey med clear state transitions  
 * 🎨 UI Expert: Konsistent interface patterns för alla assessment states
 * 
 * WORLD-CLASS EXECUTION: Enterprise assessment lifecycle management
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// UNIVERSAL ASSESSMENT STATES - Gäller ALLA assessments i systemet
export type AssessmentState = 
  | 'not_started'     // Aldrig påbörjat
  | 'in_progress'     // Påbörjat men inte slutfört (draft state)
  | 'completed'       // Helt slutfört
  | 'expired'         // Påbörjat för länge sedan, bör börja om
  | 'error'           // Fel uppstod, kräver åtgärd

// Assessment metadata som stödjer alla typer
export interface AssessmentStateData {
  id?: string;
  user_id: string;
  assessment_type: string; // 'welcome', 'self_care', 'skills', etc.
  state: AssessmentState;
  
  // Progress tracking
  total_steps: number;
  completed_steps: number;
  current_step?: string;
  
  // Timestamps
  started_at?: string;
  last_activity_at?: string;
  completed_at?: string;
  expires_at?: string; // För draft cleanup
  
  // Data storage
  draft_data?: any;        // Osparade ändringar
  final_data?: any;        // Slutlig sparad data
  ai_analysis?: any;       // AI-resultat när slutfört
  
  // Metadata för UX
  estimated_time_remaining?: number; // Minuter kvar
  completion_percentage: number;     // 0-100
  can_resume: boolean;              // Om användaren kan fortsätta
  should_restart: boolean;          // Om de bör börja om
}

export const useAssessmentStateManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // CORE FUNCTION: Get assessment state för ANY assessment type
  const getAssessmentState = useCallback(async (
    assessmentType: string
  ): Promise<AssessmentStateData | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      // Check för completed assessment
      const completedQuery = getCompletedAssessmentQuery(assessmentType);
      const { data: completed } = await supabase
        .from(completedQuery.table)
        .select(completedQuery.select)
        .eq('user_id', user.id)
        .eq(completedQuery.where.field, completedQuery.where.value)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completed && completed.completed_at) {
        return {
          user_id: user.id,
          assessment_type: assessmentType,
          state: 'completed',
          total_steps: getAssessmentTotalSteps(assessmentType),
          completed_steps: getAssessmentTotalSteps(assessmentType),
          completion_percentage: 100,
          completed_at: completed.created_at,
          final_data: completed,
          ai_analysis: completed.ai_analysis,
          can_resume: false,
          should_restart: false
        };
      }

      // Check för draft/in-progress från assessment_states table
      const { data: draft } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType)
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draft) {
        const now = new Date();
        const lastActivity = new Date(draft.last_activity_at);
        const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        // Expired hvis draft äldre än 7 dagar
        if (hoursSinceActivity > 168) { // 7 days
          return {
            ...draft,
            state: 'expired',
            can_resume: false,
            should_restart: true
          };
        }

        return {
          ...draft,
          state: 'in_progress',
          can_resume: true,
          should_restart: false
        };
      }

      // Inga data = not started
      return {
        user_id: user.id,
        assessment_type: assessmentType,
        state: 'not_started',
        total_steps: getAssessmentTotalSteps(assessmentType),
        completed_steps: 0,
        completion_percentage: 0,
        can_resume: false,
        should_restart: false
      };

    } catch (error) {
      console.error('Error getting assessment state:', error);
      return {
        user_id: user.id,
        assessment_type: assessmentType,
        state: 'error',
        total_steps: 0,
        completed_steps: 0,
        completion_percentage: 0,
        can_resume: false,
        should_restart: false
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // SAVE DRAFT: Spara progress utan att slutföra
  const saveDraft = useCallback(async (
    assessmentType: string,
    currentStep: string,
    draftData: any,
    completedSteps: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const totalSteps = getAssessmentTotalSteps(assessmentType);
      const completion = (completedSteps / totalSteps) * 100;

      await supabase
        .from('assessment_states')
        .upsert({
          user_id: user.id,
          assessment_type: assessmentType,
          state: 'in_progress',
          total_steps: totalSteps,
          completed_steps: completedSteps,
          current_step: currentStep,
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          draft_data: draftData,
          completion_percentage: completion,
          can_resume: true,
          should_restart: false
        }, {
          onConflict: 'user_id,assessment_type'
        });

      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }, [user]);

  // COMPLETE ASSESSMENT: Slutför och flytta till final table
  const completeAssessment = useCallback(async (
    assessmentType: string,
    finalData: any,
    aiAnalysis?: any
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Save to appropriate final table
      const completedQuery = getCompletedAssessmentQuery(assessmentType);
      await supabase
        .from(completedQuery.table)
        .insert({
          user_id: user.id,
          ...formatDataForTable(assessmentType, finalData),
          ai_analysis: aiAnalysis,
          completed_at: new Date().toISOString()
        });

      // Clean up draft state
      await supabase
        .from('assessment_states')
        .delete()
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType);

      // Update user journey
      await updateUserJourney(assessmentType, finalData);

      toast({
        title: "Assessment slutfört! ✅",
        description: `Din ${getAssessmentDisplayName(assessmentType)} har sparats och analyserats.`,
      });

      return true;
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: "Fel vid slutförande",
        description: "Ett oväntat fel inträffade. Försök igen.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  // CLEAR DRAFT: Radera påbörjat assessment
  const clearDraft = useCallback(async (assessmentType: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('assessment_states')
        .delete()
        .eq('user_id', user.id)
        .eq('assessment_type', assessmentType);

      return true;
    } catch (error) {
      console.error('Error clearing draft:', error);
      return false;
    }
  }, [user]);

  return {
    loading,
    getAssessmentState,
    saveDraft,
    completeAssessment,
    clearDraft
  };
};

// Helper functions för olika assessment types
function getCompletedAssessmentQuery(type: string) {
  switch (type) {
    case 'welcome':
      return {
        table: 'welcome_assessments',
        select: '*',
        where: { field: 'user_id', value: undefined } // handled in query
      };
    case 'self_care':
    case 'skills':
    case 'talent':
    case 'brand':
    case 'economy':
      return {
        table: 'pillar_assessments',
        select: '*',
        where: { field: 'pillar_key', value: type }
      };
    default:
      return {
        table: 'assessment_form_assignments',
        select: '*',
        where: { field: 'assessment_type', value: type }
      };
  }
}

function getAssessmentTotalSteps(type: string): number {
  switch (type) {
    case 'welcome': return 5; // wheel_of_life, adaptive, free_text, quick_wins, review
    case 'self_care':
    case 'skills':
    case 'talent':
    case 'brand':
    case 'economy': return 3; // intro, questions, review
    default: return 1;
  }
}

function getAssessmentDisplayName(type: string): string {
  const names = {
    welcome: 'välkomstbedömning',
    self_care: 'självvårdsbedömning',
    skills: 'färdighetsbedömning',
    talent: 'talangbedömning',
    brand: 'varumärkesbedömning',
    economy: 'ekonomibedömning'
  };
  return names[type as keyof typeof names] || `${type} bedömning`;
}

function formatDataForTable(type: string, data: any): any {
  switch (type) {
    case 'welcome':
      return {
        wheel_of_life_scores: data.wheelOfLife,
        adaptive_questions: data.adaptiveQuestions,
        free_text_responses: data.freeTextResponses,
        quick_wins: data.quickWins
      };
    default:
      return data;
  }
}

async function updateUserJourney(assessmentType: string, data: any) {
  // Trigger user journey update via existing hook
  // This will be integrated with useUserJourney
  console.log('Journey updated for assessment:', assessmentType);
}