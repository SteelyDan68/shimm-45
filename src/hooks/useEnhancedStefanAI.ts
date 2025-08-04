/**
 * 🤖 ENHANCED STEFAN AI HOOK
 * Integrerar assessment-data, hybrid AI-strategier och kontextuell promptbyggnad
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { buildLovableAIPrompt, StefanPromptContext } from '@/utils/stefanAIPromptBuilder';

export interface EnhancedStefanResponse {
  message: string;
  contextUsed: StefanPromptContext;
  aiModel: 'openai' | 'gemini';
  responseTime: number;
  assessmentInsights: string[];
  recommendedActions: string[];
  confidence: number;
  fallbackUsed: boolean;
}

export interface StefanChatOptions {
  message: string;
  interactionType?: 'chat' | 'assessment_completion' | 'coaching_session' | 'progress_review';
  forceModel?: 'openai' | 'gemini' | 'auto';
  includeAssessmentContext?: boolean;
  generateRecommendations?: boolean;
}

/**
 * Enhanced Stefan AI Hook med assessment-integration och hybrid AI-strategi
 */
export const useEnhancedStefanAI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<EnhancedStefanResponse | null>(null);

  /**
   * 🎯 HUVUDFUNKTION: Kontextuell Stefan AI Chat
   * Integrerar assessment-data och använder hybrid AI-strategi
   */
  const enhancedStefanChat = useCallback(async (
    options: StefanChatOptions
  ): Promise<EnhancedStefanResponse | null> => {
    if (!user?.id) {
      toast({
        title: "Autentisering krävs",
        description: "Du måste vara inloggad för att chatta med Stefan AI",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      console.log('🚀 Starting enhanced Stefan AI conversation');
      
      // 1. Bygg kontextuell prompt med assessment-data
      const promptContext = await buildLovableAIPrompt(
        user.id,
        options.message,
        options.interactionType || 'chat'
      );

      console.log('✅ Built contextual prompt with assessment data');

      // 2. Välj AI-modell baserat på kontext och tillgänglighet
      const selectedModel = await selectOptimalAIModel(
        options.forceModel,
        options.message,
        promptContext
      );

      console.log(`🤖 Selected AI model: ${selectedModel}`);

      // 3. Kör AI-förfrågan med fallback-strategi
      const aiResponse = await executeAIRequestWithFallback(
        selectedModel,
        promptContext,
        options
      );

      // 4. Analysera och förbättra responsen
      const enhancedResponse = await enhanceAIResponse(
        aiResponse,
        promptContext,
        options
      );

      const responseTime = Date.now() - startTime;

      const finalResponse: EnhancedStefanResponse = {
        message: enhancedResponse.message,
        contextUsed: promptContext,
        aiModel: aiResponse.modelUsed,
        responseTime,
        assessmentInsights: enhancedResponse.insights,
        recommendedActions: enhancedResponse.actions,
        confidence: enhancedResponse.confidence,
        fallbackUsed: aiResponse.fallbackUsed
      };

      // 5. Logga interaktionen för framtida förbättringar
      await logStefanInteraction(finalResponse, options);

      setLastResponse(finalResponse);
      
      console.log(`✅ Enhanced Stefan AI response completed in ${responseTime}ms`);
      
      return finalResponse;

    } catch (error) {
      console.error('❌ Enhanced Stefan AI error:', error);
      
      toast({
        title: "Stefan AI-fel",
        description: "Stefan har tekniska problem just nu. Försök igen om en stund.",
        variant: "destructive"
      });

      // Fallback till standard Stefan om enhanced misslyckas
      return await fallbackToStandardStefan(options);
      
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  /**
   * 🎯 ASSESSMENT-BASERAD FEEDBACK
   * Analyserar assessment-resultat och ger kontextuella råd
   */
  const generateAssessmentFeedback = useCallback(async (
    assessmentId: string,
    assessmentType: string
  ): Promise<EnhancedStefanResponse | null> => {
    if (!user?.id) return null;

    try {
      // Hämta assessment-data
      const { data: assessment } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Skapa kontextuell feedback-prompt
      const feedbackMessage = `Jag har just slutfört en ${assessmentType}-assessment. 
Resultat: ${JSON.stringify(assessment.scores, null, 2)}
Kommentarer: ${assessment.comments || 'Inga kommentarer'}

Ge mig personlig feedback och nästa steg baserat på mina resultat och min utvecklingshistorik.`;

      return await enhancedStefanChat({
        message: feedbackMessage,
        interactionType: 'assessment_completion',
        includeAssessmentContext: true,
        generateRecommendations: true
      });

    } catch (error) {
      console.error('Error generating assessment feedback:', error);
      return null;
    }
  }, [user, enhancedStefanChat]);

  /**
   * 🎯 PROGRESS REVIEW
   * Skapar periodiska utvecklingsöversikter
   */
  const generateProgressReview = useCallback(async (
    timeframe: 'weekly' | 'monthly' | 'quarterly' = 'weekly'
  ): Promise<EnhancedStefanResponse | null> => {
    if (!user?.id) return null;

    const reviewMessage = `Skapa en ${timeframe} utvecklingsöversikt baserat på min senaste aktivitet, assessments och framsteg. 
Fokusera på mönster, framsteg och områden som behöver uppmärksamhet.`;

    return await enhancedStefanChat({
      message: reviewMessage,
      interactionType: 'progress_review',
      includeAssessmentContext: true,
      generateRecommendations: true
    });
  }, [user, enhancedStefanChat]);

  return {
    // Core functions
    enhancedStefanChat,
    generateAssessmentFeedback,
    generateProgressReview,
    
    // State
    loading,
    lastResponse,
    
    // Utility functions
    getLastResponseInsights: () => lastResponse?.assessmentInsights || [],
    getLastResponseActions: () => lastResponse?.recommendedActions || [],
    getResponseConfidence: () => lastResponse?.confidence || 0
  };
};

/**
 * 🤖 AI MODEL SELECTION
 * Väljer optimal AI-modell baserat på kontext och tillgänglighet
 */
async function selectOptimalAIModel(
  forceModel?: 'openai' | 'gemini' | 'auto',
  message?: string,
  promptContext?: StefanPromptContext
): Promise<'openai' | 'gemini'> {
  
  if (forceModel && forceModel !== 'auto') {
    return forceModel;
  }

  try {
    // Kontrollera AI-tillgänglighet
    const { data } = await supabase.functions.invoke('check-ai-availability');
    
    if (data?.openai && data?.gemini) {
      // Båda tillgängliga - välj baserat på kontext
      if (message && message.length > 2000) {
        return 'gemini'; // Bättre för långa texter
      }
      
      if (promptContext?.assessmentInsights && promptContext.assessmentInsights.length > 1000) {
        return 'openai'; // Bättre för komplexa analyser
      }
      
      return 'openai'; // Default till OpenAI för kvalitet
    }
    
    if (data?.openai) return 'openai';
    if (data?.gemini) return 'gemini';
    
  } catch (error) {
    console.warn('AI availability check failed, defaulting to OpenAI:', error);
  }
  
  return 'openai'; // Fallback
}

/**
 * 🔄 AI REQUEST WITH FALLBACK
 * Kör AI-förfrågan med fallback mellan modeller
 */
async function executeAIRequestWithFallback(
  primaryModel: 'openai' | 'gemini',
  promptContext: StefanPromptContext,
  options: StefanChatOptions
) {
  const fallbackModel = primaryModel === 'openai' ? 'gemini' : 'openai';
  
  try {
    // Försök med primär modell
    const response = await callAIModel(primaryModel, promptContext, options);
    return {
      ...response,
      modelUsed: primaryModel,
      fallbackUsed: false
    };
    
  } catch (primaryError) {
    console.warn(`Primary AI model (${primaryModel}) failed, trying fallback:`, primaryError);
    
    try {
      // Fallback till sekundär modell
      const response = await callAIModel(fallbackModel, promptContext, options);
      return {
        ...response,
        modelUsed: fallbackModel,
        fallbackUsed: true
      };
      
    } catch (fallbackError) {
      console.error('Both AI models failed:', { primaryError, fallbackError });
      throw new Error('Alla AI-modeller otillgängliga');
    }
  }
}

/**
 * 🎯 AI MODEL CALLER
 * Anropar specifik AI-modell
 */
async function callAIModel(
  model: 'openai' | 'gemini',
  promptContext: StefanPromptContext,
  options: StefanChatOptions
) {
  const functionName = model === 'openai' ? 'stefan-ai-chat' : 'stefan-gemini-chat';
  
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      message: options.message,
      promptContext: promptContext,
      interactionType: options.interactionType,
      includeAssessmentContext: options.includeAssessmentContext,
      generateRecommendations: options.generateRecommendations
    }
  });

  if (error) throw error;
  return data;
}

/**
 * 🚀 ENHANCE AI RESPONSE
 * Förbättrar AI-svaret med analys och rekommendationer
 */
async function enhanceAIResponse(
  aiResponse: any,
  promptContext: StefanPromptContext,
  options: StefanChatOptions
) {
  const insights: string[] = [];
  const actions: string[] = [];
  
  // Extrahera insikter från assessment-kontext
  if (promptContext.assessmentInsights) {
    insights.push('Baserat på din assessment-historik');
    insights.push('Kopplar till dina tidigare utvecklingsområden');
  }
  
  // Generera rekommendationer om begärt
  if (options.generateRecommendations) {
    actions.push('Fortsätt med daglig reflektion');
    actions.push('Boka in tid för utvecklingsaktiviteter');
    actions.push('Följ upp med ny assessment inom 2 veckor');
  }
  
  // Beräkna confidence baserat på kontext
  const confidence = calculateResponseConfidence(promptContext, aiResponse);
  
  return {
    message: aiResponse.message || aiResponse.response,
    insights,
    actions,
    confidence
  };
}

/**
 * 📊 CONFIDENCE CALCULATOR
 * Beräknar tillförlitlighet för AI-svar
 */
function calculateResponseConfidence(
  promptContext: StefanPromptContext,
  aiResponse: any
): number {
  let confidence = 0.5; // Base confidence
  
  // Öka confidence med assessment-data
  if (promptContext.assessmentInsights) confidence += 0.2;
  if (promptContext.clientContext) confidence += 0.15;
  if (promptContext.contextualMemories) confidence += 0.1;
  
  // Justera baserat på svarslängd och struktur
  if (aiResponse.message && aiResponse.message.length > 200) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}

/**
 * 📝 LOG INTERACTION
 * Loggar Stefan-interaktion för analytics och förbättring
 */
async function logStefanInteraction(
  response: EnhancedStefanResponse,
  options: StefanChatOptions
) {
  try {
    await supabase.functions.invoke('log-stefan-interaction', {
      body: {
        response,
        options,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn('Failed to log Stefan interaction:', error);
  }
}

/**
 * 🆘 FALLBACK TO STANDARD STEFAN
 * Fallback till standard Stefan vid totalt fel
 */
async function fallbackToStandardStefan(
  options: StefanChatOptions
): Promise<EnhancedStefanResponse | null> {
  try {
    const { data } = await supabase.functions.invoke('stefan-ai-chat', {
      body: {
        message: options.message,
        interaction_type: options.interactionType || 'chat'
      }
    });

    return {
      message: data?.message || "Stefan är tillfälligt otillgänglig.",
      contextUsed: {} as StefanPromptContext,
      aiModel: 'openai',
      responseTime: 0,
      assessmentInsights: [],
      recommendedActions: [],
      confidence: 0.3,
      fallbackUsed: true
    };
    
  } catch (error) {
    console.error('Even fallback Stefan failed:', error);
    return null;
  }
}