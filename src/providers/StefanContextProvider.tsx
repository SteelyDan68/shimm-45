import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { useUserJourney } from '@/hooks/useUserJourney';
import { supabase } from '@/integrations/supabase/client';

interface StefanContextData {
  // Current context awareness
  currentPage: string;
  currentTask?: any;
  currentEvent?: any;
  userActivity: {
    lastActionTime: Date;
    consecutiveInactiveDays: number;
    currentStreak: number;
    strugglingTasks: any[];
  };
  
  // Stefan interaction methods
  triggerContextualHelp: (context: string, data?: any) => Promise<void>;
  askStefanQuestion: (question: string, context: string) => Promise<void>;
  celebrateProgress: (milestone: string, data?: any) => Promise<void>;
  requestMotivation: (reason?: string) => Promise<void>;
  
  // Stefan state
  isAvailable: boolean;
  currentPersona: string;
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
}

const StefanContext = createContext<StefanContextData | undefined>(undefined);

interface StefanContextProviderProps {
  children: React.ReactNode;
}

export const StefanContextProvider = ({ children }: StefanContextProviderProps) => {
  const { user } = useAuth();
  const { 
    createStefanInteraction, 
    triggerProactiveIntervention,
    getCurrentPersonaInfo,
    loading: stefanLoading 
  } = useStefanPersonality();
  const { journeyState } = useUserJourney();
  
  const [currentPage, setCurrentPage] = useState('');
  const [currentTask, setCurrentTask] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [userActivity, setUserActivity] = useState({
    lastActionTime: new Date(),
    consecutiveInactiveDays: 0,
    currentStreak: 0,
    strugglingTasks: []
  });

  // Track current page context
  useEffect(() => {
    const path = window.location.pathname;
    setCurrentPage(path);
    console.log('🤖 StefanContextProvider: Page changed to', path);
    
    // Auto-show Stefan widget on relevant pages
    const workPages = ['/tasks', '/calendar', '/client-dashboard'];
    const shouldShow = workPages.some(page => path.includes(page));
    console.log('🤖 StefanContextProvider: Should show widget?', shouldShow, 'for path', path);
    setShowWidget(shouldShow);
  }, [window.location.pathname]);

  // Monitor user activity patterns
  useEffect(() => {
    if (!user) return;

    const checkUserActivity = async () => {
      try {
        // Check recent tasks activity
        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false });

        // Check calendar events participation
        const { data: recentEvents } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('event_date', { ascending: false });

        // Calculate activity metrics
        const completedTasks = recentTasks?.filter(task => task.status === 'completed') || [];
        const strugglingTasks = recentTasks?.filter(task => 
          task.status === 'in_progress' && 
          new Date(task.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        ) || [];

        setUserActivity(prev => ({
          ...prev,
          currentStreak: completedTasks.length,
          strugglingTasks
        }));

        // Trigger proactive interventions based on patterns
        if (strugglingTasks.length > 0) {
          await triggerProactiveIntervention('task_stagnation', {
            struggling_tasks: strugglingTasks.length,
            task_details: strugglingTasks
          });
        }
        
        if (completedTasks.length >= 3) {
          await triggerProactiveIntervention('progress_milestone', {
            completed_tasks: completedTasks.length,
            time_period: '7_days'
          });
        }

      } catch (error) {
        console.error('Error checking user activity:', error);
      }
    };

    // Check activity every 30 minutes
    const interval = setInterval(checkUserActivity, 30 * 60 * 1000);
    checkUserActivity(); // Initial check

    return () => clearInterval(interval);
  }, [user, triggerProactiveIntervention]);

  // Context-aware Stefan interactions
  const triggerContextualHelp = useCallback(async (context: string, data: any = {}) => {
    if (!user) return;

    const contextData = {
      page: currentPage,
      current_task: currentTask,
      current_event: currentEvent,
      user_activity: userActivity,
      journey_phase: journeyState?.current_phase,
      ...data
    };

    await createStefanInteraction('contextual_help', context, contextData);
  }, [user, currentPage, currentTask, currentEvent, userActivity, journeyState, createStefanInteraction]);

  const askStefanQuestion = useCallback(async (question: string, context: string) => {
    if (!user) return;

    const contextData = {
      question,
      page: currentPage,
      context,
      user_activity: userActivity,
      journey_state: journeyState
    };

    await createStefanInteraction('user_question', 'direct_question', contextData);
  }, [user, currentPage, userActivity, journeyState, createStefanInteraction]);

  const celebrateProgress = useCallback(async (milestone: string, data: any = {}) => {
    if (!user) return;

    const contextData = {
      milestone,
      achievement_data: data,
      current_streak: userActivity.currentStreak,
      journey_progress: journeyState?.journey_progress
    };

    await createStefanInteraction('celebration', 'milestone_achievement', contextData);
  }, [user, userActivity, journeyState, createStefanInteraction]);

  const requestMotivation = useCallback(async (reason?: string) => {
    if (!user) return;

    const contextData = {
      reason: reason || 'general_motivation',
      current_challenges: userActivity.strugglingTasks,
      journey_phase: journeyState?.current_phase
    };

    await createStefanInteraction('motivation', 'user_request', contextData);
  }, [user, userActivity, journeyState, createStefanInteraction]);

  const contextValue: StefanContextData = {
    currentPage,
    currentTask,
    currentEvent,
    userActivity,
    triggerContextualHelp,
    askStefanQuestion,
    celebrateProgress,
    requestMotivation,
    isAvailable: !stefanLoading && !!user,
    currentPersona: getCurrentPersonaInfo()?.name || 'mentor',
    showWidget,
    setShowWidget
  };

  return (
    <StefanContext.Provider value={contextValue}>
      {children}
    </StefanContext.Provider>
  );
};

export const useStefanContext = () => {
  const context = useContext(StefanContext);
  if (context === undefined) {
    throw new Error('useStefanContext must be used within a StefanContextProvider');
  }
  return context;
};