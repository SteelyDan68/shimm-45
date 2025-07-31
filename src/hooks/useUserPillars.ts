import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PillarKey } from '@/types/fivePillarsModular';

export interface UserPillarActivation {
  id: string;
  user_id: string;
  pillar_key: PillarKey;
  is_active: boolean;
  activated_by: string;
  activated_at: string;
  updated_at: string;
}

export interface UserPillarAssessment {
  id: string;
  user_id: string;
  pillar_key: PillarKey;
  assessment_data: any;
  calculated_score: number | null;
  ai_analysis: string | null;
  insights: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useUserPillars = (userId: string) => {
  const [activations, setActivations] = useState<UserPillarActivation[]>([]);
  const [assessments, setAssessments] = useState<UserPillarAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivations = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('client_pillar_activations')
        .select('*')
        .eq('user_id', userId)
        .order('activated_at', { ascending: false });

      if (error) throw error;
      setActivations(data as UserPillarActivation[] || []);
    } catch (error) {
      console.error('Error fetching pillar activations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pillar activations",
        variant: "destructive",
      });
    }
  };

  const fetchAssessments = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data as UserPillarAssessment[] || []);
    } catch (error) {
      console.error('Error fetching pillar assessments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pillar assessments",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchActivations(), fetchAssessments()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const activatePillar = async (pillarKey: PillarKey) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('client_pillar_activations')
        .insert({
          user_id: userId,
          client_id: userId, // For backward compatibility
          pillar_key: pillarKey,
          is_active: true,
          activated_by: userId
        });

      if (error) throw error;
      
      await fetchActivations();
      toast({
        title: "Success",
        description: "Pillar activated successfully",
      });
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Error",
        description: "Failed to activate pillar",
        variant: "destructive",
      });
    }
  };

  const deactivatePillar = async (pillarKey: PillarKey) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('client_pillar_activations')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_key', pillarKey);

      if (error) throw error;
      
      await fetchActivations();
      toast({
        title: "Success",
        description: "Pillar deactivated successfully",
      });
    } catch (error) {
      console.error('Error deactivating pillar:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate pillar",
        variant: "destructive",
      });
    }
  };

  const getActivatedPillars = () => {
    return activations
      .filter(activation => activation.is_active)
      .map(activation => activation.pillar_key);
  };

  const getLatestAssessment = (pillarKey: PillarKey) => {
    return assessments.find(assessment => assessment.pillar_key === pillarKey);
  };

  const isPillarActive = (pillarKey: PillarKey) => {
    return activations.some(activation => 
      activation.pillar_key === pillarKey && activation.is_active
    );
  };

  return {
    activations,
    assessments,
    loading,
    activatePillar,
    deactivatePillar,
    getActivatedPillars,
    getLatestAssessment,
    isPillarActive,
    refetch: fetchData,
  };
};