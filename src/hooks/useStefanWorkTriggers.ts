import { useEffect, useCallback } from 'react';
import { useStefanContext } from '@/providers/StefanContextProvider';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that monitors work-related activities and triggers Stefan interventions
 */
export const useStefanWorkTriggers = () => {
  const { user } = useAuth();
  const { triggerContextualHelp, celebrateProgress } = useStefanContext();
  const { tasks } = useTasks();

  // Monitor task completion patterns
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const completedToday = tasks.filter(task => 
      task.status === 'completed' && 
      new Date(task.updated_at || task.created_at).toDateString() === new Date().toDateString()
    );

    // Celebrate multiple completions
    if (completedToday.length >= 3) {
      celebrateProgress('daily_productivity_burst', {
        completed_count: completedToday.length,
        date: new Date().toISOString()
      });
    }

    // Check for stalled tasks
    const stalledTasks = tasks.filter(task => 
      task.status === 'in_progress' && 
      new Date(task.updated_at || task.created_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    );

    if (stalledTasks.length > 0) {
      triggerContextualHelp('stalled_tasks_reminder', {
        stalled_count: stalledTasks.length,
        task_titles: stalledTasks.map(t => t.title)
      });
    }
  }, [tasks, celebrateProgress, triggerContextualHelp]);

  // Monitor calendar engagement
  useEffect(() => {
    if (!user) return;

    const checkCalendarEngagement = async () => {
      try {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const { data: recentEvents } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('event_date', weekAgo.toISOString())
          .lte('event_date', today.toISOString());

        // Low calendar engagement
        if (!recentEvents || recentEvents.length === 0) {
          triggerContextualHelp('low_calendar_engagement', {
            period: 'week',
            suggestion: 'schedule_planning_session'
          });
        }

        // High calendar engagement
        if (recentEvents && recentEvents.length >= 5) {
          triggerContextualHelp('high_calendar_engagement', {
            events_count: recentEvents.length,
            period: 'week'
          });
        }
      } catch (error) {
        console.error('Error checking calendar engagement:', error);
      }
    };

    // Check once when component mounts, then every hour
    checkCalendarEngagement();
    const interval = setInterval(checkCalendarEngagement, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, triggerContextualHelp]);

  // Monitor inactivity periods
  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        triggerContextualHelp('inactivity_check', {
          inactive_duration: '30_minutes',
          current_page: window.location.pathname
        });
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Listen for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });

    // Start timer
    resetActivityTimer();

    return () => {
      clearTimeout(activityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [triggerContextualHelp]);

  // Weekly progress check
  useEffect(() => {
    if (!user) return;

    const checkWeeklyProgress = async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Check task completion rate
        const { data: weeklyTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString());

        if (weeklyTasks && weeklyTasks.length > 0) {
          const completedTasks = weeklyTasks.filter(task => task.status === 'completed');
          const completionRate = completedTasks.length / weeklyTasks.length;

          if (completionRate >= 0.8) {
            celebrateProgress('weekly_excellence', {
              completion_rate: completionRate,
              total_tasks: weeklyTasks.length,
              completed_tasks: completedTasks.length
            });
          } else if (completionRate <= 0.3) {
            triggerContextualHelp('weekly_struggle', {
              completion_rate: completionRate,
              total_tasks: weeklyTasks.length,
              completed_tasks: completedTasks.length
            });
          }
        }

        // Check Stefan interaction frequency
        const { data: stefanInteractions } = await supabase
          .from('stefan_interactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString());

        if (!stefanInteractions || stefanInteractions.length === 0) {
          triggerContextualHelp('stefan_reconnect', {
            last_interaction: 'over_week_ago',
            suggestion: 'check_in'
          });
        }

      } catch (error) {
        console.error('Error checking weekly progress:', error);
      }
    };

    // Check weekly progress every Monday at 9 AM
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
    nextMonday.setHours(9, 0, 0, 0);

    const timeToNextCheck = nextMonday.getTime() - now.getTime();
    const weeklyTimer = setTimeout(() => {
      checkWeeklyProgress();
      // Then set up weekly recurring checks
      setInterval(checkWeeklyProgress, 7 * 24 * 60 * 60 * 1000);
    }, timeToNextCheck);

    return () => clearTimeout(weeklyTimer);
  }, [user, celebrateProgress, triggerContextualHelp]);

  return {
    // Export any utility functions if needed
    manualTrigger: useCallback((context: string, data?: any) => {
      triggerContextualHelp(context, data);
    }, [triggerContextualHelp])
  };
};