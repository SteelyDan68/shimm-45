import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface RealAssessmentData {
  formDefinitions: AssessmentFormDefinition[];
  userAssessments: UserAssessment[];
  assignedForms: AssignedForm[];
  assessmentStates: AssessmentState[];
  overallProgress: AssessmentProgress;
}

export interface AssessmentFormDefinition {
  id: string;
  name: string;
  description?: string;
  assessment_type: string;
  ai_prompt_template: string;
  is_active: boolean;
  created_at: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  question_key: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  options?: any;
  min_value?: number;
  max_value?: number;
  weight?: number;
  sort_order: number;
}

export interface UserAssessment {
  id: string;
  user_id: string;
  pillar_type: string;
  scores: Record<string, any>;
  answers: Record<string, any>;
  comments?: string;
  ai_analysis?: string;
  created_at: string;
  form_definition_id?: string;
}

export interface AssignedForm {
  id: string;
  user_id: string;
  form_definition_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  is_active: boolean;
}

export interface AssessmentState {
  id: string;
  user_id: string;
  assessment_type: string;
  assessment_key?: string;
  current_step: string;
  form_data: Record<string, any>;
  is_draft: boolean;
  completed_at?: string;
  started_at: string;
  metadata: Record<string, any>;
}

export interface AssessmentProgress {
  totalAssessments: number;
  completedAssessments: number;
  draftAssessments: number;
  completionRate: number;
  lastCompleted?: string;
  pillarProgress: Record<string, number>;
}

