import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Unified AI request types
export type AIAction = 
  | 'stefan_chat' 
  | 'coaching_analysis' 
  | 'assessment_analysis' 
  | 'message_assistant' 
  | 'planning_generation' 
  | 'habit_analysis';

export interface AIRequest {
  action: AIAction;
  data: any;
  priority?: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  aiModel: string;
  processingTime: number;
  tokens?: number;
}

// Stefan Chat specific interfaces
export interface StefanChatData {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface StefanChatResponse {
  message: string;
  ai_model: string;
  timestamp: string;
}

// Coaching Analysis interfaces
export interface CoachingAnalysisData {
  sessionType: 'assessment' | 'check_in' | 'goal_setting' | 'progress_review';
  userContext: any;
  assessmentData?: any;
}

export interface CoachingRecommendation {
  title: string;
  description: string;
  actionSteps: string[];
  timeframe: string;
  difficulty: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface CoachingAnalysisResponse {
  analysis: {
    analysis: string;
    recommendations: CoachingRecommendation[];
    nextSteps: string;
  };
  ai_model: string;
  timestamp: string;
}

// Assessment Analysis interfaces
export interface AssessmentAnalysisData {
  assessmentType: string;
  scores: any;
  responses: any;
  pillarKey?: string;
}

export interface AssessmentAnalysisResponse {
  analysis: string;
  scores: any;
  pillar_key?: string;
  ai_model: string;
  timestamp: string;
}

// Message Assistant interfaces
export interface MessageAssistantData {
  messageContent: string;
  senderName: string;
  context?: string;
}

export interface MessageAssistantResponse {
  suggestion: string;
  ai_model: string;
  timestamp: string;
}

// Planning Generation interfaces
export interface PlanningGenerationData {
  goals: any;
  preferences: any;
  constraints: any;
  timeframe?: string;
}

export interface WeeklyStructure {
  week: number;
  focus: string;
  activities: string[];
  milestones: string[];
}

export interface PlanningGenerationResponse {
  plan: {
    planTitle: string;
    overview: string;
    duration: string;
    weeklyStructure: WeeklyStructure[];
    dailyHabits: string[];
    recoveryStrategies: string[];
  };
  ai_model: string;
  timestamp: string;
}

// Habit Analysis interfaces
export interface HabitAnalysisData {
  habitData: any;
  patterns: any;
  challenges: any;
}

export interface HabitAnalysisResponse {
  analysis: string;
  patterns: any;
  ai_model: string;
  timestamp: string;
}

export const useUnifiedAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const executeAIRequest = useCallback(async (request: AIRequest): Promise<AIResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🤖 Unified AI: Processing ${request.action}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('unified-ai-orchestrator', {
        body: {
          action: request.action,
          data: request.data,
          context: {
            userId: user?.id,
            language: 'sv',
            priority: request.priority || 'medium'
          }
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'AI-tjänst misslyckades');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI-analys misslyckades');
      }

      console.log(`✅ Unified AI: ${request.action} completed in ${data.processingTime}ms using ${data.aiModel}`);
      
      return data as AIResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel uppstod';
      setError(errorMessage);
      
      console.error(`❌ Unified AI Error (${request.action}):`, err);
      
      toast({
        title: "AI-tjänst fel",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
        aiModel: 'none',
        processingTime: 0
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // ============= STEFAN CHAT =============
  const stefanChat = useCallback(async (data: StefanChatData): Promise<StefanChatResponse | null> => {
    const response = await executeAIRequest({
      action: 'stefan_chat',
      data,
      priority: 'high'
    });

    return response.success ? response.data : null;
  }, [executeAIRequest]);

  // ============= COACHING ANALYSIS =============
  const coachingAnalysis = useCallback(async (data: CoachingAnalysisData): Promise<CoachingAnalysisResponse | null> => {
    const response = await executeAIRequest({
      action: 'coaching_analysis',
      data,
      priority: 'high'
    });

    return response.success ? response.data : null;
  }, [executeAIRequest]);

  // ============= ASSESSMENT ANALYSIS =============
  const assessmentAnalysis = useCallback(async (data: AssessmentAnalysisData): Promise<AssessmentAnalysisResponse | null> => {
    const response = await executeAIRequest({
      action: 'assessment_analysis',
      data,
      priority: 'medium'
    });

    return response.success ? response.data : null;
  }, [executeAIRequest]);

  // ============= MESSAGE ASSISTANT =============
  const messageAssistant = useCallback(async (data: MessageAssistantData): Promise<MessageAssistantResponse | null> => {
    const response = await executeAIRequest({
      action: 'message_assistant',
      data,
      priority: 'medium'
    });

    return response.success ? response.data : null;
  }, [executeAIRequest]);

  // ============= PLANNING GENERATION =============
  const planningGeneration = useCallback(async (data: PlanningGenerationData): Promise<PlanningGenerationResponse | null> => {
    const response = await executeAIRequest({
      action: 'planning_generation',
      data,
      priority: 'high'
    });

    return response.success ? response.data : null;
  }, [executeAIRequest]);

  // ============= HABIT ANALYSIS =============
  const habitAnalysis = useCallback(async (data: HabitAnalysisData): Promise<HabitAnalysisResponse | null> => {
    const response = await executeAIRequest({
      action: 'habit_analysis',
      data,
      priority: 'medium'
    });

    return response.success ? response.data : null;
  }, [executeAIRequest]);

  // ============= BATCH PROCESSING =============
  const batchProcess = useCallback(async (requests: AIRequest[]): Promise<AIResponse[]> => {
    console.log(`🚀 Unified AI: Processing ${requests.length} batch requests`);
    
    // Process requests in parallel for efficiency
    const promises = requests.map(request => executeAIRequest(request));
    const results = await Promise.allSettled(promises);

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            success: false,
            error: 'Batch processing misslyckades',
            aiModel: 'none',
            processingTime: 0
          }
    );
  }, [executeAIRequest]);

  // ============= AI HEALTH CHECK =============
  const healthCheck = useCallback(async (): Promise<{
    openai: boolean;
    gemini: boolean;
    primary: string;
    status: 'healthy' | 'degraded' | 'down';
  }> => {
    try {
      const response = await executeAIRequest({
        action: 'stefan_chat',
        data: { message: 'Hälsokontroll' },
        priority: 'low'
      });

      return {
        openai: response.aiModel === 'openai',
        gemini: response.aiModel === 'gemini',
        primary: response.aiModel,
        status: response.success ? 'healthy' : 'degraded'
      };
    } catch {
      return {
        openai: false,
        gemini: false,
        primary: 'none',
        status: 'down'
      };
    }
  }, [executeAIRequest]);

  return {
    // State
    loading,
    error,
    
    // Core methods
    executeAIRequest,
    batchProcess,
    healthCheck,
    
    // Specialized methods
    stefanChat,
    coachingAnalysis,
    assessmentAnalysis,
    messageAssistant,
    planningGeneration,
    habitAnalysis
  };
};

export default useUnifiedAI;