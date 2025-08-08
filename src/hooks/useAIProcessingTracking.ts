import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export interface AIProcessingSession {
  id: string;
  user_id: string;
  process_type: 'assessment_analysis' | 'actionable_generation' | 'calendar_optimization';
  pillar_type?: string;
  status: 'started' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  current_step?: string;
  estimated_completion_time?: string;
  processing_metadata: Record<string, any>;
  error_details?: string;
  started_at: string;
  completed_at?: string;
}

export interface PipelineProgress {
  id: string;
  user_id: string;
  pillar_type: string;
  current_step: 'assessment' | 'ai_processing' | 'results_preview' | 'actionables_generation' | 'calendar_integration' | 'completed';
  step_progress_percentage: number;
  total_progress_percentage: number;
  step_data: Record<string, any>;
  completion_timestamps: Record<string, string>;
  started_at: string;
  last_activity_at: string;
  completed_at?: string;
}

export const useAIProcessingTracking = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<AIProcessingSession | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start new AI processing session
  const startProcessingSession = async (
    processType: AIProcessingSession['process_type'],
    pillarType?: string,
    inputData?: Record<string, any>
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('ai_processing_sessions')
        .insert({
          user_id: user.id,
          process_type: processType,
          pillar_type: pillarType,
          status: 'started',
          progress_percentage: 0,
          input_data: inputData || {},
          processing_metadata: {
            started_by: 'user',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      return data.id;
    } catch (error) {
      console.error('Failed to start processing session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update processing progress
  const updateProgress = async (
    sessionId: string,
    progress: number,
    currentStep?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const updateData: any = {
        progress_percentage: Math.min(Math.max(progress, 0), 100),
        status: progress >= 100 ? 'completed' : 'processing',
        updated_at: new Date().toISOString()
      };

      if (currentStep) updateData.current_step = currentStep;
      if (metadata) updateData.processing_metadata = metadata;
      if (progress >= 100) updateData.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('ai_processing_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // Complete processing session
  const completeSession = async (sessionId: string, results?: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('ai_processing_sessions')
        .update({
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          processing_metadata: {
            ...currentSession?.processing_metadata,
            results,
            completed_by: 'system'
          }
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  // Mark session as failed
  const failSession = async (sessionId: string, errorDetails: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_processing_sessions')
        .update({
          status: 'failed',
          error_details: errorDetails,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Failed to mark session as failed:', error);
    }
  };

  // Update pipeline progress
  const updatePipelineProgress = async (
    pillarType: string,
    step: PipelineProgress['current_step'],
    stepProgress: number,
    stepData?: Record<string, any>
  ) => {
    if (!user) return;

    const totalProgress = calculateTotalProgress(step, stepProgress);

    try {
      const { data, error } = await supabase
        .from('user_pipeline_progress')
        .upsert({
          user_id: user.id,
          pillar_type: pillarType,
          current_step: step,
          step_progress_percentage: stepProgress,
          total_progress_percentage: totalProgress,
          step_data: stepData || {},
          completion_timestamps: {
            ...pipelineProgress?.completion_timestamps,
            [step]: new Date().toISOString()
          },
          last_activity_at: new Date().toISOString(),
          ...(step === 'completed' && { completed_at: new Date().toISOString() })
        })
        .select()
        .single();

      if (error) throw error;
      setPipelineProgress(data);
    } catch (error) {
      console.error('Failed to update pipeline progress:', error);
    }
  };

  // Calculate total progress based on current step
  const calculateTotalProgress = (step: PipelineProgress['current_step'], stepProgress: number): number => {
    const stepWeights = {
      assessment: 20,
      ai_processing: 30,
      results_preview: 10,
      actionables_generation: 25,
      calendar_integration: 10,
      completed: 5
    };

    const stepOrder = Object.keys(stepWeights);
    const currentStepIndex = stepOrder.indexOf(step);
    
    let totalProgress = 0;
    
    // Add progress from completed steps
    for (let i = 0; i < currentStepIndex; i++) {
      totalProgress += stepWeights[stepOrder[i] as keyof typeof stepWeights];
    }
    
    // Add progress from current step
    totalProgress += (stepWeights[step] * stepProgress) / 100;
    
    return Math.min(Math.round(totalProgress), 100);
  };

  // Load current pipeline progress for a pillar
  const loadPipelineProgress = async (pillarType: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_pipeline_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('pillar_type', pillarType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPipelineProgress(data);
    } catch (error) {
      console.error('Failed to load pipeline progress:', error);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`ai-processing-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_processing_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCurrentSession(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_pipeline_progress',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setPipelineProgress(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    currentSession,
    pipelineProgress,
    isLoading,
    startProcessingSession,
    updateProgress,
    completeSession,
    failSession,
    updatePipelineProgress,
    loadPipelineProgress,
    calculateTotalProgress
  };
};