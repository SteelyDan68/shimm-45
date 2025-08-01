import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PillarType, AssessmentRound, ClientPillarAssignment } from '@/types/fivePillars';

export const useFivePillars = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<ClientPillarAssignment[]>([]);
  const [assessmentRounds, setAssessmentRounds] = useState<AssessmentRound[]>([]);

  useEffect(() => {
    if (userId && user) {
      loadAssignments();
      loadAssessmentRounds();
    }
  }, [userId, user]);

  const loadAssignments = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('client_pillar_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setAssignments((data || []) as ClientPillarAssignment[]);
    } catch (error) {
      console.error('Error loading pillar assignments:', error);
    }
  };

  const loadAssessmentRounds = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessmentRounds((data || []) as AssessmentRound[]);
    } catch (error) {
      console.error('Error loading assessment rounds:', error);
    }
  };

  const assignPillar = async (pillarType: PillarType) => {
    if (!userId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_pillar_assignments')
        .upsert({
          user_id: userId,
          client_id: userId, // Temporary for DB compatibility
          pillar_type: pillarType,
          is_active: true,
          assigned_by: user.id
        });

      if (error) throw error;
      
      await loadAssignments();
      toast({
        title: "Pelare tilldelad",
        description: `${pillarType} har lagts till för klienten.`,
      });
    } catch (error) {
      console.error('Error assigning pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte tilldela pelare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePillar = async (pillarType: PillarType) => {
    if (!userId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_pillar_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('pillar_type', pillarType);

      if (error) throw error;
      
      await loadAssignments();
      toast({
        title: "Pelare borttagen",
        description: `${pillarType} har tagits bort från klienten.`,
      });
    } catch (error) {
      console.error('Error removing pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort pelare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async (
    pillarType: PillarType, 
    scores: Record<string, number>, 
    comments?: string
  ) => {
    if (!userId || !user) return null;

    try {
      setLoading(true);
      
      // Save assessment round
      const { data: roundData, error: roundError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: userId,
          pillar_type: pillarType,
          scores,
          comments,
          created_by: user.id
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // TODO: Call AI analysis function and save as path_entry
      
      await loadAssessmentRounds();
      
      toast({
        title: "Bedömning sparad",
        description: `Din ${pillarType} bedömning har sparats.`,
      });

      return roundData;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bedömning.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAssignedPillars = () => {
    return assignments.map(a => a.pillar_type);
  };

  const getLatestAssessment = (pillarType: PillarType) => {
    return assessmentRounds.find(round => round.pillar_type === pillarType);
  };

  return {
    loading,
    assignments,
    assessmentRounds,
    assignPillar,
    removePillar,
    submitAssessment,
    getAssignedPillars,
    getLatestAssessment,
    refreshData: () => {
      loadAssignments();
      loadAssessmentRounds();
    }
  };
};