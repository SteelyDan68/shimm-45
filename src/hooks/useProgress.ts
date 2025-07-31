import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserProgress, Achievement, UserAchievement, ProgressAnalytics } from '@/types/gamification';

export const useProgress = (clientId?: string) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize user progress if it doesn't exist
  const initializeProgress = useCallback(async (clientId: string): Promise<UserProgress> => {
    const initialProgress = {
      client_id: clientId,
      current_xp: 0,
      current_level: 1,
      xp_to_next_level: 100,
      total_sessions_completed: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      last_activity_date: new Date().toISOString().split('T')[0],
      weekly_goal_progress: 0,
      monthly_goal_progress: 0
    };

    // Store in custom_fields for now (later we'll create proper table)
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        preferences: { progress_data: initialProgress }
      })
      .eq('id', clientId)
      .select('preferences')
      .single();

    if (error) throw error;

    return (data.preferences as any)?.progress_data as UserProgress;
  }, []);

  // Load user progress
  const loadProgress = useCallback(async () => {
    if (!clientId) return;

    try {
      setIsLoading(true);
      
      // Get progress from client custom_fields for now
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      let progressData = (data?.preferences as any)?.progress_data as UserProgress;
      
      if (!progressData) {
        progressData = await initializeProgress(clientId);
      }

      setProgress(progressData);
    } catch (error: any) {
      console.error('Error loading progress:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda framstegsdata",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, initializeProgress, toast]);

  // Award XP and check for level ups
  const awardXP = useCallback(async (amount: number, reason: string): Promise<boolean> => {
    if (!clientId || !progress) return false;

    try {
      const newXP = progress.current_xp + amount;
      let newLevel = progress.current_level;
      let xpToNext = progress.xp_to_next_level - amount;

      // Check for level up (basic formula: level * 100 XP per level)
      while (xpToNext <= 0) {
        newLevel++;
        xpToNext = (newLevel * 100) + xpToNext;
        
        // Level up toast
        toast({
          title: "🎉 Level Up!",
          description: `Du har nått nivå ${newLevel}! Fortsätt så här!`,
        });
      }

      const updatedProgress = {
        ...progress,
        current_xp: newXP,
        current_level: newLevel,
        xp_to_next_level: xpToNext,
        last_activity_date: new Date().toISOString().split('T')[0]
      };

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: { progress_data: updatedProgress } })
        .eq('id', clientId);

      if (error) throw error;

      setProgress(updatedProgress);

      // Log XP award
      await supabase
        .from('path_entries')
        .insert({
          client_id: clientId,
          type: 'action',
          title: `+${amount} XP: ${reason}`,
          details: `Totalt XP: ${newXP} | Nivå: ${newLevel}`,
          status: 'completed',
          ai_generated: true,
          created_by: clientId,
          visible_to_client: true,
          metadata: {
            xp_awarded: amount,
            reason,
            new_total_xp: newXP,
            new_level: newLevel
          }
        });

      return true;
    } catch (error: any) {
      console.error('Error awarding XP:', error);
      toast({
        title: "Fel",
        description: "Kunde inte tilldela XP",
        variant: "destructive"
      });
      return false;
    }
  }, [clientId, progress, toast]);

  // Update streak
  const updateStreak = useCallback(async (): Promise<boolean> => {
    if (!clientId || !progress) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let newStreak = progress.current_streak_days;
      
      if (progress.last_activity_date === yesterday) {
        // Consecutive day - increment streak
        newStreak = progress.current_streak_days + 1;
      } else if (progress.last_activity_date !== today) {
        // Gap in activity - reset streak
        newStreak = 1;
      }
      // If last_activity_date is today, streak remains same

      const updatedProgress = {
        ...progress,
        current_streak_days: newStreak,
        longest_streak_days: Math.max(newStreak, progress.longest_streak_days),
        last_activity_date: today
      };

      // Award streak bonus XP
      if (newStreak > progress.current_streak_days) {
        const streakBonus = Math.min(newStreak * 5, 50); // Max 50 XP streak bonus
        updatedProgress.current_xp += streakBonus;
        
        toast({
          title: `🔥 ${newStreak} dagars streak!`,
          description: `+${streakBonus} bonus XP för din konsistens!`,
        });
      }

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: { progress_data: updatedProgress } })
        .eq('id', clientId);

      if (error) throw error;

      setProgress(updatedProgress);
      return true;
    } catch (error: any) {
      console.error('Error updating streak:', error);
      return false;
    }
  }, [clientId, progress, toast]);

  // Check and award achievements
  const checkAchievements = useCallback(async (): Promise<UserAchievement[]> => {
    if (!clientId || !progress) return [];

    const newAchievements: UserAchievement[] = [];

    // Define built-in achievements
    const achievementChecks = [
      {
        key: 'first_assessment',
        name: 'Första steget',
        description: 'Genomförde din första självskattning',
        condition: () => progress.total_sessions_completed >= 1,
        xp: 50
      },
      {
        key: 'week_streak',
        name: 'Veckohjälte',
        description: '7 dagar i rad av utvecklingsaktivitet',
        condition: () => progress.current_streak_days >= 7,
        xp: 100
      },
      {
        key: 'level_5',
        name: 'Utvecklingsresenär',
        description: 'Nådde nivå 5',
        condition: () => progress.current_level >= 5,
        xp: 150
      },
      {
        key: 'month_streak',
        name: 'Månadsmaestro',
        description: '30 dagar i rad av utvecklingsaktivitet',
        condition: () => progress.current_streak_days >= 30,
        xp: 300
      }
    ];

    for (const check of achievementChecks) {
      // Check if already earned
      const alreadyEarned = userAchievements.some(ua => ua.achievement_key === check.key);
      
      if (!alreadyEarned && check.condition()) {
        const achievement: UserAchievement = {
          id: `achievement_${Date.now()}_${check.key}`,
          client_id: clientId,
          achievement_id: check.key,
          achievement_key: check.key,
          earned_at: new Date().toISOString(),
          xp_earned: check.xp,
          celebrated: false,
          created_at: new Date().toISOString()
        };

        newAchievements.push(achievement);

        // Award XP for achievement
        await awardXP(check.xp, `Prestationsutmärkelse: ${check.name}`);

        toast({
          title: "🏆 Prestationsutmärkelse låst upp!",
          description: `${check.name}: ${check.description}`,
        });
      }
    }

    if (newAchievements.length > 0) {
      setUserAchievements(prev => [...prev, ...newAchievements]);
    }

    return newAchievements;
  }, [clientId, progress, userAchievements, awardXP, toast]);

  // Activity tracking - call this whenever user does something
  const trackActivity = useCallback(async (activityType: string, xpAmount: number = 10) => {
    if (!clientId) return;

    try {
      await updateStreak();
      await awardXP(xpAmount, activityType);
      await checkAchievements();
      
      // Update session count for certain activities
      if (['assessment_completed', 'check_in_completed'].includes(activityType)) {
        const updatedProgress = {
          ...progress!,
          total_sessions_completed: progress!.total_sessions_completed + 1
        };
        
        await supabase
          .from('profiles')
          .update({ preferences: { progress_data: updatedProgress } })
          .eq('id', clientId);
        
        setProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [clientId, updateStreak, awardXP, checkAchievements, progress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    achievements,
    userAchievements,
    isLoading,
    awardXP,
    updateStreak,
    trackActivity,
    checkAchievements,
    refreshProgress: loadProgress
  };
};