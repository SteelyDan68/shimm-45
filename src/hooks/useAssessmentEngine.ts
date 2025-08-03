import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  AssessmentFormDefinition, 
  AssessmentQuestion, 
  AssessmentFormAssignment,
  AssessmentRoundNew 
} from '@/types/assessmentEngine';

export const useAssessmentEngine = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formDefinitions, setFormDefinitions] = useState<AssessmentFormDefinition[]>([]);
  const [assignments, setAssignments] = useState<AssessmentFormAssignment[]>([]);
  const [assessmentRounds, setAssessmentRounds] = useState<AssessmentRoundNew[]>([]);

  useEffect(() => {
    loadFormDefinitions();
    if (userId && user) {
      loadAssignments();
      loadAssessmentRounds();
    }
  }, [userId, user]);

  const loadFormDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_form_definitions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFormDefinitions((data || []) as AssessmentFormDefinition[]);
    } catch (error) {
      console.error('Error loading form definitions:', error);
    }
  };

  const loadAssignments = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('assessment_form_assignments')
        .select(`
          *,
          assessment_form_definitions (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setAssignments((data || []) as AssessmentFormAssignment[]);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadAssessmentRounds = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select(`
          *,
          assessment_form_definitions (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessmentRounds((data || []) as AssessmentRoundNew[]);
    } catch (error) {
      console.error('Error loading assessment rounds:', error);
    }
  };

  const loadQuestions = async (formDefinitionId: string): Promise<AssessmentQuestion[]> => {
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('form_definition_id', formDefinitionId)
        .order('sort_order');

      if (error) throw error;
      return (data || []) as AssessmentQuestion[];
    } catch (error) {
      console.error('Error loading questions:', error);
      return [];
    }
  };

  const assignForm = async (formDefinitionId: string, dueDate?: Date) => {
    if (!userId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('assessment_form_assignments')
        .upsert({
          user_id: userId,
          form_definition_id: formDefinitionId,
          is_active: true,
          assigned_by: user.id,
          due_date: dueDate?.toISOString()
        });

      if (error) throw error;
      
      await loadAssignments();
      toast({
        title: "Formulär tilldelat",
        description: "Assessment-formuläret har skickats till klienten.",
      });
    } catch (error) {
      console.error('Error assigning form:', error);
      toast({
        title: "Fel",
        description: "Kunde inte tilldela formulär.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (formDefinitionId: string) => {
    if (!userId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('assessment_form_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('form_definition_id', formDefinitionId);

      if (error) throw error;
      
      await loadAssignments();
      toast({
        title: "Tilldelning borttagen",
        description: "Assessment-formuläret är inte längre tillgängligt för klienten.",
      });
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort tilldelning.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async (
    formDefinitionId: string,
    answers: Record<string, any>,
    comments?: string
  ) => {
    if (!userId || !user) return null;

    try {
      setLoading(true);
      
      // Calculate scores from answers
      const scores: Record<string, number> = {};
      Object.entries(answers).forEach(([key, value]) => {
        if (typeof value === 'number') {
          scores[key] = value;
        }
      });

      // Save assessment round
      const { data: roundData, error: roundError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: userId,
          form_definition_id: formDefinitionId,
          pillar_type: 'general', // Default value since we now have form-based assessments
          scores,
          answers,
          comments,
          created_by: user.id
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Call AI analysis function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'analyze-dynamic-assessment',
        {
          body: {
            assessment_round_id: roundData.id,
            form_definition_id: formDefinitionId,
            answers,
            comments,
            user_id: userId
          }
        }
      );

      if (aiError) {
        console.error('AI analysis error:', aiError);
      } else if (aiResponse?.analysis) {
        // Save AI analysis as path entry
        await supabase
          .from('path_entries')
          .insert({
            user_id: userId,
            created_by: user.id,
            type: 'recommendation',
            title: `AI-analys: ${aiResponse.form_name || 'Assessment'}`,
            details: aiResponse.analysis,
            ai_generated: true
          });

        // Update assessment round with AI analysis
        await supabase
          .from('assessment_rounds')
          .update({ ai_analysis: aiResponse.analysis })
          .eq('id', roundData.id);
      }
      
      await loadAssessmentRounds();
      
      toast({
        title: "Assessment genomförd",
        description: "Din bedömning har sparats och AI-analys har skapats.",
      });

      return roundData;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara assessment.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAssignedForms = () => {
    return assignments.map(a => a.form_definition_id);
  };

  const getLatestAssessment = (formDefinitionId: string) => {
    return assessmentRounds.find(round => round.form_definition_id === formDefinitionId);
  };

  return {
    loading,
    formDefinitions,
    assignments,
    assessmentRounds,
    loadQuestions,
    assignForm,
    removeAssignment,
    submitAssessment,
    getAssignedForms,
    getLatestAssessment,
    refreshData: () => {
      loadFormDefinitions();
      loadAssignments();
      loadAssessmentRounds();
    }
  };
};