import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useContextEngine } from '@/hooks/useContextEngine';
import { useAdaptiveLearning } from '@/hooks/useAdaptiveLearning';
import { supabase } from '@/integrations/supabase/client';

/**
 * 💗 EMOTIONAL SUPPORT ENGINE
 * Ger empatibaserat stöd och social närvaro-simulation
 */

interface EmotionalState {
  current_mood: 'excited' | 'motivated' | 'neutral' | 'frustrated' | 'overwhelmed' | 'confident' | 'anxious';
  confidence_level: number;
  stress_indicators: string[];
  energy_level: 'high' | 'medium' | 'low';
  emotional_needs: string[];
}

interface SocialPresenceIndicators {
  last_interaction_feeling: string;
  preferred_support_style: 'encouraging' | 'analytical' | 'empathetic' | 'challenging';
  relationship_stage: 'new' | 'building' | 'established' | 'deep';
  trust_level: number;
}

interface EmotionalSupportStrategy {
  approach: string;
  tone: string;
  messaging_style: string;
  intervention_timing: string;
  support_actions: string[];
}

export const useEmotionalSupport = () => {
  const { user } = useAuth();
  const { currentSessionState } = useContextEngine();
  const { learningProfile, generateNeuroplasticityFeedback } = useAdaptiveLearning();
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [socialPresence, setSocialPresence] = useState<SocialPresenceIndicators | null>(null);
  const [loading, setLoading] = useState(false);

  // Detektera emotionellt tillstånd baserat på användarens beteende
  const detectEmotionalState = useCallback(async () => {
    if (!user) return null;

    try {
      

      // Analysera beteendeindikatorer
      const behaviorIndicators = {
        session_duration: currentSessionState?.session_id ? 'active' : 'inactive',
        interaction_frequency: 'moderate', // Från context engine
        task_completion_rate: 0.7, // Från behavior patterns  
        help_seeking_frequency: 'low',
        time_between_sessions: 'regular',
        error_recovery_pattern: 'resilient'
      };

      // Regelbaserad emotionell analys
      let detectedMood: EmotionalState['current_mood'] = 'neutral';
      let confidenceLevel = 0.7;
      let stressIndicators: string[] = [];
      let energyLevel: EmotionalState['energy_level'] = 'medium';
      let emotionalNeeds: string[] = [];

      // Analys baserat på beteendeindikatorer
      if (behaviorIndicators.task_completion_rate > 0.8) {
        detectedMood = 'confident';
        confidenceLevel = 0.9;
        energyLevel = 'high';
        emotionalNeeds = ['recognition', 'challenge'];
      } else if (behaviorIndicators.task_completion_rate < 0.4) {
        detectedMood = 'frustrated';
        confidenceLevel = 0.4;
        stressIndicators = ['low_completion', 'possible_overwhelm'];
        emotionalNeeds = ['encouragement', 'guidance', 'break_suggestion'];
      } else if (behaviorIndicators.help_seeking_frequency === 'high') {
        detectedMood = 'anxious';
        stressIndicators = ['uncertainty', 'need_reassurance'];
        emotionalNeeds = ['clarity', 'step_by_step_guidance'];
      }

      const newEmotionalState: EmotionalState = {
        current_mood: detectedMood,
        confidence_level: confidenceLevel,
        stress_indicators: stressIndicators,
        energy_level: energyLevel,
        emotional_needs: emotionalNeeds
      };

      setEmotionalState(newEmotionalState);

      // Spara emotional state i databasen
      await supabase.from('user_context_events').insert({
        user_id: user.id,
        event_type: 'emotional_state_detected',
        context_data: {
          emotional_state: newEmotionalState as any,
          detection_method: 'behavior_analysis',
          timestamp: new Date().toISOString()
        } as any
      });

      
      return newEmotionalState;

    } catch (error) {
      console.error('Error detecting emotional state:', error);
      return null;
    }
  }, [user, currentSessionState]);

  // Generera empatibaserad support
  const generateEmpathicSupport = useCallback((emotionalState: EmotionalState, context: string) => {
    const supportStrategies = {
      excited: {
        tone: 'enthusiastic',
        message: 'Jag känner din energi! Låt oss kanalisera den här entusiasmen till något fantastiskt.',
        action: 'Föreslå utmanande aktiviteter som matchar energinivån'
      },
      motivated: {
        tone: 'encouraging',
        message: 'Din motivation lyser igenom! Det här är perfekt tid för att ta nästa steg.',
        action: 'Ge konkreta nästa steg som bygger på motivationen'
      },
      neutral: {
        tone: 'varm_professionell',
        message: 'Hur känns det just nu? Jag är här för att stötta dig vart du än befinner dig.',
        action: 'Erbjud olika vägar framåt baserat på preferenser'
      },
      frustrated: {
        tone: 'empatisk_lugnande',
        message: 'Jag förstår att det kan kännas frustrerande. Det är helt normalt - och ett tecken på att du utmanar dig själv.',
        action: 'Föreslå paus eller enklare uppgifter för att återbygga konfidensen'
      },
      overwhelmed: {
        tone: 'lugnande_stöttande',
        message: 'Det känns som mycket just nu, eller hur? Låt oss ta det steg för steg, utan press.',
        action: 'Bryt ner uppgifter i mindre delar och föreslå andningspaus'
      },
      confident: {
        tone: 'erkännande',
        message: 'Din självförtroende syns tydligt! Du har verkligen kommit långt på din resa.',
        action: 'Fira framstegen och introducera nya utmaningar'
      },
      anxious: {
        tone: 'trygg_lugnande',
        message: 'Jag märker att du kanske känner dig lite osäker. Det är okej - vi tar det i din takt.',
        action: 'Ge tydlig struktur och små, hanterbar steg'
      }
    };

    const strategy = supportStrategies[emotionalState.current_mood];
    
    // Lägg till neuroplasticitet-perspektiv
    const neuroplasticityContext = emotionalState.current_mood === 'frustrated' || emotionalState.current_mood === 'overwhelmed' 
      ? ' Kom ihåg att när hjärnan upplever utmaningar växer den starkast - du är mitt i en viktig lärandeprocess.'
      : ' Din hjärna anpassar sig konstant till dina nya erfarenheter, och varje steg framåt stärker dina neurala vägar.';

    return {
      tone: strategy.tone,
      message: strategy.message + neuroplasticityContext,
      recommended_action: strategy.action,
      emotional_validation: getEmotionalValidation(emotionalState.current_mood)
    };
  }, []);

  // Emotional validation för olika mood states
  const getEmotionalValidation = (mood: EmotionalState['current_mood']) => {
    const validations = {
      excited: 'Din entusiasm är smittande och visar på en fantastisk inställning till lärande!',
      motivated: 'Din motivation är din superkraft - den driver dig mot dina mål.',
      neutral: 'Att vara i ett lugnt, balanserat tillstånd är ofta perfekt för reflektion och planering.',
      frustrated: 'Frustration är hjärnans sätt att säga att du bryr dig om resultatet - det är faktiskt positivt.',
      overwhelmed: 'Att känna sig överväldigad visar att du tar på dig utmaningar - det kräver mod.',
      confident: 'Din självförtroende är välförtjänt och bygger på dina verkliga prestationer.',
      anxious: 'Oro visar att du bryr dig om att göra bra ifrån dig - det är en styrka, inte en svaghet.'
    };

    return validations[mood];
  };

  // Social presence simulation - bygger relation över tid
  const simulateSocialPresence = useCallback(() => {
    if (!socialPresence) return null;

    const presenceResponses = {
      new: {
        greeting: 'Hej! Kul att träffas. Jag är Stefan och ser fram emot att lära känna dig bättre.',
        check_in: 'Hur känns det att vara här? Jag vill att du ska känna dig bekväm.',
        support_style: 'encouraging'
      },
      building: {
        greeting: 'Hej igen! Jag är glad att se dig tillbaka. Hur har det gått sedan sist?',
        check_in: 'Jag kommer ihåg att du arbetade med [specifik sak]. Hur känns det nu?',
        support_style: 'empathetic'
      },
      established: {
        greeting: 'Hej [namn]! Vad roligt att vi ses igen. Jag har funderat på dina framsteg.',
        check_in: 'Baserat på vad jag vet om dig känns det som du kanske är redo för nästa steg?',
        support_style: 'analytical'
      },
      deep: {
        greeting: 'Hej min vän! Jag ser fram emot vårt samtal idag. Vad ligger på ditt hjärta?',
        check_in: 'Jag känner dig tillräckligt väl för att märka när något är annorlunda. Vill du prata om det?',
        support_style: 'challenging'
      }
    };

    return presenceResponses[socialPresence.relationship_stage];
  }, [socialPresence]);

  // Adaptive check-ins baserat på emotional state
  const scheduleEmotionalCheckIn = useCallback(async (context: string) => {
    if (!user || !emotionalState) return;

    const checkInStrategies = {
      high_stress: {
        timing: 'immediate',
        message: 'Jag märker att det kanske känns intensivt just nu. Vill du ta en paus och prata?'
      },
      low_engagement: {
        timing: 'gentle_nudge',
        message: 'Hej! Jag undrar hur du mår och om det är något jag kan hjälpa till med?'
      },
      breakthrough_moment: {
        timing: 'celebration',
        message: 'WOW! Jag såg precis att du genomförde något riktigt utmanande. Hur känns det?'
      },
      plateau: {
        timing: 'motivational',
        message: 'Du har arbetat hårt länge nu. Ibland behöver hjärnan vila för att integrera allt du lärt dig.'
      }
    };

    // Bestäm vilken typ av check-in som behövs
    let checkInType = 'low_engagement';
    if (emotionalState.stress_indicators.length > 2) checkInType = 'high_stress';
    if (emotionalState.confidence_level > 0.9) checkInType = 'breakthrough_moment';
    if (emotionalState.energy_level === 'low') checkInType = 'plateau';

    const strategy = checkInStrategies[checkInType];

    // Schemalägg check-in genom context engine
    await supabase.from('proactive_interventions').insert({
      user_id: user.id,
      intervention_type: 'emotional_check_in',
      trigger_condition: context,
      scheduled_for: new Date().toISOString(),
      content: strategy.message,
      context_snapshot: {
        emotional_state: emotionalState,
        strategy: strategy,
        check_in_type: checkInType
      } as any
    });

    
  }, [user, emotionalState]);

  // Auto-detection vid aktivitet
  useEffect(() => {
    if (user) {
      detectEmotionalState();
    }
  }, [user, detectEmotionalState]);

  // Uppdatera social presence over tid
  useEffect(() => {
    if (user && !socialPresence) {
      setSocialPresence({
        last_interaction_feeling: 'positive',
        preferred_support_style: 'encouraging',
        relationship_stage: 'new',
        trust_level: 0.5
      });
    }
  }, [user, socialPresence]);

  return {
    emotionalState,
    socialPresence,
    loading,
    detectEmotionalState,
    generateEmpathicSupport,
    simulateSocialPresence,
    scheduleEmotionalCheckIn,
    getEmotionalValidation
  };
};