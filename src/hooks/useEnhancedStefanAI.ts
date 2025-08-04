import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/components/Analytics/AnalyticsProvider';
import { useUnifiedAI } from './useUnifiedAI';

// Legacy interfaces for backward compatibility
export interface EnhancedStefanResponse {
  message: string;
  contextUsed: string[];
  aiModel: string;
  responseTime: number;
  assessmentInsights?: any[];
  recommendedActions?: any[];
  confidence: number;
  fallbackUsed: boolean;
}

export interface StefanChatOptions {
  message: string;
  interactionType?: 'general' | 'assessment_feedback' | 'progress_review';
  preferredModel?: 'openai' | 'gemini' | 'auto';
  includeAssessmentContext?: boolean;
  generateRecommendations?: boolean;
}

/**
 * @deprecated Use useUnifiedAI instead - this hook will be removed in next version
 * Enhanced Stefan AI Hook med assessment-integration och hybrid AI-strategi
 */
export const useEnhancedStefanAI = () => {
  console.warn("🚨 DEPRECATED: useEnhancedStefanAI is deprecated. Use useUnifiedAI instead.");
  
  // Redirect to unified AI system
  const unifiedAI = useUnifiedAI();
  const [lastResponse, setLastResponse] = useState<EnhancedStefanResponse | null>(null);

  const enhancedStefanChat = useCallback(async (options: StefanChatOptions): Promise<EnhancedStefanResponse | null> => {
    try {
      // Call unified AI with legacy compatibility
      const response = await unifiedAI.stefanChat({
        message: options.message,
        conversationHistory: []
      });

      if (response) {
        const legacyResponse: EnhancedStefanResponse = {
          message: response.message,
          contextUsed: [],
          aiModel: response.ai_model,
          responseTime: 0,
          assessmentInsights: [],
          recommendedActions: [],
          confidence: 0.8,
          fallbackUsed: false
        };
        
        setLastResponse(legacyResponse);
        return legacyResponse;
      }
      return null;
    } catch (error) {
      console.error('Enhanced Stefan chat error:', error);
      return null;
    }
  }, [unifiedAI]);

  const generateAssessmentFeedback = useCallback(async (assessmentId: string, assessmentType: string): Promise<EnhancedStefanResponse | null> => {
    console.warn("🚨 DEPRECATED: generateAssessmentFeedback is deprecated. Use useUnifiedAI.assessmentAnalysis instead.");
    return null;
  }, []);

  const generateProgressReview = useCallback(async (timeframe?: 'weekly' | 'monthly' | 'quarterly'): Promise<EnhancedStefanResponse | null> => {
    console.warn("🚨 DEPRECATED: generateProgressReview is deprecated. Use useUnifiedAI.coachingAnalysis instead.");
    return null;
  }, []);

  return {
    // Legacy compatibility - redirect to unified AI
    enhancedStefanChat,
    generateAssessmentFeedback,
    generateProgressReview,
    
    // State
    loading: unifiedAI.loading,
    lastResponse,
    
    // Utility functions
    getLastResponseInsights: () => lastResponse?.assessmentInsights || [],
    getLastResponseActions: () => lastResponse?.recommendedActions || [],
    getResponseConfidence: () => lastResponse?.confidence || 0.5
  };
};

export default useEnhancedStefanAI;