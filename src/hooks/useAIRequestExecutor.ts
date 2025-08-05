import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAIServiceCircuitBreaker } from '@/hooks/useCircuitBreaker';
import { useAnalytics } from '@/components/Analytics/AnalyticsProvider';

// Separated AI Service Types
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

/**
 * 🤖 CORE AI REQUEST EXECUTOR
 * - Handles all AI service communication
 * - Circuit breaker protection
 * - Analytics tracking
 * - Error handling and recovery
 */
export const useAIRequestExecutor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const circuitBreaker = useAIServiceCircuitBreaker();
  const analytics = useAnalytics();

  const executeAIRequest = useCallback(async (request: AIRequest): Promise<AIResponse> => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      
      
      const result = await circuitBreaker.unifiedAI.executeWithCircuitBreaker(async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://gcoorbcglxczmukzcmqs.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb29yYmNnbHhjem11a3pjbXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTE3NzYsImV4cCI6MjA2OTM4Nzc3Nn0.5gNGvMZ6aG3UXoYR6XbJPqn8L8ktMYaFbZIQ4mZTFf4'
        );

        const { data, error: functionError } = await supabase.functions.invoke('unified-ai-orchestrator', {
          body: {
            action: request.action,
            data: request.data,
            context: {
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

        return data as AIResponse;
      });

      const processingTime = Date.now() - startTime;
      
      
      analytics.trackAIInteraction({
        function_name: request.action,
        response_time_ms: processingTime,
        success: true,
        model_used: result.aiModel,
        input_size: JSON.stringify(request.data).length,
        output_size: JSON.stringify(result.data).length,
        tokens_used: result.tokens
      });
      
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel uppstod';
      setError(errorMessage);
      
      console.error(`❌ AI Executor Error (${request.action}):`, err);
      
      analytics.trackAIInteraction({
        function_name: request.action,
        response_time_ms: Date.now() - startTime,
        success: false,
        error_message: errorMessage,
        model_used: 'unknown',
        input_size: JSON.stringify(request.data).length,
        output_size: 0
      });
      
      if (errorMessage.includes('temporärt otillgänglig')) {
        toast({
          title: "AI-tjänst temporärt otillgänglig",
          description: "Systemet försöker återansluta automatiskt. Försök igen om en stund.",
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "AI-tjänst fel",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return {
        success: false,
        error: errorMessage,
        aiModel: 'none',
        processingTime: 0
      };
    } finally {
      setLoading(false);
    }
  }, [toast, circuitBreaker.unifiedAI, analytics]);

  const batchProcess = useCallback(async (requests: AIRequest[]): Promise<AIResponse[]> => {
    
    
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

  const healthCheck = useCallback(async () => {
    try {
      const overallStatus = circuitBreaker.getOverallStatus();
      
      return {
        openai: overallStatus.services.openai.isHealthy,
        gemini: overallStatus.services.gemini.isHealthy,
        primary: overallStatus.services.unifiedAI.isHealthy ? 
          (overallStatus.services.openai.isHealthy ? 'openai' : 'gemini') : 'none',
        status: overallStatus.overall as 'healthy' | 'degraded' | 'down'
      };
    } catch {
      return {
        openai: false,
        gemini: false,
        primary: 'none',
        status: 'down' as const
      };
    }
  }, [circuitBreaker]);

  return {
    loading,
    error,
    executeAIRequest,
    batchProcess,
    healthCheck,
    circuitBreakerStatus: circuitBreaker.getOverallStatus()
  };
};