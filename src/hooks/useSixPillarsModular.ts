import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useCentralizedData } from '@/hooks/useCentralizedData';
import { supabase } from '@/integrations/supabase/client';
import { 
  PillarDefinition, 
  ClientPillarActivation, 
  PillarAssessment,
  PillarKey,
  PillarHeatmapData 
} from '@/types/sixPillarsModular';
import { PILLAR_MODULES } from '@/config/pillarModules';

// Helper function to calculate trend based on historical assessments
function calculateTrend(pillarKey: string, assessments: any[]): 'stable' | 'up' | 'down' {
  const pillarAssessments = assessments
    .filter((a: any) => a.pillar_key === pillarKey)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3); // Get last 3 assessments

  if (pillarAssessments.length < 2) return 'stable';

  const latest = pillarAssessments[0]?.calculated_score || 0;
  const previous = pillarAssessments[1]?.calculated_score || 0;
  
  const difference = latest - previous;
  
  if (difference > 0.5) return 'up';
  if (difference < -0.5) return 'down';
  return 'stable';
}

export const useSixPillarsModular = (clientId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pillarDefinitions, setPillarDefinitions] = useState<PillarDefinition[]>([]);
  
  // Use the new unified pillar system
  const {
    activations,
    assessments,
    loading: pillarsLoading,
    activatePillar: activatePillarBase,
    deactivatePillar: deactivatePillarBase,
    getActivatedPillars: getActivatedPillarsBase,
    getLatestAssessment: getLatestAssessmentBase,
    isPillarActive,
    refetch: refetchPillars,
    getCompletedPillars,
    savePillarAssessment
  } = useUserPillars(clientId || '');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPillarDefinitions();
  }, []);

  const loadPillarDefinitions = async () => {
    try {
      // Use attribute system for pillar definitions
      const { data, error } = await supabase.functions.invoke('get-user-attribute', {
        body: {
          user_id: 'system',
          attribute_key: 'pillar_definitions'
        }
      });

      if (error) throw error;
      
      const definitions = data?.attribute_value || [];
      setPillarDefinitions(definitions.filter((def: any) => def.is_active) as PillarDefinition[]);
    } catch (error) {
      console.error('Error loading pillar definitions:', error);
    }
  };

  const activatePillar = async (pillarKey: PillarKey) => {
    if (!clientId || !user) return;

    try {
      setLoading(true);
      await activatePillarBase(pillarKey);
      
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
      await deactivatePillarBase(pillarKey);
      
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
      
      console.log('🎯 Starting pillar assessment submission:', { pillarKey, clientId, calculatedScore });
      
      // 1. CRITICAL: Save to assessment_rounds for data consistency
      const { data: assessmentRound, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: clientId,
          created_by: user.id,
          pillar_type: pillarKey,
          answers: assessmentData,
          scores: { 
            [pillarKey]: calculatedScore,
            overall: calculatedScore 
          },
          comments: assessmentData.comments || ''
        })
        .select()
        .single();

      if (assessmentError) {
        console.error('Failed to save assessment round:', assessmentError);
        throw assessmentError;
      }

      console.log('✅ Assessment round saved:', assessmentRound.id);

      // 2. Save assessment using attribute system (for compatibility)
      await savePillarAssessment(pillarKey, assessmentData, calculatedScore);

      // 3. Call AI analysis function with enhanced prompt
      try {
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
          'analyze-pillar-module',
          {
            body: {
              pillar_key: pillarKey,
              assessment_data: assessmentData,
              calculated_score: calculatedScore,
              user_id: clientId,
              assessment_round_id: assessmentRound.id
            }
          }
        );

        if (!aiError && aiResponse?.analysis) {
          // 4. Update assessment_rounds with AI analysis
          await supabase
            .from('assessment_rounds')
            .update({ ai_analysis: aiResponse.analysis })
            .eq('id', assessmentRound.id);

          // 5. Create path entry for comprehensive tracking
          await supabase
            .from('path_entries')
            .insert({
              user_id: clientId,
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
                assessment_round_id: assessmentRound.id
              }
            });

          console.log('✅ AI Analysis completed and saved');

          // 6. GENERATE ACTIONABLES: Convert analysis to actionable recommendations
          const { error: actionableError } = await supabase.functions.invoke(
            'enhanced-ai-planning',
            {
              body: {
                user_id: clientId,
                preferences: {
                  intensity: 'moderate',
                  duration: 4, // 4 weeks
                  frequency: 'few-times-week'
                },
                assessment_data: assessmentData,
                context_data: {
                  pillar_focus: pillarKey,
                  assessment_score: calculatedScore,
                  ai_analysis: aiResponse.analysis
                }
              }
            }
          );

          if (!actionableError) {
            console.log('✅ Actionables generated successfully');
          } else {
            console.warn('Actionables generation failed:', actionableError);
          }
        }
      } catch (aiError) {
        console.warn('AI analysis failed but assessment was saved:', aiError);
      }
      
      // 7. CRITICAL: Mark pillar as completed by creating a path entry
      await supabase
        .from('path_entries')
        .insert({
          user_id: clientId,
          created_by: user.id,
          type: 'assessment',
          title: `${pillarKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - Bedömning slutförd`,
          details: `Pillar ${pillarKey} har genomförts framgångsrikt med score: ${calculatedScore}`,
          ai_generated: false,
          timestamp: new Date().toISOString(),
          metadata: {
            pillar_type: pillarKey,
            calculated_score: calculatedScore,
            assessment_round_id: assessmentRound.id,
            completion_status: 'completed'
          }
        });

      console.log('✅ Pillar completion marker created');
      
      toast({
        title: "✅ Assessment genomförd!",
        description: `Din ${pillarKey} bedömning har sparats och AI-analys skapas.`,
      });

      return { 
        id: assessmentRound.id,
        assessment_round_id: assessmentRound.id
      };
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
    return getActivatedPillarsBase();
  };

  const getLatestAssessment = (pillarKey: PillarKey): PillarAssessment | undefined => {
    const assessment = getLatestAssessmentBase(pillarKey);
    // Convert to expected format if needed
    return assessment as PillarAssessment | undefined;
  };

  const generateHeatmapData = (): PillarHeatmapData[] => {
    return pillarDefinitions.map(pillar => {
      const isActive = isPillarActive(pillar.pillar_key);
      const latestAssessment = getLatestAssessment(pillar.pillar_key);
      
      return {
        pillar_key: pillar.pillar_key,
        name: pillar.name,
        icon: pillar.icon || '',
        color_code: pillar.color_code,
        score: latestAssessment?.calculated_score || 0,
        trend: calculateTrend(pillar.pillar_key, assessments),
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
        body: { user_id: clientId }
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

  /**
   * DEPENDENCY MANAGEMENT: Radera alla dependencies när pillar görs om
   */
  const retakePillar = async (pillarKey: PillarKey): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // 1. Radera alla todos/actionables för denna pillar
      await supabase.functions.invoke('clear-pillar-dependencies', {
        body: { 
          user_id: user.id, 
          pillar_key: pillarKey,
          dependency_types: ['todos', 'calendar_events', 'ai_recommendations', 'progress_entries', 'neuroplasticity_journeys']
        }
      });

      // 2. Radera alla assessments för denna pillar (behåll bara den senaste draft om någon)
      const { error: assessmentError } = await supabase
        .from('assessment_rounds')
        .delete()
        .eq('user_id', user.id)
        .eq('pillar_type', pillarKey);

      if (assessmentError) throw assessmentError;

      // 3. Radera assessment states för denna pillar
      const { error: stateError } = await supabase
        .from('assessment_states')
        .delete()
        .eq('user_id', user.id)
        .eq('assessment_key', pillarKey);

      if (stateError) throw stateError;

      // 4. Refresh data
      await refetchPillars();
      
      toast({
        title: "Pillar återställd",
        description: `${PILLAR_MODULES[pillarKey]?.name} har återställts. Alla tidigare resultat och uppgifter har raderats.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error retaking pillar:', error);
      toast({
        title: "Fel vid återställning",
        description: "Kunde inte återställa pillaren. Försök igen.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    loading: loading || pillarsLoading,
    pillarDefinitions,
    activations,
    assessments,
    activatePillar,
    deactivatePillar,
    submitPillarAssessment,
    retakePillar,
    getActivatedPillars,
    getLatestAssessment,
    generateHeatmapData,
    getPillarDefinition,
    generateOverallAssessment,
    refreshData: () => {
      loadPillarDefinitions();
      refetchPillars();
    }
  };
};