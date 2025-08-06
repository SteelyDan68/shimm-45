import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStefanInterventions } from './useStefanInterventions';

/**
 * 🎯 STEFAN PROACTIVE COACHING HOOK - SPRINT 2
 * Intelligent triggers and context-aware Stefan interventions
 * Integrerar med pillar system och assessment data för smart coaching
 */

export interface ProactiveCoachingMetrics {
  pillarScores: Record<string, number>;
  recentActivity: number;
  assessmentTrends: 'improving' | 'declining' | 'stable';
  lastInteraction: string;
  interventionNeeded: boolean;
  interventionType?: 'motivation' | 'guidance' | 'celebration' | 'concern';
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

export interface CoachingTrigger {
  id: string;
  type: 'inactivity' | 'declining_score' | 'achievement' | 'pattern_change';
  condition: Record<string, any>;
  action: 'intervention' | 'celebration' | 'check_in' | 'guidance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  lastTriggered?: string;
}

export const useStefanProactiveCoaching = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createIntervention } = useStefanInterventions();
  
  const [coachingMetrics, setCoachingMetrics] = useState<ProactiveCoachingMetrics | null>(null);
  const [activeTriggers, setActiveTriggers] = useState<CoachingTrigger[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze user context and determine coaching needs
  const analyzeCoachingNeeds = useCallback(async (): Promise<ProactiveCoachingMetrics | null> => {
    if (!user) return null;

    try {
      setIsAnalyzing(true);

      // Fetch user pillar assessments
      const { data: pillarAssessments } = await supabase
        .from('pillar_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent user activity
      const { data: recentActivity } = await supabase
        .from('stefan_interventions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Calculate pillar scores
      const pillarScores: Record<string, number> = {};
      pillarAssessments?.forEach(assessment => {
        if (assessment.pillar_key && assessment.calculated_score) {
          pillarScores[assessment.pillar_key] = assessment.calculated_score || 0;
        }
      });

      // Determine assessment trends
      let assessmentTrends: 'improving' | 'declining' | 'stable' = 'stable';
      if (pillarAssessments && pillarAssessments.length >= 2) {
        const latest = pillarAssessments[0]?.calculated_score || 0;
        const previous = pillarAssessments[1]?.calculated_score || 0;
        if (latest > previous + 0.5) assessmentTrends = 'improving';
        else if (latest < previous - 0.5) assessmentTrends = 'declining';
      }

      // Determine intervention needs
      const daysSinceLastActivity = recentActivity?.[0] 
        ? Math.floor((Date.now() - new Date(recentActivity[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
        : 30;

      let interventionNeeded = false;
      let interventionType: 'motivation' | 'guidance' | 'celebration' | 'concern' = 'motivation';
      let urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'low';

      // Smart intervention logic
      if (assessmentTrends === 'declining') {
        interventionNeeded = true;
        interventionType = 'concern';
        urgencyLevel = 'high';
      } else if (assessmentTrends === 'improving') {
        interventionNeeded = true;
        interventionType = 'celebration';
        urgencyLevel = 'medium';
      } else if (daysSinceLastActivity > 7) {
        interventionNeeded = true;
        interventionType = 'motivation';
        urgencyLevel = daysSinceLastActivity > 14 ? 'high' : 'medium';
      }

      const metrics: ProactiveCoachingMetrics = {
        pillarScores,
        recentActivity: recentActivity?.length || 0,
        assessmentTrends,
        lastInteraction: recentActivity?.[0]?.created_at || new Date().toISOString(),
        interventionNeeded,
        interventionType: interventionNeeded ? interventionType : undefined,
        urgencyLevel
      };

      setCoachingMetrics(metrics);
      return metrics;

    } catch (error) {
      console.error('Error analyzing coaching needs:', error);
      toast({
        title: "Analysfel",
        description: "Kunde inte analysera coaching-behov",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, toast]);

  // Generate personalized Stefan intervention based on context
  const generateContextualIntervention = useCallback(async (
    metrics: ProactiveCoachingMetrics
  ): Promise<boolean> => {
    if (!user || !metrics.interventionNeeded) return false;

    try {
      let content = '';
      let triggerType = 'proactive_coaching';

      switch (metrics.interventionType) {
        case 'celebration':
          content = `🎉 Wow! Jag ser verkligen framsteg i din utvecklingsresa! Dina senaste assessment-resultat visar på positiv utveckling. Du gör ett fantastiskt arbete - detta är värt att fira! Hur känns det för dig att se denna utveckling?`;
          triggerType = 'celebration';
          break;

        case 'concern':
          content = `🤗 Jag märker att du kanske har utmaningar just nu - dina senaste resultat visar på områden där vi kan ge extra stöd. Det är helt normalt med upp- och nedgångar. Vill du att vi tittar tillsammans på vad som kan hjälpa dig framåt?`;
          triggerType = 'support_check';
          break;

        case 'motivation':
          const daysSince = Math.floor((Date.now() - new Date(metrics.lastInteraction).getTime()) / (24 * 60 * 60 * 1000));
          content = `👋 Hej igen! Det har gått ${daysSince} dagar sedan vi pratade senast. Jag tänker på dig och undrar hur det går med din utvecklingsresa. Finns det något sätt jag kan stödja dig idag?`;
          triggerType = 'check_in';
          break;

        case 'guidance':
          content = `💡 Baserat på dina senaste assessments ser jag möjligheter för ännu mer tillväxt! Jag har några tankar om nästa steg i din utveckling. Vill du att vi utforskar dem tillsammans?`;
          triggerType = 'guidance_offer';
          break;
      }

      const success = await createIntervention(
        triggerType,
        content,
        metrics.urgencyLevel,
        {
          generated_by: 'proactive_coaching',
          metrics_snapshot: metrics,
          ai_analysis: true,
          trigger_timestamp: new Date().toISOString()
        }
      );

      if (success) {
        // Log analytics for proactive intervention
        await supabase.from('analytics_metrics').insert({
          user_id: user.id,
          metric_type: 'stefan_proactive_intervention',
          metric_value: 1,
          metadata: {
            intervention_type: metrics.interventionType,
            urgency: metrics.urgencyLevel,
            pillar_scores: metrics.pillarScores,
            assessment_trend: metrics.assessmentTrends
          }
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error generating contextual intervention:', error);
      return false;
    }
  }, [user, createIntervention]);

  // Check if proactive intervention should be triggered
  const checkProactiveInterventions = useCallback(async (): Promise<boolean> => {
    const metrics = await analyzeCoachingNeeds();
    
    if (metrics?.interventionNeeded) {
      return await generateContextualIntervention(metrics);
    }
    
    return false;
  }, [analyzeCoachingNeeds, generateContextualIntervention]);

  // Get coaching insights for admin/coach view
  const getCoachingInsights = useCallback(() => {
    if (!coachingMetrics) return null;

    const insights = [];

    // Pillar performance insights
    Object.entries(coachingMetrics.pillarScores).forEach(([pillar, score]) => {
      if (score < 3) {
        insights.push({
          type: 'concern',
          message: `${pillar} pillar visar lägre score (${score}/5) - kan behöva extra uppmärksamhet`,
          priority: 'high'
        });
      } else if (score > 4) {
        insights.push({
          type: 'success',
          message: `${pillar} pillar presterar utmärkt (${score}/5) - bra grund för utveckling`,
          priority: 'low'
        });
      }
    });

    // Activity insights
    if (coachingMetrics.recentActivity === 0) {
      insights.push({
        type: 'alert',
        message: 'Ingen aktivitet senaste veckan - check-in rekommenderas',
        priority: 'high'
      });
    }

    // Trend insights
    if (coachingMetrics.assessmentTrends === 'improving') {
      insights.push({
        type: 'celebration',
        message: 'Positiv utvecklingstrend - fira framstegen!',
        priority: 'medium'
      });
    }

    return insights;
  }, [coachingMetrics]);

  // Run periodic coaching analysis
  useEffect(() => {
    if (user) {
      analyzeCoachingNeeds();
      
      // Set up periodic check (every 6 hours in real app, reduced for demo)
      const interval = setInterval(() => {
        checkProactiveInterventions();
      }, 6 * 60 * 60 * 1000); // 6 hours

      return () => clearInterval(interval);
    }
  }, [user, analyzeCoachingNeeds, checkProactiveInterventions]);

  return {
    // Data
    coachingMetrics,
    activeTriggers,
    
    // State
    isAnalyzing,
    
    // Actions
    analyzeCoachingNeeds,
    checkProactiveInterventions,
    generateContextualIntervention,
    
    // Computed
    getCoachingInsights
  };
};