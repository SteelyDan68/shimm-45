import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserAssessmentRound {
  id: string;
  user_id: string;
  client_id: string;
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
  client_id: string;
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
    fetchData();
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
      // Get client_id for backwards compatibility
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!clientData) {
        throw new Error('Client not found for user');
      }

      const { data, error } = await supabase
        .from('assessment_rounds')
        .insert({
          ...assessmentData,
          client_id: clientData.id,
          user_id: userId,
          created_by: userId,
        })
        .select()
        .single();

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