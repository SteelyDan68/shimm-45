import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export interface ContextEvent {
  id?: string;
  user_id: string;
  event_type: 'page_visit' | 'action' | 'interaction' | 'achievement' | 'struggle' | 'message_sent' | 'assessment_start' | 'task_created';
  context_data: Record<string, any>;
  page_url?: string;
  session_id?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ContextInsight {
  id?: string;
  user_id: string;
  insight_type: 'behavioral_pattern' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  confidence_score: number;
  data_sources: string[];
  valid_until?: string;
}

export interface ProactiveIntervention {
  id?: string;
  user_id: string;
  trigger_condition: string;
  intervention_type: 'message' | 'task_suggestion' | 'resource_share' | 'check_in';
  content: string;
  delivery_method: 'messenger' | 'widget' | 'notification';
  scheduled_for?: string;
  context_snapshot?: Record<string, any>;
}

export const useContextEngine = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Log context event (core tracking function)
  const logContextEvent = useCallback(async (event: Omit<ContextEvent, 'user_id'>) => {
    if (!user) return;

    try {
      const contextEvent: ContextEvent = {
        ...event,
        user_id: user.id,
        session_id: sessionId,
        page_url: window.location.pathname,
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from('user_context_events')
        .insert(contextEvent);

      console.log('🎯 Context Event Logged:', event.event_type, event.context_data);
    } catch (error) {
      console.error('Failed to log context event:', error);
    }
  }, [user, sessionId]);

  // Track page visits automatically
  const trackPageVisit = useCallback(async (page: string) => {
    await logContextEvent({
      event_type: 'page_visit',
      context_data: {
        page,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        user_agent: navigator.userAgent.substring(0, 200), // Begränsa längd
      },
    });
  }, [logContextEvent]);

  // Track user actions
  const trackAction = useCallback(async (action: string, data: Record<string, any> = {}) => {
    await logContextEvent({
      event_type: 'action',
      context_data: {
        action,
        ...data,
        timestamp: new Date().toISOString(),
      },
    });
  }, [logContextEvent]);

  // Track achievements
  const trackAchievement = useCallback(async (achievement: string, data: Record<string, any> = {}) => {
    await logContextEvent({
      event_type: 'achievement',
      context_data: {
        achievement,
        ...data,
        celebration_worthy: true,
        timestamp: new Date().toISOString(),
      },
    });
  }, [logContextEvent]);

  // Track user struggles/challenges
  const trackStruggle = useCallback(async (struggle: string, data: Record<string, any> = {}) => {
    await logContextEvent({
      event_type: 'struggle',
      context_data: {
        struggle,
        requires_support: true,
        ...data,
        timestamp: new Date().toISOString(),
      },
    });
  }, [logContextEvent]);

  // Get user's current context for AI
  const getCurrentContext = useCallback(async (): Promise<Record<string, any>> => {
    if (!user) return {};

    try {
      // Get recent events (last 24 hours)
      const { data: recentEvents } = await supabase
        .from('user_context_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);

      // Get active insights
      const { data: insights } = await supabase
        .from('context_insights')
        .select('*')
        .eq('user_id', user.id)
        .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
        .order('confidence_score', { ascending: false })
        .limit(10);

      // Get behavior patterns
      const { data: patterns } = await supabase
        .from('user_behavior_patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('pattern_strength', { ascending: false })
        .limit(5);

      // Analyze recent activity patterns
      const activityAnalysis = analyzeActivityPatterns(recentEvents || []);

      return {
        current_page: window.location.pathname,
        session_id: sessionId,
        recent_events: recentEvents?.slice(0, 10), // Last 10 events
        activity_summary: activityAnalysis,
        active_insights: insights,
        behavior_patterns: patterns,
        context_freshness: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting current context:', error);
      return {
        current_page: window.location.pathname,
        session_id: sessionId,
        error: 'Failed to load context',
      };
    }
  }, [user, sessionId]);

  // Analyze activity patterns from events
  const analyzeActivityPatterns = (events: any[]) => {
    const pageVisits = events.filter(e => e.event_type === 'page_visit');
    const actions = events.filter(e => e.event_type === 'action');
    const achievements = events.filter(e => e.event_type === 'achievement');
    const struggles = events.filter(e => e.event_type === 'struggle');

    const mostVisitedPages = pageVisits
      .reduce((acc: Record<string, number>, event) => {
        const page = event.context_data?.page || 'unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {});

    const commonActions = actions
      .reduce((acc: Record<string, number>, event) => {
        const action = event.context_data?.action || 'unknown';
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {});

    return {
      total_events: events.length,
      page_visits: pageVisits.length,
      actions_taken: actions.length,
      achievements_count: achievements.length,
      struggles_count: struggles.length,
      most_visited_pages: Object.entries(mostVisitedPages)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3),
      common_actions: Object.entries(commonActions)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5),
      activity_level: events.length > 20 ? 'high' : events.length > 10 ? 'medium' : 'low',
      last_activity: events[0]?.timestamp,
    };
  };

  // Generate AI insights from current context
  const generateContextInsights = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const context = await getCurrentContext();

      // Call AI service to analyze context and generate insights
      const { data: aiResponse } = await supabase.functions.invoke('context-analyzer', {
        body: {
          user_id: user.id,
          context_data: context,
          analysis_type: 'behavioral_insights',
        },
      });

      if (aiResponse?.insights) {
        // Store generated insights
        for (const insight of aiResponse.insights) {
          await supabase
            .from('context_insights')
            .insert({
              user_id: user.id,
              insight_type: insight.type,
              title: insight.title,
              description: insight.description,
              confidence_score: insight.confidence,
              data_sources: insight.sources || [],
              valid_until: insight.expires ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            });
        }
      }
    } catch (error) {
      console.error('Error generating context insights:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getCurrentContext]);

  // Schedule proactive intervention
  const scheduleIntervention = useCallback(async (intervention: Omit<ProactiveIntervention, 'user_id'>) => {
    if (!user) return;

    try {
      const context = await getCurrentContext();

      await supabase
        .from('proactive_interventions')
        .insert({
          ...intervention,
          user_id: user.id,
          context_snapshot: context,
          scheduled_for: intervention.scheduled_for || new Date().toISOString(),
        });

      console.log('🤖 Intervention Scheduled:', intervention.intervention_type);
    } catch (error) {
      console.error('Error scheduling intervention:', error);
    }
  }, [user, getCurrentContext]);

  // Check for triggers and create interventions
  const checkForTriggers = useCallback(async () => {
    if (!user) return;

    try {
      const context = await getCurrentContext();
      const activitySummary = context.activity_summary;

      // Trigger: Low activity
      if (activitySummary?.activity_level === 'low' && activitySummary?.total_events < 5) {
        await scheduleIntervention({
          trigger_condition: 'low_activity_24h',
          intervention_type: 'check_in',
          content: 'Hej! Jag märkte att du inte varit så aktiv idag. Hur mår du? Finns det något jag kan hjälpa dig med?',
          delivery_method: 'messenger',
        });
      }

      // Trigger: Many struggles
      if (activitySummary?.struggles_count >= 3) {
        await scheduleIntervention({
          trigger_condition: 'multiple_struggles',
          intervention_type: 'resource_share',
          content: 'Jag ser att du haft lite utmaningar idag. Vill du att vi går igenom några strategier som kan hjälpa?',
          delivery_method: 'widget',
        });
      }

      // Trigger: High achievements
      if (activitySummary?.achievements_count >= 2) {
        await scheduleIntervention({
          trigger_condition: 'multiple_achievements',
          intervention_type: 'message',
          content: 'Wow! Du har gjort fantastiska framsteg idag! 🎉 Jag är så stolt över dig. Fortsätt så!',
          delivery_method: 'messenger',
        });
      }

      // Trigger: Stuck on same page
      const topPage = activitySummary?.most_visited_pages?.[0];
      if (topPage && topPage[1] > 10) {
        await scheduleIntervention({
          trigger_condition: 'page_stagnation',
          intervention_type: 'task_suggestion',
          content: `Jag märker att du tillbringat mycket tid på ${topPage[0]}. Behöver du hjälp att komma vidare eller vill du utforska något nytt?`,
          delivery_method: 'widget',
        });
      }

    } catch (error) {
      console.error('Error checking triggers:', error);
    }
  }, [user, getCurrentContext, scheduleIntervention]);

  // Auto-track page changes
  useEffect(() => {
    if (!user) return;

    trackPageVisit(window.location.pathname);

    // Track page change events
    const handlePopState = () => {
      trackPageVisit(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, trackPageVisit]);

  // Run trigger checks periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkForTriggers, 10 * 60 * 1000); // Every 10 minutes
    checkForTriggers(); // Initial check

    return () => clearInterval(interval);
  }, [user, checkForTriggers]);

  return {
    loading,
    sessionId,
    currentSessionState: { session_id: sessionId },
    insights: [],
    behaviorPatterns: [],
    logContextEvent,
    trackPageVisit,
    trackAction,
    trackAchievement,
    trackStruggle,
    getCurrentContext,
    generateContextInsights,
    scheduleIntervention,
    checkForTriggers,
  };
};