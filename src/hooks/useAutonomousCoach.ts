import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface AutonomousTrigger {
  id: string;
  user_id: string;
  trigger_type: string;
  condition_met_at: string;
  trigger_data: Record<string, any>;
  action_taken?: string;
  ai_intervention?: Record<string, any>;
  resolution_status: 'pending' | 'intervened' | 'resolved' | 'escalated';
}

export interface CoachInsight {
  id: string;
  coach_id: string;
  user_id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  ai_generated: boolean;
  action_points: string[];
  data_sources: string[];
  expires_at?: string;
  created_at: string;
}

/**
 * Autonomous Coach System Hook
 * - Övervakar användarbeteende och triggar AI-interventioner
 * - Genererar insikter för mänskliga coaches
 * - Säkerställer att ingen klient faller mellan stolarna
 * - Integrerar med GDPR-loggning och Stefan AI
 */
export const useAutonomousCoach = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const triggerCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  
  const targetUserId = userId || user?.id;

  // Logga användaraktivitet
  const logActivity = useCallback(async (activityType: string, metadata: Record<string, any> = {}) => {
    if (!targetUserId) return;

    lastActivityRef.current = new Date();
    
    try {
      // Uppdatera journey tracking
      await supabase
        .from('user_journey_tracking')
        .upsert({
          user_id: targetUserId,
          last_activity_at: new Date().toISOString(),
          journey_phase: metadata.journey_phase || 'development_active'
        }, {
          onConflict: 'user_id'
        });

      // Logga i GDPR-kompatibel audit trail
      await supabase.from('assessment_events').insert({
        user_id: targetUserId,
        event_type: 'user_activity',
        event_data: {
          activity_type: activityType,
          timestamp: new Date().toISOString(),
          ...metadata
        },
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }, [targetUserId]);

  // Kontrollera triggers och generera autonoma åtgärder
  const checkAutonomousTriggers = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Hämta användarens senaste aktivitet och status
      const { data: journeyData } = await supabase
        .from('user_journey_tracking')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (!journeyData) return;

      const timeSinceActivity = Date.now() - new Date(journeyData.last_activity_at).getTime();
      const hoursInactive = timeSinceActivity / (1000 * 60 * 60);

      // Trigger 1: Inaktivitet längre än 48 timmar
      if (hoursInactive > 48) {
        await createAutonomousTrigger('engagement_drop', {
          hours_inactive: hoursInactive,
          last_activity: journeyData.last_activity_at,
          severity: hoursInactive > 168 ? 'high' : 'medium' // 1 vecka = hög prio
        });
      }

      // Trigger 2: Låg progression (under 10% på 7 dagar)
      if (journeyData.overall_progress < 10) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (new Date(journeyData.created_at) < weekAgo) {
          await createAutonomousTrigger('progress_stalled', {
            current_progress: journeyData.overall_progress,
            days_since_start: Math.floor((Date.now() - new Date(journeyData.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            severity: 'high'
          });
        }
      }

      // Trigger 3: Assessment abandoned (kontrollera via assessment_states)
      const { data: abandonedAssessments } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_draft', true)
        .lt('last_saved_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24h gamla drafts

      if (abandonedAssessments && abandonedAssessments.length > 0) {
        await createAutonomousTrigger('assessment_abandoned', {
          abandoned_count: abandonedAssessments.length,
          assessment_types: abandonedAssessments.map(a => a.assessment_type),
          oldest_draft: abandonedAssessments[0].last_saved_at,
          severity: 'medium'
        });
      }

    } catch (error) {
      console.error('Error checking autonomous triggers:', error);
    }
  }, [targetUserId]);

  // Skapa autonom trigger
  const createAutonomousTrigger = useCallback(async (
    triggerType: string,
    triggerData: Record<string, any>
  ) => {
    if (!targetUserId) return;

    try {
      // Kolla om liknande trigger redan finns (undvik spam)
      const { data: existingTrigger } = await supabase
        .from('autonomous_triggers')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('trigger_type', triggerType)
        .eq('resolution_status', 'pending')
        .gte('condition_met_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingTrigger) return; // Redan hanterat

      // Skapa ny trigger
      const { data: trigger, error } = await supabase
        .from('autonomous_triggers')
        .insert({
          user_id: targetUserId,
          trigger_type: triggerType,
          trigger_data: triggerData
        })
        .select()
        .single();

      if (error) throw error;

      // Generera AI-intervention
      await generateAIIntervention(trigger);

    } catch (error) {
      console.error('Error creating autonomous trigger:', error);
    }
  }, [targetUserId]);

  // Generera AI-intervention
  const generateAIIntervention = useCallback(async (trigger: any) => {
    try {
      // Anropa edge function för AI-intervention
      const { data, error } = await supabase.functions.invoke('autonomous-coach-intervention', {
        body: {
          trigger: trigger,
          user_id: trigger.user_id
        }
      });

      if (error) throw error;

      // Uppdatera trigger med AI-intervention
      await supabase
        .from('autonomous_triggers')
        .update({
          ai_intervention: data.intervention,
          action_taken: data.action_taken,
          resolution_status: 'intervened'
        })
        .eq('id', trigger.id);

      // Skapa coach insight om det behövs human intervention
      if (data.requires_human_intervention) {
        await createCoachInsight(trigger, data);
      }

      // Visa notification till användaren om relevant
      if (data.user_notification) {
        toast({
          title: data.user_notification.title,
          description: data.user_notification.description,
          variant: data.user_notification.variant || 'default'
        });
      }

    } catch (error) {
      console.error('Error generating AI intervention:', error);
    }
  }, [toast]);

  // Skapa coach insight
  const createCoachInsight = useCallback(async (trigger: any, interventionData: any) => {
    try {
      // Hitta användarens coach
      const { data: coachAssignment } = await supabase
        .from('coach_client_assignments')
        .select('coach_id')
        .eq('client_id', trigger.user_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!coachAssignment) return; // Ingen coach tilldelad

      await supabase.from('coach_insights').insert({
        coach_id: coachAssignment.coach_id,
        user_id: trigger.user_id,
        insight_type: trigger.trigger_type,
        title: interventionData.insight_title,
        description: interventionData.insight_description,
        priority: interventionData.priority || 'medium',
        ai_generated: true,
        action_points: interventionData.recommended_actions || [],
        data_sources: [`autonomous_trigger:${trigger.id}`],
        expires_at: interventionData.expires_at
      });

    } catch (error) {
      console.error('Error creating coach insight:', error);
    }
  }, []);

  // Hämta aktiva triggers för användaren
  const getActiveTriggers = useCallback(async () => {
    if (!targetUserId) return [];

    try {
      const { data, error } = await supabase
        .from('autonomous_triggers')
        .select('*')
        .eq('user_id', targetUserId)
        .in('resolution_status', ['pending', 'intervened'])
        .order('condition_met_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active triggers:', error);
      return [];
    }
  }, [targetUserId]);

  // Markera trigger som löst
  const resolveTrigger = useCallback(async (triggerId: string) => {
    try {
      await supabase
        .from('autonomous_triggers')
        .update({
          resolution_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', triggerId);
    } catch (error) {
      console.error('Error resolving trigger:', error);
    }
  }, []);

  // Stefan AI intervention
  const triggerStefanIntervention = useCallback(async (
    interventionType: string,
    context: Record<string, any>
  ) => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase.functions.invoke('stefan-ai-chat', {
        body: {
          user_id: targetUserId,
          intervention_type: interventionType,
          context: context,
          trigger_autonomous: true
        }
      });

      if (error) throw error;

      // Logga Stefan intervention
      await logActivity('stefan_intervention', {
        intervention_type: interventionType,
        stefan_message: data.message,
        context: context
      });

      return data;
    } catch (error) {
      console.error('Error triggering Stefan intervention:', error);
    }
  }, [targetUserId, logActivity]);

  // Starta autonom övervkning
  useEffect(() => {
    if (!targetUserId) return;

    // Initial check
    checkAutonomousTriggers();

    // Sätt upp regelbunden kontroll (var 30:e minut)
    triggerCheckRef.current = setInterval(() => {
      checkAutonomousTriggers();
    }, 30 * 60 * 1000);

    return () => {
      if (triggerCheckRef.current) {
        clearInterval(triggerCheckRef.current);
      }
    };
  }, [targetUserId, checkAutonomousTriggers]);

  return {
    logActivity,
    checkAutonomousTriggers,
    createAutonomousTrigger,
    getActiveTriggers,
    resolveTrigger,
    triggerStefanIntervention,
    generateAIIntervention,
    createCoachInsight
  };
};