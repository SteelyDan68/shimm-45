import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PillarKey } from '@/types/sixPillarsModular';
import { supabase } from '@/integrations/supabase/client';

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
      // Get pillar activations from path_entries using correct field names
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'action')
        .ilike('title', '%pelare:%')
        .or('title.ilike.*aktiverad*,title.ilike.*activated*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert path entries to expected format
      const formattedActivations: UserPillarActivation[] = (data || []).map((entry: any) => ({
        id: entry.id,
        user_id: userId,
        pillar_key: entry.metadata?.pillar_key || 'self_care', // fallback
        is_active: entry.metadata?.action === 'activate',
        activated_by: entry.created_by,
        activated_at: entry.timestamp || entry.created_at,
        updated_at: entry.updated_at
      })).filter(activation => activation.pillar_key); 
      
      setActivations(formattedActivations);
    } catch (error) {
      console.error('Error fetching pillar activations:', error);
      toast({
        title: "Kunde inte ladda Pillar progress",
        description: "Försök igen",
        variant: "destructive",
      });
    }
  };

  const fetchAssessments = async () => {
    if (!userId) return;
    
    try {
      // Get pillar assessments from path_entries using correct field names
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert path entries to expected format
      const formattedAssessments: UserPillarAssessment[] = (data || []).map((entry: any) => ({
        id: entry.id,
        user_id: userId,
        pillar_key: entry.metadata?.pillar_key || 'self_care', // fallback
        assessment_data: entry.metadata?.assessment_data || {},
        calculated_score: entry.metadata?.assessment_score || null,
        ai_analysis: entry.content || null,
        insights: entry.metadata?.insights || {},
        created_by: entry.created_by,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      })).filter(assessment => assessment.pillar_key);
      
      setAssessments(formattedAssessments);
    } catch (error) {
      console.error('Error fetching pillar assessments:', error);
      toast({
        title: "Kunde inte ladda Pillar progress",
        description: "Försök igen",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchActivations(), fetchAssessments()]);
    } catch (error) {
      console.error('Error fetching pillar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setActivations([]);
      setAssessments([]);
      setLoading(false);
    }
  }, [userId]);

  const activatePillar = async (pillarKey: PillarKey) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: userId,
          created_by: userId,
          timestamp: new Date().toISOString(),
          type: 'action',
          title: `Aktiverad pelare: ${pillarKey}`,
          details: `Pelare ${pillarKey} aktiverad för utvecklingsresa`,
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          metadata: {
            pillar_key: pillarKey,
            action: 'activate',
            activated_at: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      await fetchActivations();
      toast({
        title: "Framgång",
        description: "Pelare aktiverad",
      });
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte aktivera pelare",
        variant: "destructive",
      });
    }
  };

  const deactivatePillar = async (pillarKey: PillarKey) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: userId,
          created_by: userId,
          timestamp: new Date().toISOString(),
          type: 'action',
          title: `Deaktiverad pelare: ${pillarKey}`,
          details: `Pelare ${pillarKey} deaktiverad`,
          status: 'completed',
          ai_generated: false,
          visible_to_client: true,
          metadata: {
            pillar_key: pillarKey,
            action: 'deactivate',
            deactivated_at: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      await fetchActivations();
      toast({
        title: "Framgång",
        description: "Pelare deaktiverad",
      });
    } catch (error) {
      console.error('Error deactivating pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte deaktivera pelare",
        variant: "destructive",
      });
    }
  };

  const getActivatedPillars = () => {
    return activations
      .filter(activation => activation.is_active)
      .map(activation => activation.pillar_key);
  };

  const getCompletedPillars = () => {
    return assessments
      .filter(assessment => assessment.calculated_score !== null)
      .map(assessment => assessment.pillar_key)
      .filter((pillarKey, index, arr) => arr.indexOf(pillarKey) === index);
  };

  const getLatestAssessment = (pillarKey: PillarKey) => {
    return assessments
      .filter(assessment => assessment.pillar_key === pillarKey)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const isPillarActive = (pillarKey: PillarKey) => {
    return activations.some(activation => 
      activation.pillar_key === pillarKey && activation.is_active
    );
  };

  const savePillarAssessment = async (pillarKey: PillarKey, assessmentData: any, calculatedScore?: number, aiAnalysis?: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('path_entries')
        .insert({
          user_id: userId,
          created_by: userId,
          timestamp: new Date().toISOString(),
          type: 'assessment',
          title: `Bedömning: ${pillarKey}`,
          details: `Slutförd bedömning för pelare ${pillarKey}`,
          content: aiAnalysis || '',
          status: 'completed',
          ai_generated: !!aiAnalysis,
          visible_to_client: true,
          metadata: {
            pillar_key: pillarKey,
            assessment_score: calculatedScore,
            assessment_data: assessmentData,
            insights: {},
            completed: true
          }
        });

      if (error) throw error;
      
      await fetchAssessments();
      toast({
        title: "Framgång",
        description: "Pelare-bedömning sparad",
      });
    } catch (error) {
      console.error('Error saving pillar assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bedömning",
        variant: "destructive",
      });
    }
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
    getCompletedPillars,
    savePillarAssessment,
  };
};