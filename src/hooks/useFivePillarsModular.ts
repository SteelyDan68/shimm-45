import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  PillarDefinition, 
  ClientPillarActivation, 
  PillarAssessment,
  PillarKey,
  PillarHeatmapData 
} from '@/types/fivePillarsModular';

export const useFivePillarsModular = (clientId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pillarDefinitions, setPillarDefinitions] = useState<PillarDefinition[]>([]);
  const [activations, setActivations] = useState<ClientPillarActivation[]>([]);
  const [assessments, setAssessments] = useState<PillarAssessment[]>([]);

  useEffect(() => {
    loadPillarDefinitions();
    if (clientId && user) {
      loadActivations();
      loadAssessments();
    }
  }, [clientId, user]);

  const loadPillarDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from('pillar_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPillarDefinitions((data || []) as PillarDefinition[]);
    } catch (error) {
      console.error('Error loading pillar definitions:', error);
    }
  };

  const loadActivations = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('client_pillar_activations')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (error) throw error;
      setActivations((data || []) as ClientPillarActivation[]);
    } catch (error) {
      console.error('Error loading activations:', error);
    }
  };

  const loadAssessments = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments((data || []) as PillarAssessment[]);
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const activatePillar = async (pillarKey: PillarKey) => {
    if (!clientId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_pillar_activations')
        .upsert({
          client_id: clientId,
          pillar_key: pillarKey,
          is_active: true,
          activated_by: user.id
        });

      if (error) throw error;
      
      await loadActivations();
      toast({
        title: "Pelare aktiverad",
        description: `${pillarKey} har aktiverats för klienten.`,
      });
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte aktivera pelare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivatePillar = async (pillarKey: PillarKey) => {
    if (!clientId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('client_pillar_activations')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('pillar_key', pillarKey);

      if (error) throw error;
      
      await loadActivations();
      toast({
        title: "Pelare inaktiverad",
        description: `${pillarKey} har inaktiverats för klienten.`,
      });
    } catch (error) {
      console.error('Error deactivating pillar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte inaktivera pelare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitPillarAssessment = async (
    pillarKey: PillarKey,
    assessmentData: Record<string, any>,
    calculatedScore: number
  ) => {
    if (!clientId || !user) return null;

    try {
      setLoading(true);
      
      // Save assessment
      const { data: assessmentResult, error: assessmentError } = await supabase
        .from('pillar_assessments')
        .insert({
          client_id: clientId,
          pillar_key: pillarKey,
          assessment_data: assessmentData,
          calculated_score: calculatedScore,
          created_by: user.id
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Call AI analysis function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'analyze-pillar-module',
        {
          body: {
            assessment_id: assessmentResult.id,
            pillar_key: pillarKey,
            assessment_data: assessmentData,
            calculated_score: calculatedScore,
            client_id: clientId
          }
        }
      );

      if (aiError) {
        console.error('AI analysis error:', aiError);
      } else if (aiResponse?.analysis) {
        // Update assessment with AI analysis
        await supabase
          .from('pillar_assessments')
          .update({ 
            ai_analysis: aiResponse.analysis,
            insights: aiResponse.insights || {}
          })
          .eq('id', assessmentResult.id);

        // Save as path entry with pillar metadata
        await supabase
          .from('path_entries')
          .insert({
            client_id: clientId,
            created_by: user.id,
            type: 'recommendation',
            title: `${pillarKey} Assessment AI-Analys`,
            details: aiResponse.analysis,
            ai_generated: true,
            timestamp: new Date().toISOString(),
            metadata: {
              pillar_type: pillarKey,
              pillar_name: pillarKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              assessment_score: calculatedScore,
              assessment_id: assessmentResult.id
            }
          });
      }
      
      await loadAssessments();
      
      toast({
        title: "Assessment genomförd",
        description: `Din ${pillarKey} bedömning har sparats och AI-analys har skapats.`,
      });

      return assessmentResult;
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

  const getActivatedPillars = (): PillarKey[] => {
    return activations.map(a => a.pillar_key);
  };

  const getLatestAssessment = (pillarKey: PillarKey): PillarAssessment | undefined => {
    return assessments.find(assessment => assessment.pillar_key === pillarKey);
  };

  const generateHeatmapData = (): PillarHeatmapData[] => {
    return pillarDefinitions.map(pillar => {
      const isActive = activations.some(a => a.pillar_key === pillar.pillar_key);
      const latestAssessment = getLatestAssessment(pillar.pillar_key);
      
      return {
        pillar_key: pillar.pillar_key,
        name: pillar.name,
        icon: pillar.icon || '',
        color_code: pillar.color_code,
        score: latestAssessment?.calculated_score || 0,
        trend: 'stable', // TODO: Calculate based on previous assessments
        last_assessment: latestAssessment?.created_at || '',
        is_active: isActive
      };
    });
  };

  const getPillarDefinition = (pillarKey: PillarKey): PillarDefinition | undefined => {
    return pillarDefinitions.find(p => p.pillar_key === pillarKey);
  };

  const generateOverallAssessment = async () => {
    if (!clientId) throw new Error('Client ID required');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-overall-assessment', {
        body: { client_id: clientId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating overall assessment:', error);
      toast({
        title: "Fel vid analys",
        description: "Kunde inte generera helhetsanalys",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    loading,
    pillarDefinitions,
    activations,
    assessments,
    activatePillar,
    deactivatePillar,
    submitPillarAssessment,
    getActivatedPillars,
    getLatestAssessment,
    generateHeatmapData,
    getPillarDefinition,
    generateOverallAssessment,
    refreshData: () => {
      loadPillarDefinitions();
      loadActivations();
      loadAssessments();
    }
  };
};