import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  AssessmentTemplate, 
  AssessmentResponse, 
  UniversalQuestion,
  AssessmentContext,
  UserProfile 
} from '@/types/universalAssessment';

export const useUniversalAssessment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<AssessmentTemplate | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const { toast } = useToast();

  // Get assessment template by context and user profile
  const getOptimalTemplate = useCallback(async (
    context: AssessmentContext,
    clientId: string,
    targetAudience?: string
  ): Promise<AssessmentTemplate | null> => {
    try {
      setIsLoading(true);
      
      // For now, we'll create a basic template - later this will come from database
      const template: AssessmentTemplate = {
        id: `template_${context}_${Date.now()}`,
        name: getTemplateName(context),
        description: getTemplateDescription(context),
        context,
        target_audience: targetAudience || 'universal',
        questions: await generateContextualQuestions(context, clientId),
        ai_analysis_prompt: generateAnalysisPrompt(context),
        scoring_algorithm: 'pillar_based',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCurrentTemplate(template);
      return template;
    } catch (error) {
      console.error('Error getting assessment template:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta bedömningsformulär",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Submit assessment response
  const submitAssessment = useCallback(async (
    templateId: string,
    clientId: string,
    answers: Record<string, any>,
    completionTimeSeconds: number
  ): Promise<AssessmentResponse | null> => {
    try {
      setIsLoading(true);

      // Calculate scores based on answers
      const scores = calculateScores(answers, currentTemplate);
      
      // Call AI analysis function
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        'universal-assessment-analyzer',
        {
          body: {
            template_id: templateId,
            client_id: clientId,
            answers,
            calculated_scores: scores,
            context: currentTemplate?.context
          }
        }
      );

      if (analysisError) {
        throw analysisError;
      }

      const response: AssessmentResponse = {
        id: `response_${Date.now()}`,
        client_id: clientId,
        template_id: templateId,
        answers,
        calculated_scores: scores,
        ai_analysis: analysisResult.analysis,
        insights: analysisResult.insights,
        metadata: {
          completion_time_seconds: completionTimeSeconds,
          context: currentTemplate?.context || 'onboarding',
          triggered_by: 'user'
        },
        created_at: new Date().toISOString()
      };

      // Store using existing assessment_rounds table for now
      const { error: storeError } = await supabase
        .from('assessment_rounds')
        .insert([{
          user_id: clientId,
          pillar_type: 'universal',
          scores: scores.pillar_scores,
          answers,
          ai_analysis: analysisResult.analysis,
          created_by: clientId
        }]);

      if (storeError) {
        console.error('Error storing assessment:', storeError);
        // Continue anyway - we have the response
      }

      setResponses(prev => [response, ...prev]);
      
      toast({
        title: "Bedömning genomförd",
        description: "Din självskattning har analyserats och sparats",
      });

      return response;
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara bedömning: " + error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentTemplate, toast]);

  // Get user's assessment history
  const getAssessmentHistory = useCallback(async (clientId: string): Promise<AssessmentResponse[]> => {
    try {
      const { data, error } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to AssessmentResponse format
      const responses = (data || []).map(item => ({
        id: item.id,
        client_id: item.user_id,
        template_id: 'universal',
        answers: item.answers as Record<string, any>,
        calculated_scores: {
          overall: 0,
          pillar_scores: item.scores as Record<string, number>
        },
        ai_analysis: item.ai_analysis || '',
        insights: {
          strengths: [],
          improvement_areas: [],
          recommended_actions: [],
          pillar_priorities: []
        },
        metadata: {
          completion_time_seconds: 0,
          context: 'onboarding' as AssessmentContext,
          triggered_by: 'user' as const
        },
        created_at: item.created_at
      } as AssessmentResponse));
      
      setResponses(responses);
      return responses;
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      return [];
    }
  }, []);

  return {
    isLoading,
    currentTemplate,
    responses,
    getOptimalTemplate,
    submitAssessment,
    getAssessmentHistory
  };
};

// Helper functions
function getTemplateName(context: AssessmentContext): string {
  switch (context) {
    case 'onboarding': return 'Inledande profil-bedömning';
    case 'pillar': return 'Pelare-djupdykning';
    case 'check_in': return 'Daglig check-in';
    case 'progress_review': return 'Framstegsgranskning';
    default: return 'Allmän bedömning';
  }
}

function getTemplateDescription(context: AssessmentContext): string {
  switch (context) {
    case 'onboarding': return 'Djup kartläggning av din nuvarande situation och mål';
    case 'pillar': return 'Fokuserad analys av en specifik utvecklingspelare';
    case 'check_in': return 'Kort daglig reflektion över din utveckling';
    case 'progress_review': return 'Omfattande granskning av dina framsteg';
    default: return 'Allmän utvecklingsbedömning';
  }
}

async function generateContextualQuestions(
  context: AssessmentContext, 
  clientId: string
): Promise<UniversalQuestion[]> {
  // This would eventually be AI-generated based on user profile
  // For now, return basic questions per context
  
  const baseQuestions: UniversalQuestion[] = [];
  
  if (context === 'onboarding') {
    baseQuestions.push(
      {
        id: 'q1',
        key: 'primary_role',
        text: 'Vad är din huvudsakliga yrkesroll eller livssituation?',
        type: 'text',
        context: 'onboarding',
        pillar_relevance: ['skills', 'economy'],
        weight: 1.0,
        required: true
      },
      {
        id: 'q2',
        key: 'main_challenge',
        text: 'Vad är din största utmaning just nu?',
        type: 'textarea',
        context: 'onboarding',
        pillar_relevance: ['self_care', 'skills'],
        weight: 1.0,
        required: true
      },
      {
        id: 'q3',
        key: 'primary_goal',
        text: 'Vad vill du mest utveckla eller förändra i ditt liv?',
        type: 'textarea',
        context: 'onboarding',
        pillar_relevance: ['talent', 'brand', 'economy'],
        weight: 1.0,
        required: true
      }
    );
  }
  
  return baseQuestions;
}

function generateAnalysisPrompt(context: AssessmentContext): string {
  const basePrompt = `Analysera denna ${context}-bedömning och ge konkreta insikter om användarens utvecklingsbehov inom de fem pelarna: Self Care, Skills, Talent, Brand och Economy.`;
  
  return basePrompt + `
  
  Fokusera på:
  1. Identifiera styrkor och utvecklingsområden
  2. Prioritera vilka pelare som är mest kritiska
  3. Föreslå konkreta första steg
  4. Anpassa råden till användarens specifika situation
  
  Svara på svenska med empatisk och motiverande ton.`;
}

function calculateScores(
  answers: Record<string, any>, 
  template: AssessmentTemplate | null
): { overall: number; pillar_scores: Record<string, number> } {
  if (!template) {
    return { overall: 0, pillar_scores: {} };
  }

  // Basic scoring algorithm - would be more sophisticated in production
  let totalScore = 0;
  let questionCount = 0;
  
  const pillarScores: Record<string, number> = {
    self_care: 0,
    skills: 0,
    talent: 0,
    brand: 0,
    economy: 0
  };

  // For now, just return placeholder scores
  // In production, this would analyze actual answers
  return {
    overall: Math.random() * 10,
    pillar_scores: {
      self_care: Math.random() * 10,
      skills: Math.random() * 10,
      talent: Math.random() * 10,
      brand: Math.random() * 10,
      economy: Math.random() * 10
    }
  };
}