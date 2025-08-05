import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useContextEngine } from '@/hooks/useContextEngine';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedStefanContextData {
  // Enhanced context awareness
  currentPage: string;
  currentTask?: any;
  currentEvent?: any;
  userActivity: {
    lastActionTime: Date;
    consecutiveInactiveDays: number;
    currentStreak: number;
    strugglingTasks: any[];
    sessionId: string;
    contextualInsights: any[];
  };
  
  // Enhanced Stefan interaction methods
  triggerContextualHelp: (context: string, data?: any) => Promise<void>;
  askStefanQuestion: (question: string, context: string) => Promise<void>;
  celebrateProgress: (milestone: string, data?: any) => Promise<void>;
  requestMotivation: (reason?: string) => Promise<void>;
  shareInsight: (insight: any) => Promise<void>;
  
  // Enhanced Stefan state
  isAvailable: boolean;
  currentPersona: string;
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
  contextualMood: 'supportive' | 'encouraging' | 'analytical' | 'celebratory';
  
  // New proactive features
  scheduleCheckIn: (delay: number) => Promise<void>;
  suggestNextAction: () => Promise<void>;
  adaptToUserBehavior: () => Promise<void>;
}

const EnhancedStefanContext = createContext<EnhancedStefanContextData | undefined>(undefined);

interface EnhancedStefanContextProviderProps {
  children: React.ReactNode;
}

