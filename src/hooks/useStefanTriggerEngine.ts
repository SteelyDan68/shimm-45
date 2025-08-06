import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStefanInterventions } from './useStefanInterventions';
import { useStefanProactiveCoaching } from './useStefanProactiveCoaching';

/**
 * 🎯 STEFAN TRIGGER ENGINE - SPRINT 2 COMPLETE
 * Automatisk trigger system för proaktiva Stefan-interventioner
 * Kopplar samman alla Stefan AI-komponenter för fullständig coaching-upplevelse
 */

export interface TriggerCondition {
  type: 'time_based' | 'activity_based' | 'assessment_based' | 'behavior_based';
  condition: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  cooldown_hours: number;
  enabled: boolean;
}

export interface TriggerEvent {
  id: string;
  user_id: string;
  trigger_type: string;
  condition_met: boolean;
  last_triggered?: string;
  next_eligible?: string;
  metadata: Record<string, any>;
}

export const useStefanTriggerEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createIntervention } = useStefanInterventions();
  const { analyzeCoachingNeeds, generateContextualIntervention } = useStefanProactiveCoaching();
  
  const [triggers, setTriggers] = useState<TriggerCondition[]>([
    {
      type: 'time_based',
      condition: { hours_since_last_activity: 24 },
      priority: 'medium',
      cooldown_hours: 6,
      enabled: true
    },
    {
      type: 'assessment_based', 
      condition: { score_decline_threshold: 0.5 },
      priority: 'high',
      cooldown_hours: 4,
      enabled: true
    },
    {
      type: 'behavior_based',
      condition: { pattern_change_detected: true },
      priority: 'medium',
      cooldown_hours: 8,
      enabled: true
    }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  // Check all triggers för en användare
  const checkAllTriggers = useCallback(async (): Promise<boolean> => {
    if (!user || isProcessing) return false;

    try {
      setIsProcessing(true);
      let triggeredAny = false;

      // Analysera coaching-behov först
      const coachingMetrics = await analyzeCoachingNeeds();
      if (!coachingMetrics) return false;

      // Kör genom alla aktiverade triggers
      for (const trigger of triggers.filter(t => t.enabled)) {
        const shouldTrigger = await evaluateTriggerCondition(trigger, coachingMetrics);
        
        if (shouldTrigger) {
          const success = await executeTrigger(trigger, coachingMetrics);
          if (success) {
            triggeredAny = true;
            // Log trigger execution
            await logTriggerExecution(trigger, true);
          }
        }
      }

      return triggeredAny;

    } catch (error) {
      console.error('Error checking triggers:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user, triggers, isProcessing, analyzeCoachingNeeds]);

  // Utvärdera om en trigger-condition är uppfylld
  const evaluateTriggerCondition = useCallback(async (
    trigger: TriggerCondition,
    metrics: any
  ): Promise<boolean> => {
    // Kontrollera cooldown först
    const lastTriggered = await getLastTriggerTime(trigger.type);
    if (lastTriggered) {
      const hoursSince = (Date.now() - new Date(lastTriggered).getTime()) / (1000 * 60 * 60);
      if (hoursSince < trigger.cooldown_hours) {
        return false;
      }
    }

    switch (trigger.type) {
      case 'time_based':
        const hoursSinceActivity = (Date.now() - new Date(metrics.lastInteraction).getTime()) / (1000 * 60 * 60);
        return hoursSinceActivity >= trigger.condition.hours_since_last_activity;

      case 'assessment_based':
        return metrics.assessmentTrends === 'declining';

      case 'behavior_based':
        return metrics.recentActivity === 0;

      case 'activity_based':
        return metrics.interventionNeeded;

      default:
        return false;
    }
  }, []);

  // Exekvera en trigger
  const executeTrigger = useCallback(async (
    trigger: TriggerCondition,
    metrics: any
  ): Promise<boolean> => {
    try {
      // Generera kontext-aware intervention
      return await generateContextualIntervention(metrics);
    } catch (error) {
      console.error('Error executing trigger:', error);
      return false;
    }
  }, [generateContextualIntervention]);

  // Hämta senaste trigger-tid för en typ
  const getLastTriggerTime = useCallback(async (triggerType: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('stefan_interventions')
        .select('created_at')
        .eq('user_id', user?.id)
        .eq('trigger_type', triggerType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.created_at;
    } catch (error) {
      return null;
    }
  }, [user?.id]);

  // Logga trigger-exekvering
  const logTriggerExecution = useCallback(async (
    trigger: TriggerCondition,
    success: boolean
  ): Promise<void> => {
    try {
      await supabase.from('analytics_metrics').insert({
        user_id: user?.id,
        metric_type: 'stefan_trigger_executed',
        metric_value: success ? 1 : 0,
        metadata: {
          trigger_type: trigger.type,
          trigger_priority: trigger.priority,
          execution_timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging trigger execution:', error);
    }
  }, [user?.id]);

  // Aktivera/inaktivera trigger
  const toggleTrigger = useCallback((triggerType: string, enabled: boolean) => {
    setTriggers(prev => 
      prev.map(trigger => 
        trigger.type === triggerType 
          ? { ...trigger, enabled }
          : trigger
      )
    );
  }, []);

  // Uppdatera trigger-condition
  const updateTriggerCondition = useCallback((
    triggerType: string,
    newCondition: Record<string, any>
  ) => {
    setTriggers(prev =>
      prev.map(trigger =>
        trigger.type === triggerType
          ? { ...trigger, condition: { ...trigger.condition, ...newCondition } }
          : trigger
      )
    );
  }, []);

  // Kör triggers periodiskt
  useEffect(() => {
    if (user) {
      // Initial check
      checkAllTriggers();

      // Set up periodic checks (every 30 minutes)
      const interval = setInterval(() => {
        checkAllTriggers();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [user, checkAllTriggers]);

  return {
    // State
    triggers,
    isProcessing,
    
    // Actions
    checkAllTriggers,
    toggleTrigger,
    updateTriggerCondition,
    evaluateTriggerCondition,
    
    // Utils
    getLastTriggerTime
  };
};