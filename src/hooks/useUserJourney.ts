import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { UserJourneyState } from '@/types/welcomeAssessment';
import { PILLAR_PRIORITY_ORDER } from '@/config/pillarModules';
import { useToast } from '@/hooks/use-toast';

export const useUserJourney = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [journeyState, setJourneyState] = useState<UserJourneyState | null>(null);

  // Load user's journey state
  const loadJourneyState = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_journey_states')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading journey state:', error);
        return;
      }

      // If no journey state exists, create initial state
      if (!data) {
        const initialState = {
          user_id: user.id,
          current_phase: 'welcome' as const,
          completed_assessments: [],
          next_recommended_assessment: null,
          journey_progress: 0,
          stefan_interventions_count: 0,
          last_activity_at: new Date().toISOString(),
          metadata: {},
        };

        const { data: newState, error: createError } = await supabase
          .from('user_journey_states')
          .insert(initialState)
          .select()
          .single();

        if (createError) {
          console.error('Error creating journey state:', createError);
          return;
        }

        setJourneyState(newState);
      } else {
        setJourneyState(data);
      }
    } catch (error) {
      console.error('Error loading journey state:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadJourneyState();
  }, [loadJourneyState]);

  // Update journey state after assessment completion and trigger autonomous coaching
  const updateJourneyAfterAssessment = useCallback(async (
    assessmentType: string,
    assessmentResult?: any
  ) => {
    if (!user || !journeyState) return;

    try {
      const completedAssessments = [...journeyState.completed_assessments];
      
      // Add assessment if not already completed
      if (!completedAssessments.includes(assessmentType)) {
        completedAssessments.push(assessmentType);
      }

      // Calculate new progress (each assessment is worth points)
      const progressIncrement = assessmentType === 'welcome' ? 20 : 15;
      const newProgress = Math.min(journeyState.journey_progress + progressIncrement, 100);

      // Determine next phase and recommended assessment
      let newPhase = journeyState.current_phase;
      let nextRecommendedAssessment = journeyState.next_recommended_assessment;

      if (assessmentType === 'welcome') {
        newPhase = 'pillar_selection';
        // Recommend first pillar or based on low Wheel of Life scores
        nextRecommendedAssessment = determineNextPillar(assessmentResult);
      } else if (PILLAR_PRIORITY_ORDER.includes(assessmentType as any)) {
        // If this was a pillar assessment, recommend next pillar
        const currentPillarIndex = PILLAR_PRIORITY_ORDER.indexOf(assessmentType as any);
        if (currentPillarIndex < PILLAR_PRIORITY_ORDER.length - 1) {
          nextRecommendedAssessment = PILLAR_PRIORITY_ORDER[currentPillarIndex + 1];
        } else {
          newPhase = 'maintenance';
          nextRecommendedAssessment = null;
        }
      }

      // Update journey state
      const { data: updatedState, error } = await supabase
        .from('user_journey_states')
        .update({
          current_phase: newPhase,
          completed_assessments: completedAssessments,
          next_recommended_assessment: nextRecommendedAssessment,
          journey_progress: newProgress,
          last_activity_at: new Date().toISOString(),
          metadata: {
            ...journeyState.metadata,
            [`${assessmentType}_completed_at`]: new Date().toISOString(),
            latest_assessment_result: assessmentResult,
          },
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating journey state:', error);
        return;
      }

      setJourneyState(updatedState);

      // AUTONOMOUS COACHING: Generate AI-driven action plan
      await generateAutonomousActionPlan(assessmentType, assessmentResult, newProgress);

      // Show progress notification
      toast({
        title: "Framsteg registrerat!",
        description: `Du har genomfört ${completedAssessments.length} bedömningar. Stefan förbereder dina nästa steg!`,
      });

    } catch (error) {
      console.error('Error updating journey after assessment:', error);
    }
  }, [user, journeyState, toast]);

  // Generate autonomous action plan based on assessment results
  const generateAutonomousActionPlan = async (
    assessmentType: string,
    assessmentResult: any,
    currentProgress: number
  ) => {
    if (!user) return;

    try {
      // Call AI planning function to create personalized tasks
      await supabase.functions.invoke('generate-ai-planning', {
        body: {
          user_id: user.id,
          assessment_type: assessmentType,
          assessment_result: assessmentResult,
          journey_progress: currentProgress,
          current_phase: journeyState?.current_phase,
          recommendation_text: generateRecommendationText(assessmentType, assessmentResult),
          weeks: 3 // Generate 3-week plan
        }
      });

      
    } catch (error) {
      console.error('Error generating autonomous action plan:', error);
    }
  };

  // Generate contextual recommendation text for AI planning
  const generateRecommendationText = (assessmentType: string, result: any): string => {
    const baseRecommendations = {
      welcome: "Baserat på din välkomstbedömning, fokusera på att skapa hållbara rutiner och identifiera dina främsta utvecklingsområden.",
      self_care: "Utveckla din självvård genom att skapa dagliga rutiner som stärker din fysiska och mentala hälsa.",
      skills: "Bygg dina färdigheter steg för steg genom praktiska övningar och reflektion över dina framsteg.",
      talent: "Utforska och utveckla dina naturliga talanger genom målriktade aktiviteter och experiment.",
      brand: "Stärk ditt varumärke genom att tydliggöra ditt värde och kommunicera det konsekvent.",
      economy: "Förbättra din ekonomiska situation genom smart planering och medvetna val."
    };

    let recommendation = baseRecommendations[assessmentType as keyof typeof baseRecommendations] || 
                        "Fortsätt din utveckling genom små, konkreta steg varje dag.";

    // Add specific insights from assessment result
    if (result?.wheel_of_life_scores) {
      const lowestAreas = Object.entries(result.wheel_of_life_scores)
        .sort(([,a], [,b]) => (a as number) - (b as number))
        .slice(0, 2)
        .map(([area]) => area);
      
      recommendation += ` Fokusera särskilt på ${lowestAreas.join(' och ')}.`;
    }

    return recommendation;
  };

  // Determine next pillar based on Welcome Assessment results
  const determineNextPillar = (welcomeResult?: any) => {
    if (!welcomeResult?.wheel_of_life_scores) {
      return 'self_care'; // Default to self_care
    }

    // Find the lowest scoring Wheel of Life areas
    const scores = welcomeResult.wheel_of_life_scores;
    const sortedAreas = Object.entries(scores)
      .sort(([,a], [,b]) => (a as number) - (b as number));

    const lowestArea = sortedAreas[0]?.[0];

    // Map Wheel of Life areas to pillars
    const areaMapping: Record<string, string> = {
      'health': 'self_care',
      'career': 'skills',
      'finances': 'economy',
      'relationships': 'self_care',
      'personal_growth': 'talent',
      'fun_recreation': 'self_care',
      'environment': 'self_care',
      'family_friends': 'self_care',
    };

    return areaMapping[lowestArea] || 'self_care';
  };

  // Get recommended assessments for current user
  const getRecommendedAssessments = useCallback(() => {
    if (!journeyState) return [];

    const recommendations = [];

    // If welcome not completed, that's priority
    if (!journeyState.completed_assessments.includes('welcome')) {
      recommendations.push({
        type: 'welcome',
        title: 'Välkomstbedömning',
        description: 'Börja din resa med en omfattande livsbedömning',
        priority: 1,
        estimated_time: '15-20 minuter',
      });
      return recommendations;
    }

    // Add pillar recommendations based on journey state
    if (journeyState.next_recommended_assessment) {
      const pillarName = getPillarDisplayName(journeyState.next_recommended_assessment);
      recommendations.push({
        type: journeyState.next_recommended_assessment,
        title: `${pillarName} Bedömning`,
        description: `Fördjupa dig inom ${pillarName.toLowerCase()}`,
        priority: 1,
        estimated_time: '10-15 minuter',
      });
    }

    // Add other available pillars
    PILLAR_PRIORITY_ORDER.forEach((pillar, index) => {
      if (!journeyState.completed_assessments.includes(pillar) && 
          pillar !== journeyState.next_recommended_assessment) {
        const pillarName = getPillarDisplayName(pillar);
        recommendations.push({
          type: pillar,
          title: `${pillarName} Bedömning`,
          description: `Utveckla din ${pillarName.toLowerCase()}`,
          priority: index + 2,
          estimated_time: '10-15 minuter',
        });
      }
    });

    return recommendations.sort((a, b) => a.priority - b.priority);
  }, [journeyState]);

  const getPillarDisplayName = (pillarKey: string) => {
    const nameMapping: Record<string, string> = {
      'self_care': 'Välmående & Självvård',
      'skills': 'Färdigheter & Utveckling',
      'talent': 'Talang & Styrkor',
      'brand': 'Varumärke & Position',
      'economy': 'Ekonomi & Tillväxt',
    };
    return nameMapping[pillarKey] || pillarKey;
  };

  // Check if user should see specific assessment
  const shouldShowAssessment = useCallback((assessmentType: string) => {
    if (!journeyState) return false;

    // Welcome assessment always available if not completed
    if (assessmentType === 'welcome') {
      return !journeyState.completed_assessments.includes('welcome');
    }

    // Pillar assessments available after welcome is completed
    if (PILLAR_PRIORITY_ORDER.includes(assessmentType as any)) {
      return journeyState.completed_assessments.includes('welcome');
    }

    return false;
  }, [journeyState]);

  // Get journey progress percentage
  const getJourneyProgress = useCallback(() => {
    return journeyState?.journey_progress || 0;
  }, [journeyState]);

  // Get current phase description
  const getCurrentPhaseDescription = useCallback(() => {
    if (!journeyState) return '';

    const phaseDescriptions = {
      'welcome': 'Upptäck var du står idag',
      'pillar_selection': 'Fördjupa dig inom viktiga livsområden',
      'deep_dive': 'Utveckla specifika områden',
      'maintenance': 'Håll momentum och fortsätt växa',
    };

    return phaseDescriptions[journeyState.current_phase] || '';
  }, [journeyState]);

  // Get personalized pillar recommendations from welcome assessment
  const getPersonalizedPillarRecommendations = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: welcomeAssessment } = await supabase
        .from('welcome_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!welcomeAssessment?.recommendations) return null;

      return welcomeAssessment.recommendations;
    } catch (error) {
      console.error('Error getting pillar recommendations:', error);
      return null;
    }
  }, [user]);

  // Check if user has completed welcome assessment
  const hasCompletedWelcomeAssessment = useCallback(() => {
    return journeyState?.completed_assessments?.includes('welcome') || false;
  }, [journeyState]);

  return {
    loading,
    journeyState,
    loadJourneyState,
    updateJourneyAfterAssessment,
    getRecommendedAssessments,
    shouldShowAssessment,
    getJourneyProgress,
    getCurrentPhaseDescription,
    getPersonalizedPillarRecommendations,
    hasCompletedWelcomeAssessment,
  };
};