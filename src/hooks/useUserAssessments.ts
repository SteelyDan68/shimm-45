import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserAssessmentRound {
  id: string;
  user_id: string;
  pillar_type: string;
  form_definition_id: string | null;
  answers: any;
  scores: any;
  ai_analysis: string | null;
  comments: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserFormAssignment {
  id: string;
  user_id: string;
  form_definition_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string | null;
  is_active: boolean;
  reminder_sent: boolean;
  updated_at: string;
}

export const useUserAssessments = (userId: string) => {
  const [assessmentRounds, setAssessmentRounds] = useState<UserAssessmentRound[]>([]);
  const [formAssignments, setFormAssignments] = useState<UserFormAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssessmentRounds = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessmentRounds(data || []);
    } catch (error) {
      console.error('Error fetching assessment rounds:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assessment rounds",
        variant: "destructive",
      });
    }
  };

  const fetchFormAssignments = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('assessment_form_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setFormAssignments(data || []);
    } catch (error) {
      console.error('Error fetching form assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch form assignments",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAssessmentRounds(), fetchFormAssignments()]);
    setLoading(false);
  };

  useEffect(() => {
    // Only fetch when userId is available
    if (userId) {
      
      fetchData();
    } else {
      
    }
  }, [userId]);

  const createAssessmentRound = async (assessmentData: {
    pillar_type: string;
    form_definition_id?: string;
    answers: any;
    scores: any;
    comments?: string;
  }) => {
    if (!userId) return;

    try {
      // Use safe upsert function to prevent duplicates
      const { data, error } = await supabase.rpc('safe_assessment_upsert', {
        p_user_id: userId,
        p_pillar_type: assessmentData.pillar_type,
        p_answers: assessmentData.answers,
        p_scores: assessmentData.scores,
        p_comments: assessmentData.comments || null,
        p_ai_analysis: null
      });

      if (error) throw error;

      await fetchAssessmentRounds();
      toast({
        title: "Success",
        description: "Assessment completed successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating assessment round:', error);
      toast({
        title: "Error",
        description: "Failed to save assessment",
        variant: "destructive",
      });
    }
  };

  const getLatestAssessmentByPillar = (pillarType: string) => {
    return assessmentRounds.find(round => round.pillar_type === pillarType);
  };

  const getAssessmentHistory = (pillarType: string) => {
    return assessmentRounds
      .filter(round => round.pillar_type === pillarType)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getPendingAssignments = () => {
    return formAssignments.filter(assignment => {
      const hasCompletedAssessment = assessmentRounds.some(round => 
        round.form_definition_id === assignment.form_definition_id &&
        new Date(round.created_at) > new Date(assignment.assigned_at)
      );
      return !hasCompletedAssessment;
    });
  };

  const getOverdueAssignments = () => {
    const now = new Date();
    return getPendingAssignments().filter(assignment => 
      assignment.due_date && new Date(assignment.due_date) < now
    );
  };

  return {
    assessmentRounds,
    formAssignments,
    loading,
    createAssessmentRound,
    getLatestAssessmentByPillar,
    getAssessmentHistory,
    getPendingAssignments,
    getOverdueAssignments,
    refetch: fetchData,
  };
};