export const EnhancedStefanContextProvider = ({ children }: EnhancedStefanContextProviderProps) => {
  const { user } = useAuth();
  const { 
    createStefanInteraction, 
    triggerProactiveIntervention,
    getCurrentPersonaInfo,
    loading: stefanLoading 
  } = useStefanPersonality();
  const { journeyState } = useUserJourney();
  const {
    sessionId,
    trackAction,
    trackAchievement,
    trackStruggle,
    getCurrentContext,
    generateContextInsights,
    scheduleIntervention
  } = useContextEngine();
  
  const [currentPage, setCurrentPage] = useState('');
  const [currentTask, setCurrentTask] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [contextualMood, setContextualMood] = useState<'supportive' | 'encouraging' | 'analytical' | 'celebratory'>('supportive');
  const [contextualInsights, setContextualInsights] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState({
    lastActionTime: new Date(),
    consecutiveInactiveDays: 0,
    currentStreak: 0,
    strugglingTasks: [],
    sessionId,
    contextualInsights: []
  });

  // Enhanced page tracking med djupare kontext
  useEffect(() => {
    const path = window.location.pathname;
    setCurrentPage(path);
    
    // Track page visit med enhanced context
    trackAction('page_navigation', {
      from_page: currentPage,
      to_page: path,
      journey_phase: journeyState?.current_phase,
      session_duration: Date.now() - new Date(userActivity.lastActionTime).getTime()
    });
    
    // Intelligent widget visibility baserat på kontext
    const intelligentWidgetLogic = () => {
      const workPages = ['/tasks', '/calendar', '/client-dashboard', '/assessments'];
      const strugglingPages = ['/assessments', '/tasks'];
      const celebratoryPages = ['/progress', '/achievements'];
      
      const shouldShow = workPages.some(page => path.includes(page));
      setShowWidget(shouldShow);
      
      // Anpassa Stefan's mood baserat på sida
      if (strugglingPages.some(page => path.includes(page))) {
        setContextualMood('supportive');
      } else if (celebratoryPages.some(page => path.includes(page))) {
        setContextualMood('celebratory');
      } else {
        setContextualMood('encouraging');
      }
    };
    
    intelligentWidgetLogic();
  }, [window.location.pathname, trackAction]);

  // Enhanced activity monitoring med AI-insights
  useEffect(() => {
    if (!user) return;

    const enhancedActivityCheck = async () => {
      try {
        
        
        // Get current context from Context Engine
        const currentContext = await getCurrentContext();
        
        // Traditional activity checks (behåll befintlig logik)
        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false });

        const { data: recentEvents } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('event_date', { ascending: false });

        // Enhanced activity metrics with context
        const completedTasks = recentTasks?.filter(task => task.status === 'completed') || [];
        const strugglingTasks = recentTasks?.filter(task => 
          task.status === 'in_progress' && 
          new Date(task.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        ) || [];

        // Update enhanced user activity
        setUserActivity(prev => ({
          ...prev,
          lastActionTime: new Date(),
          currentStreak: completedTasks.length,
          strugglingTasks,
          sessionId,
          contextualInsights: currentContext.active_insights || []
        }));

        // Enhanced triggering logic med contextual awareness
        const activityLevel = currentContext.activity_summary?.activity_level;
        const recentStruggles = currentContext.activity_summary?.struggles_count || 0;
        const recentAchievements = currentContext.activity_summary?.achievements_count || 0;

        // Intelligent intervention logic
        if (activityLevel === 'low' && strugglingTasks.length > 0) {
          await triggerProactiveIntervention('combined_low_activity_struggles', {
            activity_level: activityLevel,
            struggling_tasks: strugglingTasks.length,
            context_insights: currentContext.active_insights,
            suggested_mood: 'supportive'
          });
          setContextualMood('supportive');
        }
        
        if (recentAchievements >= 2 && completedTasks.length >= 3) {
          await triggerProactiveIntervention('momentum_building', {
            completed_tasks: completedTasks.length,
            recent_achievements: recentAchievements,
            suggested_mood: 'celebratory'
          });
          setContextualMood('celebratory');
        }

        // Generate AI insights periodically
        if (Math.random() < 0.3) { // 30% chance för att inte överbelasta
          
          await generateContextInsights();
        }

        console.log('✅ Enhanced Activity Check completed', {
          activity_level: activityLevel,
          struggles: recentStruggles,
          achievements: recentAchievements,
          mood: contextualMood
        });

      } catch (error) {
        console.error('Error in enhanced activity check:', error);
      }
    };

    // Run enhanced checks every 20 minutes (mindre frekvent än original)
    const interval = setInterval(enhancedActivityCheck, 20 * 60 * 1000);
    enhancedActivityCheck(); // Initial check

    return () => clearInterval(interval);
  }, [user, generateContextInsights, triggerProactiveIntervention, sessionId]);

  // Enhanced Stefan interaction methods
  const triggerContextualHelp = useCallback(async (context: string, data: any = {}) => {
    if (!user) return;

    // Track the help request
    await trackAction('stefan_help_requested', { context, help_type: 'contextual' });

    const enhancedContextData = await getCurrentContext();
    const contextData = {
      page: currentPage,
      current_task: currentTask,
      current_event: currentEvent,
      user_activity: userActivity,
      journey_phase: journeyState?.current_phase,
      contextual_mood: contextualMood,
      session_context: enhancedContextData,
      ...data
    };

    await createStefanInteraction('contextual_help', context, contextData);
  }, [user, currentPage, currentTask, currentEvent, userActivity, journeyState, contextualMood, createStefanInteraction, trackAction, getCurrentContext]);

  const askStefanQuestion = useCallback(async (question: string, context: string) => {
    if (!user) return;

    await trackAction('stefan_question_asked', { question: question.substring(0, 100), context });

    const enhancedContextData = await getCurrentContext();
    const contextData = {
      question,
      page: currentPage,
      context,
      user_activity: userActivity,
      journey_state: journeyState,
      mood: contextualMood,
      session_context: enhancedContextData
    };

    await createStefanInteraction('user_question', 'direct_question', contextData);
  }, [user, currentPage, userActivity, journeyState, contextualMood, createStefanInteraction, trackAction, getCurrentContext]);

  const celebrateProgress = useCallback(async (milestone: string, data: any = {}) => {
    if (!user) return;

    await trackAchievement(milestone, data);
    setContextualMood('celebratory');

    const contextData = {
      milestone,
      achievement_data: data,
      current_streak: userActivity.currentStreak,
      journey_progress: journeyState?.journey_progress,
      celebration_context: await getCurrentContext()
    };

    await createStefanInteraction('celebration', 'milestone_achievement', contextData);
  }, [user, userActivity, journeyState, createStefanInteraction, trackAchievement, getCurrentContext]);

  const requestMotivation = useCallback(async (reason?: string) => {
    if (!user) return;

    await trackAction('motivation_requested', { reason: reason || 'general' });
    setContextualMood('encouraging');

    const contextData = {
      reason: reason || 'general_motivation',
      current_challenges: userActivity.strugglingTasks,
      journey_phase: journeyState?.current_phase,
      contextual_insights: contextualInsights,
      motivation_context: await getCurrentContext()
    };

    await createStefanInteraction('motivation', 'user_request', contextData);
  }, [user, userActivity, journeyState, contextualInsights, createStefanInteraction, trackAction, getCurrentContext]);

  // New enhanced methods
  const shareInsight = useCallback(async (insight: any) => {
    if (!user) return;

    await trackAction('insight_shared', { insight_type: insight.type, confidence: insight.confidence });

    await scheduleIntervention({
      trigger_condition: 'insight_sharing',
      intervention_type: 'message',
      content: `Jag har en intressant insikt att dela med dig: ${insight.title}. ${insight.description}`,
      delivery_method: 'messenger'
    });
  }, [user, trackAction, scheduleIntervention]);

  const scheduleCheckIn = useCallback(async (delay: number) => {
    if (!user) return;

    const scheduledTime = new Date(Date.now() + delay * 60 * 1000).toISOString();
    
    await scheduleIntervention({
      trigger_condition: 'scheduled_check_in',
      intervention_type: 'check_in',
      content: 'Hej igen! Hur går det? Jag ville bara kolla läget och se om du behöver någon support.',
      delivery_method: 'messenger',
      scheduled_for: scheduledTime
    });
  }, [user, scheduleIntervention]);

  const suggestNextAction = useCallback(async () => {
    if (!user) return;

    const context = await getCurrentContext();
    const activitySummary = context.activity_summary;

    let suggestion = 'Vad sägs om att utforska något nytt idag?';
    
    if (activitySummary?.activity_level === 'low') {
      suggestion = 'Jag märker att du varit lite mindre aktiv. Vill du att vi börjar med något enkelt tillsammans?';
    } else if (activitySummary?.struggles_count > 0) {
      suggestion = 'Du har hanterat några utmaningar idag. Låt oss ta itu med dem en i taget. Vad känns viktigast?';
    } else if (activitySummary?.achievements_count > 0) {
      suggestion = 'Du har gjort fantastiska framsteg! Vill du bygga vidare på den här farten?';
    }

    await scheduleIntervention({
      trigger_condition: 'action_suggestion',
      intervention_type: 'task_suggestion',
      content: suggestion,
      delivery_method: 'widget'
    });
  }, [user, getCurrentContext, scheduleIntervention]);

  const adaptToUserBehavior = useCallback(async () => {
    if (!user) return;

    try {
      const context = await getCurrentContext();
      const patterns = context.behavior_patterns || [];
      
      // Adapt Stefan's personality based on discovered patterns
      for (const pattern of patterns) {
        if (pattern.pattern_type === 'daily_rhythm' && pattern.pattern_strength > 0.7) {
          const optimalTime = pattern.pattern_data?.peak_activity_hour;
          if (optimalTime) {
            
            // Schedule more interventions during peak hours
          }
        }
        
        if (pattern.pattern_type === 'motivation_trend' && pattern.pattern_strength > 0.6) {
          const preferredMotivation = pattern.pattern_data?.preferred_style;
          if (preferredMotivation) {
            
            setContextualMood(preferredMotivation.includes('celebrat') ? 'celebratory' : 'encouraging');
          }
        }
      }
    } catch (error) {
      console.error('Error adapting to user behavior:', error);
    }
  }, [user, getCurrentContext]);

  // Run behavioral adaptation periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(adaptToUserBehavior, 60 * 60 * 1000); // Every hour
    adaptToUserBehavior(); // Initial adaptation

    return () => clearInterval(interval);
  }, [user, adaptToUserBehavior]);

  const contextValue: EnhancedStefanContextData = {
    currentPage,
    currentTask,
    currentEvent,
    userActivity,
    triggerContextualHelp,
    askStefanQuestion,
    celebrateProgress,
    requestMotivation,
    shareInsight,
    isAvailable: !stefanLoading && !!user,
    currentPersona: getCurrentPersonaInfo()?.name || 'mentor',
    showWidget,
    setShowWidget,
    contextualMood,
    scheduleCheckIn,
    suggestNextAction,
    adaptToUserBehavior
  };

  return (
    <EnhancedStefanContext.Provider value={contextValue}>
      {children}
    </EnhancedStefanContext.Provider>
  );
};

export const useEnhancedStefanContext = () => {
  const context = useContext(EnhancedStefanContext);
  if (context === undefined) {
    throw new Error('useEnhancedStefanContext must be used within an EnhancedStefanContextProvider');
  }
  return context;
};