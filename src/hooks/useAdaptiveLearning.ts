import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useContextEngine } from '@/hooks/useContextEngine';

/**
 * 🎓 ADAPTIVE LEARNING STYLE DETECTOR
 * Analyserar användarens lärstilar och anpassar coaching-approach
 */

interface LearningStyle {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'multimodal';
  confidence: number;
  characteristics: string[];
  detected_behaviors: string[];
}

interface LearningPattern {
  preferred_time_of_day: string[];
  optimal_session_length: number;
  attention_span_minutes: number;
  learning_pace: 'slow' | 'moderate' | 'fast';
  feedback_preference: 'immediate' | 'delayed' | 'summary';
  motivation_triggers: string[];
}

interface AdaptiveLearningProfile {
  user_id: string;
  primary_learning_style: LearningStyle;
  secondary_learning_style?: LearningStyle;
  learning_patterns: LearningPattern;
  cognitive_load_tolerance: 'low' | 'medium' | 'high';
  neuroplasticity_indicators: {
    growth_mindset_score: number;
    resilience_level: number;
    adaptability_score: number;
  };
  last_updated: string;
}

export const useAdaptiveLearning = () => {
  const { user } = useAuth();
  const { currentSessionState } = useContextEngine();
  const [learningProfile, setLearningProfile] = useState<AdaptiveLearningProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Detektera lärstil baserat på användarens beteende
  const detectLearningStyle = useCallback(async () => {
    if (!user) return null;

    setLoading(true);
    try {
      

      // Samla beteendedata för analys
      const behaviorData = {
        user_id: user.id,
        session_interactions: currentSessionState,
        time_spent_patterns: [], // Från context engine
        interaction_preferences: [], // Vilka aktiviteter användaren väljer
        completion_patterns: [], // Hur användaren slutför uppgifter
        feedback_responses: [] // Hur användaren reagerar på olika feedback-typer
      };

      // Anropa AI för lärstil-analys
      const { data: analysisResult, error } = await supabase.functions.invoke('analyze-learning-style', {
        body: behaviorData
      });

      if (error) {
        console.error('Error analyzing learning style:', error);
        return null;
      }

      // Spara eller uppdatera learning profile
      const { data: savedProfile, error: saveError } = await supabase
        .from('user_behavior_patterns')
        .upsert({
          user_id: user.id,
          pattern_type: 'learning_style',
          pattern_data: analysisResult,
          confidence_score: analysisResult.confidence || 0.7,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,pattern_type'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving learning profile:', saveError);
      }

      setLearningProfile(analysisResult);
      
      return analysisResult;

    } catch (error) {
      console.error('Error in learning style detection:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentSessionState]);

  // Anpassa innehåll baserat på lärstil
  const adaptContentForLearningStyle = useCallback((content: any, learningStyle: LearningStyle) => {
    const adaptations = {
      visual: {
        presentation: 'infographics_charts',
        instructions: 'step_by_step_visual',
        feedback: 'progress_bars_icons',
        examples: 'diagrams_illustrations'
      },
      auditory: {
        presentation: 'audio_explanations',
        instructions: 'spoken_guidance',
        feedback: 'verbal_confirmation',
        examples: 'audio_stories'
      },
      kinesthetic: {
        presentation: 'interactive_elements',
        instructions: 'hands_on_practice',
        feedback: 'physical_progress',
        examples: 'role_playing'
      },
      reading_writing: {
        presentation: 'detailed_text',
        instructions: 'written_guides',
        feedback: 'written_summaries',
        examples: 'text_case_studies'
      },
      multimodal: {
        presentation: 'combined_media',
        instructions: 'multiple_formats',
        feedback: 'varied_feedback',
        examples: 'diverse_examples'
      }
    };

    return {
      ...content,
      adapted_for: learningStyle.type,
      presentation_style: adaptations[learningStyle.type].presentation,
      instruction_format: adaptations[learningStyle.type].instructions,
      feedback_format: adaptations[learningStyle.type].feedback,
      example_type: adaptations[learningStyle.type].examples
    };
  }, []);

  // Beräkna optimal session-längd baserat på användarprofil
  const calculateOptimalSessionLength = useCallback(() => {
    if (!learningProfile) return 15; // Default 15 minuter

    const baseTime = learningProfile.learning_patterns.optimal_session_length;
    const cognitiveLoad = learningProfile.cognitive_load_tolerance;
    const attentionSpan = learningProfile.learning_patterns.attention_span_minutes;

    // Justera baserat på kognitiv belastning
    let adjustedTime = baseTime;
    if (cognitiveLoad === 'low') adjustedTime *= 0.7;
    if (cognitiveLoad === 'high') adjustedTime *= 1.3;

    // Begränsa baserat på uppmärksamhetsspann
    adjustedTime = Math.min(adjustedTime, attentionSpan);

    return Math.round(adjustedTime);
  }, [learningProfile]);

  // Föreslå bästa tid för lärande
  const suggestOptimalLearningTime = useCallback(() => {
    if (!learningProfile) return 'morning';

    const preferredTimes = learningProfile.learning_patterns.preferred_time_of_day;
    const currentHour = new Date().getHours();

    // Matcha aktuell tid med användarens preferenser
    if (preferredTimes.includes('morning') && currentHour >= 6 && currentHour < 12) {
      return 'Perfekt tid för lärande! Du lär dig bäst på morgonen.';
    }
    if (preferredTimes.includes('afternoon') && currentHour >= 12 && currentHour < 18) {
      return 'Bra tid för lärande! Eftermiddagen passar dig väl.';
    }
    if (preferredTimes.includes('evening') && currentHour >= 18) {
      return 'Bra tid för lärande! Du är produktiv på kvällen.';
    }

    // Föreslå bättre tid
    const nextOptimalTime = preferredTimes[0];
    return `Du lär dig bäst på ${nextOptimalTime}. Kanske spara den här aktiviteten till då?`;
  }, [learningProfile]);

  // Anpassa motivations-strategier
  const getPersonalizedMotivation = useCallback((context: string) => {
    if (!learningProfile) {
      return 'Du gör ett fantastiskt jobb! Fortsätt så här!';
    }

    const triggers = learningProfile.learning_patterns.motivation_triggers;
    const neuroplasticity = learningProfile.neuroplasticity_indicators;

    // Anpassa meddelande baserat på motivations-triggers
    if (triggers.includes('progress_tracking')) {
      return `Du har gjort ${Math.round(neuroplasticity.growth_mindset_score * 100)}% framsteg! Din hjärna bygger nya kopplingar varje gång du övar.`;
    }
    if (triggers.includes('social_recognition')) {
      return 'Din dedication är inspirerande! Du visar verkligen vad neuroplasticitet kan åstadkomma.';
    }
    if (triggers.includes('challenge_completion')) {
      return 'Wow! Du genomförde en svår utmaning. Det stärker din resiliens och adaptabilitet!';
    }
    if (triggers.includes('skill_mastery')) {
      return 'Du behärskar denna färdighet allt bättre! Din hjärna har anpassat sig perfekt.';
    }

    return 'Du utvecklas fantastiskt! Varje steg framåt stärker din neuroplasticitet.';
  }, [learningProfile]);

  // Neuroplasticitet-baserad feedback
  const generateNeuroplasticityFeedback = useCallback((activity: string, performance: number) => {
    const feedback = {
      encouraging: [
        'Fantastiskt! Din hjärna skapar nya neurala pathways just nu.',
        'Varje repetition stärker dina hjärnkopplingar!',
        'Du tränar din hjärna som en muskel - och den växer!'
      ],
      educational: [
        'När du övar skapas myelin runt nervtrådarna, vilket gör dig snabbare.',
        'Din prefrontala cortex blir starkare för varje problem du löser.',
        'Neuroplasticitet innebär att din hjärna kan förändras livet ut!'
      ],
      challenging: [
        'Utmaningar skapar starkast neuroplasticitet. Våga ta nästa steg!',
        'När något känns svårt växer din hjärna som mest.',
        'Misstag är hjärnans sätt att lära sig - omfamna dem!'
      ]
    };

    let category = 'encouraging';
    if (performance > 0.8) category = 'educational';
    if (performance < 0.6) category = 'challenging';

    const messages = feedback[category];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  // Auto-detektering när användaren är aktiv
  useEffect(() => {
    if (user && !learningProfile) {
      detectLearningStyle();
    }
  }, [user, detectLearningStyle]);

  return {
    learningProfile,
    loading,
    detectLearningStyle,
    adaptContentForLearningStyle,
    calculateOptimalSessionLength,
    suggestOptimalLearningTime,
    getPersonalizedMotivation,
    generateNeuroplasticityFeedback
  };
};