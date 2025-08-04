import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useContextEngine } from '@/hooks/useContextEngine';

/**
 * 🔮 PREDICTIVE JOURNEY ENGINE
 * Predikterar användarens nästa steg och förbereder proaktiva interventioner
 */

interface PredictedAction {
  action_type: string;
  probability: number;
  suggested_timing: string;
  context: any;
  reasoning: string;
}

interface JourneyPrediction {
  user_id: string;
  predicted_next_actions: PredictedAction[];
  risk_factors: string[];
  success_indicators: string[];
  recommended_interventions: string[];
  confidence_score: number;
  predicted_at: string;
}

export const usePredictiveJourney = () => {
  const { user } = useAuth();
  const { journeyState } = useUserJourney();
  const { insights, behaviorPatterns } = useContextEngine();
  const [currentPrediction, setCurrentPrediction] = useState<JourneyPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  // Generera AI-baserad prediktion av användarens nästa steg
  const generateJourneyPrediction = useCallback(async () => {
    if (!user || !journeyState) return null;

    setLoading(true);
    try {
      console.log('🔮 Generating journey prediction for user:', user.id);

      // Samla kontext för AI-analys
      const contextData = {
        user_id: user.id,
        current_phase: journeyState.current_phase,
        completed_assessments: journeyState.completed_assessments,
        journey_progress: journeyState.journey_progress,
        recent_insights: insights.slice(-5),
        behavior_patterns: behaviorPatterns,
        last_activity: journeyState.last_activity_at,
        metadata: journeyState.metadata
      };

      // Anropa AI för prediktion
      const { data: prediction, error } = await supabase.functions.invoke('generate-journey-prediction', {
        body: contextData
      });

      if (error) {
        console.error('Error generating journey prediction:', error);
        return null;
      }

      // Spara prediktion i databasen
      const { data: savedPrediction, error: saveError } = await supabase
        .from('user_behavior_patterns')
        .upsert({
          user_id: user.id,
          pattern_type: 'journey_prediction',
          pattern_data: prediction,
          confidence_score: prediction.confidence_score,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,pattern_type'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving prediction:', saveError);
      }

      setCurrentPrediction(prediction);
      console.log('✅ Journey prediction generated successfully');
      return prediction;

    } catch (error) {
      console.error('Error in journey prediction:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, journeyState, insights, behaviorPatterns]);

  // Analysera risk för att användaren ska överge sin resa
  const analyzeAbandonmentRisk = useCallback(() => {
    if (!journeyState || !behaviorPatterns.length) return 'low';

    const riskFactors = [];

    // Inaktivitet
    const lastActivity = new Date(journeyState.last_activity_at);
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 3) riskFactors.push('long_inactivity');

    // Låg progress
    if (journeyState.journey_progress < 20) riskFactors.push('low_progress');

    // Många abandoned tasks från behavior patterns
    const abandonedTasksPattern = behaviorPatterns.find(p => p.pattern_type === 'task_abandonment');
    if (abandonedTasksPattern && abandonedTasksPattern.confidence_score > 0.7) {
      riskFactors.push('task_abandonment_pattern');
    }

    // Beräkna risk
    if (riskFactors.length >= 3) return 'high';
    if (riskFactors.length >= 2) return 'medium';
    return 'low';
  }, [journeyState, behaviorPatterns]);

  // Föreslå nästa bästa steg för användaren
  const suggestNextBestAction = useCallback(() => {
    if (!currentPrediction) return null;

    const nextActions = currentPrediction.predicted_next_actions
      .sort((a, b) => b.probability - a.probability);

    const highProbabilityActions = nextActions.filter(action => action.probability > 0.6);
    
    if (highProbabilityActions.length === 0) return null;

    return {
      primary_action: highProbabilityActions[0],
      alternative_actions: highProbabilityActions.slice(1, 3),
      confidence: highProbabilityActions[0].probability
    };
  }, [currentPrediction]);

  // Förutse när användaren troligen kommer vara aktiv nästa gång
  const predictNextActiveSession = useCallback(() => {
    if (!behaviorPatterns.length) return null;

    const activityPattern = behaviorPatterns.find(p => p.pattern_type === 'activity_timing');
    if (!activityPattern) return null;

    const patternData = activityPattern.pattern_data;
    
    // Enkle prediktion baserat på historiska mönster
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Hitta mest troliga tid baserat på mönster
    const likelyTimes = patternData.peak_hours || [9, 14, 20]; // Default times
    const nextLikelyTime = likelyTimes.find(hour => hour > currentHour) || likelyTimes[0];

    const nextSession = new Date();
    if (nextLikelyTime <= currentHour) {
      nextSession.setDate(nextSession.getDate() + 1);
    }
    nextSession.setHours(nextLikelyTime, 0, 0, 0);

    return {
      predicted_time: nextSession.toISOString(),
      confidence: activityPattern.confidence_score,
      reasoning: `Baserat på ditt aktivitetsmönster är du mest aktiv omkring ${nextLikelyTime}:00`
    };
  }, [behaviorPatterns]);

  // Detektera när användaren behöver extra stöd
  const detectSupportNeeds = useCallback(() => {
    if (!currentPrediction) return [];

    const supportNeeds = [];

    // Kontrollera risk faktorer
    if (currentPrediction.risk_factors.includes('low_engagement')) {
      supportNeeds.push({
        type: 'engagement_support',
        priority: 'high',
        suggestion: 'Användaren behöver motivationsstöd och engagerande aktiviteter'
      });
    }

    if (currentPrediction.risk_factors.includes('skill_gap')) {
      supportNeeds.push({
        type: 'learning_support',
        priority: 'medium',
        suggestion: 'Användaren behöver extra vägledning och tutorial-stöd'
      });
    }

    if (currentPrediction.risk_factors.includes('time_constraints')) {
      supportNeeds.push({
        type: 'time_management',
        priority: 'medium',
        suggestion: 'Föreslå kortare, mer fokuserade aktiviteter'
      });
    }

    return supportNeeds;
  }, [currentPrediction]);

  // Auto-uppdatering av prediktioner
  useEffect(() => {
    if (user && journeyState) {
      generateJourneyPrediction();
    }
  }, [user, journeyState?.journey_progress]); // Uppdatera när progress ändras

  // Periodisk uppdatering
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && journeyState) {
        generateJourneyPrediction();
      }
    }, 60 * 60 * 1000); // Varje timme

    return () => clearInterval(interval);
  }, [generateJourneyPrediction]);

  return {
    currentPrediction,
    loading,
    generateJourneyPrediction,
    analyzeAbandonmentRisk,
    suggestNextBestAction,
    predictNextActiveSession,
    detectSupportNeeds
  };
};