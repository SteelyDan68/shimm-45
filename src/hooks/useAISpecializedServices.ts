import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAIRequestExecutor } from './useAIRequestExecutor';
import type { AIRequest, AIResponse } from './useAIRequestExecutor';

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

/**
 * 💬 STEFAN CHAT SERVICE
 * - Specialized hook for Stefan AI interactions
 * - Conversation history management
 * - User context integration
 */
export const useStefanChat = () => {
  const { user } = useAuth();
  const { executeAIRequest, loading, error } = useAIRequestExecutor();

  const stefanChat = useCallback(async (data: StefanChatData): Promise<StefanChatResponse | null> => {
    const request: AIRequest = {
      action: 'stefan_chat',
      data: {
        ...data,
        userId: user?.id
      },
      priority: 'high'
    };

    const response = await executeAIRequest(request);
    return response.success ? response.data : null;
  }, [executeAIRequest, user?.id]);

  return {
    stefanChat,
    loading,
    error
  };
};

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

/**
 * 🎯 COACHING ANALYSIS SERVICE
 * - Advanced coaching recommendations
 * - Session analysis and insights
 * - Progress tracking integration
 */
export const useCoachingAnalysis = () => {
  const { user } = useAuth();
  const { executeAIRequest, loading, error } = useAIRequestExecutor();

  const coachingAnalysis = useCallback(async (data: CoachingAnalysisData): Promise<CoachingAnalysisResponse | null> => {
    const request: AIRequest = {
      action: 'coaching_analysis',
      data: {
        ...data,
        userId: user?.id
      },
      priority: 'high'
    };

    const response = await executeAIRequest(request);
    return response.success ? response.data : null;
  }, [executeAIRequest, user?.id]);

  return {
    coachingAnalysis,
    loading,
    error
  };
};