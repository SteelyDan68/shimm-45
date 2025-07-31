import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StefanInteraction, UserJourneyState } from '@/types/welcomeAssessment';
import { STEFAN_PERSONAS, STEFAN_TRIGGER_CONTEXTS } from '@/config/stefanPersonas';
import { useToast } from '@/hooks/use-toast';

export const useStefanPersonality = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<string>('mentor');
  const [recentInteractions, setRecentInteractions] = useState<StefanInteraction[]>([]);
  const [journeyState, setJourneyState] = useState<UserJourneyState | null>(null);

  // Load user's journey state and recent Stefan interactions
  const loadUserContext = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load journey state
      const { data: journeyData, error: journeyError } = await supabase
        .from('user_journey_states')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (journeyError) {
        console.error('Error loading journey state:', journeyError);
      } else {
        setJourneyState(journeyData);
      }

      // Load recent Stefan interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('stefan_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (interactionsError) {
        console.error('Error loading Stefan interactions:', interactionsError);
      } else {
        setRecentInteractions(interactionsData || []);
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserContext();
  }, [loadUserContext]);

  // Determine appropriate Stefan persona based on context
  const selectPersonaForContext = useCallback((
    context: string,
    userState?: any
  ): string => {
    const contextConfig = STEFAN_TRIGGER_CONTEXTS[context as keyof typeof STEFAN_TRIGGER_CONTEXTS];
    
    if (!contextConfig) return 'mentor';

    // Simple logic for persona selection - can be made more sophisticated
    if (context === 'assessment_completion') {
      return userState?.overall_score > 7 ? 'cheerleader' : 'mentor';
    }
    
    if (context === 'low_scores' || context === 'support_offering') {
      return 'friend';
    }
    
    if (context === 'high_scores' || context === 'milestone_celebration') {
      return 'cheerleader';
    }
    
    if (context.includes('skill_') || context.includes('brand_') || context.includes('economy_')) {
      return 'strategist';
    }

    return contextConfig.personas[0] || 'mentor';
  }, []);

  // Create a Stefan interaction
  const createStefanInteraction = useCallback(async (
    interactionType: string,
    context: string,
    contextData: Record<string, any> = {},
    customMessage?: string
  ): Promise<StefanInteraction | null> => {
    if (!user) return null;

    try {
      const selectedPersona = selectPersonaForContext(context, contextData);
      
      // Get AI-generated message if no custom message provided
      let messageContent = customMessage;
      
      if (!messageContent) {
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
          'stefan-ai-chat',
          {
            body: {
              user_id: user.id,
              persona: selectedPersona,
              context: context,
              context_data: contextData,
              interaction_type: interactionType,
              journey_state: journeyState,
              recent_interactions: recentInteractions.slice(0, 3), // Last 3 interactions for context
            },
          }
        );

        if (aiError) {
          console.error('Stefan AI error:', aiError);
          toast({
            title: "Stefan kunde inte svara",
            description: "Ett fel uppstod när Stefan försökte prata med dig",
            variant: "destructive",
          });
          return null;
        }

        messageContent = aiResponse?.message;
      }

      // Save the interaction
      const { data: interaction, error: saveError } = await supabase
        .from('stefan_interactions')
        .insert({
          user_id: user.id,
          interaction_type: interactionType,
          stefan_persona: selectedPersona,
          context_data: contextData,
          message_content: messageContent,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving Stefan interaction:', saveError);
        return null;
      }

      // Update recent interactions
      setRecentInteractions(prev => [interaction, ...prev.slice(0, 9)]);
      setCurrentPersona(selectedPersona);

      // Update journey state intervention count
      if (journeyState) {
        await supabase
          .from('user_journey_states')
          .update({
            stefan_interventions_count: (journeyState.stefan_interventions_count || 0) + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      return interaction;
    } catch (error) {
      console.error('Error creating Stefan interaction:', error);
      return null;
    }
  }, [user, journeyState, recentInteractions, selectPersonaForContext, toast]);

  // Trigger proactive Stefan interventions based on conditions
  const triggerProactiveIntervention = useCallback(async (
    triggerCondition: string,
    additionalContext: Record<string, any> = {}
  ) => {
    if (!user || !journeyState) return;

    // Check if we should trigger based on frequency rules
    const lastIntervention = recentInteractions[0];
    const hoursSinceLastIntervention = lastIntervention 
      ? (Date.now() - new Date(lastIntervention.created_at).getTime()) / (1000 * 60 * 60)
      : 24;

    // Don't intervene too frequently (minimum 4 hours between interventions)
    if (hoursSinceLastIntervention < 4) return;

    const contextData = {
      trigger_condition: triggerCondition,
      journey_phase: journeyState.current_phase,
      journey_progress: journeyState.journey_progress,
      ...additionalContext,
    };

    await createStefanInteraction(
      'proactive',
      triggerCondition,
      contextData
    );
  }, [user, journeyState, recentInteractions, createStefanInteraction]);

  // Get current persona info
  const getCurrentPersonaInfo = useCallback(() => {
    return STEFAN_PERSONAS[currentPersona] || STEFAN_PERSONAS.mentor;
  }, [currentPersona]);

  // Update user response to Stefan interaction
  const updateUserResponse = useCallback(async (
    interactionId: string,
    userResponse: string
  ) => {
    try {
      const { error } = await supabase
        .from('stefan_interactions')
        .update({ user_response: userResponse })
        .eq('id', interactionId);

      if (error) {
        console.error('Error updating user response:', error);
        return false;
      }

      // Update local state
      setRecentInteractions(prev => 
        prev.map(interaction => 
          interaction.id === interactionId 
            ? { ...interaction, user_response: userResponse }
            : interaction
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating user response:', error);
      return false;
    }
  }, []);

  return {
    loading,
    currentPersona,
    recentInteractions,
    journeyState,
    createStefanInteraction,
    triggerProactiveIntervention,
    getCurrentPersonaInfo,
    updateUserResponse,
    loadUserContext,
  };
};