export const useRealAssessments = () => {
  const { user } = useAuth();
  const [assessmentData, setAssessmentData] = useState<RealAssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAssessmentData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load all assessment-related data in parallel
      const [
        formDefinitionsResult,
        userAssessmentsResult,
        assignedFormsResult,
        assessmentStatesResult
      ] = await Promise.all([
        // Active form definitions with questions
        supabase
          .from('assessment_form_definitions')
          .select(`
            *,
            assessment_questions (*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        
        // User's completed assessments
        supabase
          .from('assessment_rounds')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Forms assigned to user
        supabase
          .from('assessment_form_assignments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        
        // Current assessment states (drafts)
        supabase
          .from('assessment_states')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
      ]);

      const formDefinitions = (formDefinitionsResult.data || []).map(fd => ({
        ...fd,
        questions: fd.assessment_questions || []
      }));
      const userAssessments = (userAssessmentsResult.data || []).map(ua => ({
        ...ua,
        scores: ua.scores as Record<string, any>,
        answers: ua.answers as Record<string, any>
      }));
      const assignedForms = assignedFormsResult.data || [];
      const assessmentStates = (assessmentStatesResult.data || []).map(as => ({
        ...as,
        form_data: as.form_data as Record<string, any>,
        metadata: as.metadata as Record<string, any>
      }));

      // Calculate overall progress
      const overallProgress = calculateAssessmentProgress(
        userAssessments,
        assessmentStates,
        assignedForms
      );

      const data: RealAssessmentData = {
        formDefinitions,
        userAssessments,
        assignedForms,
        assessmentStates,
        overallProgress
      };

      setAssessmentData(data);

    } catch (error) {
      console.error('Error loading assessment data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const calculateAssessmentProgress = (
    assessments: UserAssessment[],
    states: AssessmentState[],
    assigned: AssignedForm[]
  ): AssessmentProgress => {
    const completedAssessments = assessments.length;
    const draftAssessments = states.filter(s => s.is_draft).length;
    const totalAssignments = assigned.length;
    
    const completionRate = totalAssignments > 0 
      ? (completedAssessments / totalAssignments) * 100 
      : completedAssessments > 0 ? 100 : 0;

    // Calculate pillar progress
    const pillarProgress: Record<string, number> = {};
    const pillarTypes = ['self_care', 'skills', 'talent', 'brand', 'economy'];
    
    pillarTypes.forEach(pillar => {
      const pillarAssessments = assessments.filter(a => a.pillar_type === pillar);
      if (pillarAssessments.length > 0) {
        const latest = pillarAssessments[0];
        pillarProgress[pillar] = calculateAverageScore(latest.scores);
      } else {
        pillarProgress[pillar] = 0;
      }
    });

    const lastCompleted = assessments.length > 0 ? assessments[0].created_at : undefined;

    return {
      totalAssessments: totalAssignments,
      completedAssessments,
      draftAssessments,
      completionRate: Math.round(completionRate),
      lastCompleted,
      pillarProgress
    };
  };

  const calculateAverageScore = (scores: Record<string, any>): number => {
    if (!scores || typeof scores !== 'object') return 0;
    
    const values = Object.values(scores).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return 0;
    
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.round(average * 10) / 10;
  };

  // Start a new assessment
  const startAssessment = useCallback(async (
    formDefinitionId: string,
    assessmentType: string
  ) => {
    if (!user) return null;

    try {
      // Check if there's already a draft for this form
      const { data: existingState } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_key', formDefinitionId)
        .eq('is_draft', true)
        .maybeSingle();

      if (existingState) {
        return existingState.id;
      }

      // Create new assessment state
      const { data: newState, error } = await supabase
        .from('assessment_states')
        .insert({
          user_id: user.id,
          assessment_type: assessmentType,
          assessment_key: formDefinitionId,
          current_step: 'start',
          form_data: {},
          is_draft: true,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      return newState.id;

    } catch (error) {
      console.error('Error starting assessment:', error);
      return null;
    }
  }, [user]);

  // Save assessment progress
  const saveAssessmentProgress = useCallback(async (
    stateId: string,
    formData: Record<string, any>,
    currentStep: string
  ) => {
    try {
      const { error } = await supabase
        .from('assessment_states')
        .update({
          form_data: formData,
          current_step: currentStep,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', stateId);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Error saving assessment progress:', error);
      return false;
    }
  }, []);

  // Complete assessment
  const completeAssessment = useCallback(async (
    stateId: string,
    formDefinitionId: string,
    pillarType: string,
    finalAnswers: Record<string, any>,
    scores: Record<string, any>,
    comments?: string
  ) => {
    if (!user) return false;

    try {
      // Create assessment round record
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: user.id,
          form_definition_id: formDefinitionId,
          pillar_type: pillarType,
          answers: finalAnswers,
          scores: scores,
          comments: comments,
          created_by: user.id
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Mark assessment state as completed
      const { error: stateError } = await supabase
        .from('assessment_states')
        .update({
          is_draft: false,
          completed_at: new Date().toISOString(),
          current_step: 'completed'
        })
        .eq('id', stateId);

      if (stateError) throw stateError;

      // Trigger AI analysis
      const { data: aiAnalysis } = await supabase.functions.invoke(
        'analyze-dynamic-assessment',
        {
          body: {
            assessment_round_id: assessment.id,
            form_definition_id: formDefinitionId,
            answers: finalAnswers,
            comments: comments,
            user_id: user.id
          }
        }
      );

      // Update assessment with AI analysis
      if (aiAnalysis?.analysis) {
        await supabase
          .from('assessment_rounds')
          .update({ ai_analysis: aiAnalysis.analysis })
          .eq('id', assessment.id);
      }

      // Reload data to reflect changes
      await loadAssessmentData();

      return true;

    } catch (error) {
      console.error('Error completing assessment:', error);
      return false;
    }
  }, [user, loadAssessmentData]);

  // Get assessment form by ID
  const getFormDefinition = useCallback((formId: string) => {
    return assessmentData?.formDefinitions.find(f => f.id === formId) || null;
  }, [assessmentData]);

  // Get user's assessment history for a pillar
  const getPillarAssessmentHistory = useCallback((pillarType: string) => {
    if (!assessmentData) return [];
    
    return assessmentData.userAssessments
      .filter(a => a.pillar_type === pillarType)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [assessmentData]);

  // Get assigned forms that are due soon
  const getUpcomingDueForms = useCallback((daysAhead: number = 7) => {
    if (!assessmentData) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    return assessmentData.assignedForms.filter(form => {
      if (!form.due_date) return false;
      const dueDate = new Date(form.due_date);
      return dueDate <= cutoffDate && dueDate >= new Date();
    });
  }, [assessmentData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (user) {
      loadAssessmentData();
      
      const channel = supabase
        .channel('assessment-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assessment_rounds',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadAssessmentData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assessment_form_assignments',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadAssessmentData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assessment_states',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadAssessmentData();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, loadAssessmentData]);

  return {
    assessmentData,
    isLoading,
    loadAssessmentData,
    startAssessment,
    saveAssessmentProgress,
    completeAssessment,
    getFormDefinition,
    getPillarAssessmentHistory,
    getUpcomingDueForms
  };
};