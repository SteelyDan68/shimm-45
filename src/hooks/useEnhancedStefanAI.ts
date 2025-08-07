/**
 * 🎭 ENHANCED STEFAN AI HOOK
 * Wrapper för förbättrad Stefan AI med dynamisk modellval och kontextförståelse
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

interface StefanResponse {
  response: string;
  coaching_model: {
    id: string;
    name: string;
    approach: string;
    stefan_touch: string;
  };
  context: {
    empathy_level: string;
    personalization: string;
    adaptive_model: boolean;
  };
  meta: {
    ai_model: string;
    timestamp: string;
    session_type: string;
  };
}

interface CoachingContext {
  pillar_type?: string;
  challenges?: string[];
  preferences?: Record<string, any>;
  current_focus?: string;
}

export const useEnhancedStefanAI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);

  /**
   * 🎯 STEFAN COACHING - Huvudfunktion med dynamisk modellval
   */
  const stefanCoaching = async (
    message: string,
    context: CoachingContext = {},
    sessionType: string = 'general_coaching'
  ): Promise<StefanResponse | null> => {
    if (!user?.id) {
      toast({
        title: "Autentisering krävs",
        description: "Du måste vara inloggad för att chatta med Stefan.",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);

    try {
      console.log('🎭 Starting Stefan coaching session...');
      
      const { data, error } = await supabase.functions.invoke('stefan-enhanced-coaching', {
        body: {
          user_id: user.id,
          message: message.trim(),
          context: context,
          session_type: sessionType
        }
      });

      if (error) {
        throw new Error(error.message || 'Stefan AI-tjänsten misslyckades');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Oväntat fel från Stefan AI');
      }

      const stefanResponse: StefanResponse = {
        response: data.response,
        coaching_model: data.coaching_model,
        context: data.context,
        meta: data.meta
      };

      // Uppdatera nuvarande modell för UI-feedback
      setCurrentModel(data.coaching_model.name);

      console.log('✅ Stefan coaching completed:', data.coaching_model.name);

      return stefanResponse;

    } catch (error: any) {
      console.error('Stefan coaching error:', error);
      
      toast({
        title: "Stefan AI-fel",
        description: error.message || "Ett oväntat fel uppstod. Försök igen.",
        variant: "destructive"
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🧠 ASSESSMENT COACHING - Specialiserad coaching för assessment-kontext
   */
  const assessmentCoaching = async (
    message: string,
    pillarType: string,
    assessmentData?: Record<string, any>
  ) => {
    return stefanCoaching(message, {
      pillar_type: pillarType,
      preferences: assessmentData
    }, 'assessment_coaching');
  };

  /**
   * 🎯 GOAL SETTING COACHING - För mål och vision
   */
  const goalSettingCoaching = async (
    message: string,
    currentGoals?: string[]
  ) => {
    return stefanCoaching(message, {
      current_focus: 'goal_setting',
      challenges: currentGoals
    }, 'goal_setting');
  };

  /**
   * 💪 MOTIVATIONAL COACHING - För motivation och genomförande
   */
  const motivationalCoaching = async (
    message: string,
    currentChallenges?: string[]
  ) => {
    return stefanCoaching(message, {
      current_focus: 'motivation',
      challenges: currentChallenges
    }, 'motivational_coaching');
  };

  /**
   * 🔍 REFLECTION COACHING - För reflektion och självkännedom
   */
  const reflectionCoaching = async (
    message: string,
    reflectionArea?: string
  ) => {
    return stefanCoaching(message, {
      current_focus: reflectionArea || 'self_reflection'
    }, 'reflection_coaching');
  };

  /**
   * 🚧 PROBLEM SOLVING COACHING - För utmaningar och hinder
   */
  const problemSolvingCoaching = async (
    message: string,
    challenges: string[]
  ) => {
    return stefanCoaching(message, {
      current_focus: 'problem_solving',
      challenges: challenges
    }, 'problem_solving');
  };

  /**
   * 📊 PROGRESS COACHING - För framsteg och nästa steg
   */
  const progressCoaching = async (
    message: string,
    pillarType?: string,
    progressData?: Record<string, any>
  ) => {
    return stefanCoaching(message, {
      pillar_type: pillarType,
      current_focus: 'progress_review',
      preferences: progressData
    }, 'progress_coaching');
  };

  return {
    // Huvudfunktioner
    stefanCoaching,
    
    // Specialiserade coaching-typer
    assessmentCoaching,
    goalSettingCoaching,
    motivationalCoaching,
    reflectionCoaching,
    problemSolvingCoaching,
    progressCoaching,
    
    // Status
    loading,
    currentModel,
    
    // Utilities
    isAvailable: !!user?.id,
    
    // Reset state
    resetSession: () => {
      setCurrentModel(null);
    }
  };
};

export default useEnhancedStefanAI;