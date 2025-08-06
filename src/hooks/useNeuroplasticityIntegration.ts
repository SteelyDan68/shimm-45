import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { ClientDataContainer, NeuroplasticityJourney } from '@/types/neuroplasticityJourney';
import { buildLovableAIPrompt, AIPromptBuilder } from '@/utils/aiPromptBuilder';

/**
 * Unified hook för neuroplastisk integration av alla pillar-assessments
 * Hanterar data integrity och single source of truth princip
 */
export const useNeuroplasticityIntegration = () => {
  const { user } = useAuth();
  const [clientContainer, setClientContainer] = useState<ClientDataContainer | null>(null);
  const [activeJourney, setActiveJourney] = useState<NeuroplasticityJourney | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Laddar och bygger klientens fullständiga datacontainer
   */
  const loadClientContainer = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Hämta alla pillar assessments
      const { data: pillarData } = await supabase.functions.invoke('get-user-attribute', {
        body: { user_id: user.id, attribute_key: 'pillar_assessments' }
      });

      // Hämta wheel of life data  
      const { data: wheelData } = await supabase.functions.invoke('get-user-attribute', {
        body: { user_id: user.id, attribute_key: 'wheel_of_life_scores' }
      });

      // Hämta neuroplasticity journeys
      const { data: journeyData } = await supabase.functions.invoke('get-user-attribute', {
        body: { user_id: user.id, attribute_key: 'neuroplasticity_journeys' }
      });

      // Bygg fullständig container
      const container: ClientDataContainer = {
        user_id: user.id,
        pillar_assessments: pillarData?.attribute_value || {},
        wheel_of_life_scores: wheelData?.attribute_value || {},
        personality_profile: {
          learning_style: 'visual', // Default, bör komma från assessment
          motivation_drivers: ['achievement', 'growth'],
          stress_response_patterns: ['problem_solving'],
          communication_preferences: ['direct', 'supportive'],
          decision_making_style: 'analytical'
        },
        life_context: {
          life_phase: 'establishment',
          major_life_events: [],
          current_challenges: [],
          support_system_strength: 7,
          time_availability: 'moderate',
          energy_patterns: ['morning_person']
        },
        resource_inventory: {
          financial_resources: 'adequate',
          time_resources: 'moderate', 
          social_resources: ['professional_network'],
          knowledge_resources: ['domain_expertise'],
          practical_resources: ['technology_access'],
          emotional_resources: ['resilience']
        },
        journey_history: journeyData?.attribute_value || [],
        behavioral_patterns: [],
        prompt_personalization_data: {
          preferred_communication_tone: 'supportive',
          effective_motivation_language: ['encouraging', 'evidence-based'],
          resonant_metaphors: ['growth', 'journey'],
          cultural_context_factors: ['swedish'],
          language_complexity_preference: 'moderate',
          response_length_preference: 'detailed',
          actionable_granularity: 'standard',
          feedback_sensitivity: 7
        },
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        data_version: '1.0'
      };

      setClientContainer(container);
    } catch (error) {
      console.error('Error loading client container:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Skapar AI-prompt för pillar-analys
   */
  const generatePillarAnalysisPrompt = useCallback((
    pillarKey: string,
    assessmentData: Record<string, any>
  ): string => {
    if (!clientContainer) return '';
    
    return buildLovableAIPrompt(clientContainer, {
      pillar_key: pillarKey,
      assessment_data: assessmentData,
      analysis_type: 'pillar_analysis'
    });
  }, [clientContainer]);

  /**
   * Skapar neuroplastisk utvecklingsplan
   */
  const createNeuroplasticJourney = useCallback(async (
    journeyType: string,
    intensity: 'introduction' | 'moderate' | 'transformation',
    duration: 28 | 42 | 66
  ) => {
    if (!user || !clientContainer) return null;

    try {
      const newJourney: NeuroplasticityJourney = {
        id: crypto.randomUUID(),
        user_id: user.id,
        journey_type: journeyType as any,
        intensity,
        duration_days: duration,
        created_at: new Date().toISOString(),
        neuroplasticity_phase: 'preparation',
        habit_formation_data: {
          streak_count: 0,
          consistency_rate: 0,
          neural_pathway_strength: 1,
          optimal_reminder_times: ['07:00', '12:00', '19:00'],
          environmental_cues: [],
          reward_mechanisms: []
        },
        daily_actions: [],
        weekly_reflections: [],
        milestone_checkpoints: [],
        adaptation_triggers: [],
        success_metrics: {
          baseline_assessment_scores: clientContainer.pillar_assessments,
          current_assessment_scores: {},
          behavioral_indicators: [],
          subjective_wellbeing_trend: [],
          goal_achievement_rate: 0
        }
      };

      // Spara till user attributes
      const currentJourneys = clientContainer.journey_history || [];
      currentJourneys.push(newJourney);

      await supabase.functions.invoke('update-user-attribute', {
        body: {
          user_id: user.id,
          attribute_key: 'neuroplasticity_journeys',
          attribute_value: currentJourneys
        }
      });

      setActiveJourney(newJourney);
      return newJourney;
    } catch (error) {
      console.error('Error creating neuroplastic journey:', error);
      return null;
    }
  }, [user, clientContainer]);

  useEffect(() => {
    loadClientContainer();
  }, [loadClientContainer]);

  return {
    clientContainer,
    activeJourney,
    isLoading,
    loadClientContainer,
    generatePillarAnalysisPrompt,
    createNeuroplasticJourney,
    // AI prompt builders
    buildCoachingPrompt: (context: string, goal: string) => 
      clientContainer ? AIPromptBuilder.buildCoachingPrompt(clientContainer, context, goal as any) : '',
    buildExternalLLMPrompt: (query: string) =>
      clientContainer ? AIPromptBuilder.buildExternalLLMPrompt(clientContainer, query) : null
  };
};