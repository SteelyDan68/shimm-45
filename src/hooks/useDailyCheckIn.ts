import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProgress } from '@/hooks/useProgress';
import type { DailyCheckIn } from '@/types/gamification';

export const useDailyCheckIn = (clientId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [todaysCheckIn, setTodaysCheckIn] = useState<DailyCheckIn | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<DailyCheckIn[]>([]);
  const { trackActivity } = useProgress(clientId);
  const { toast } = useToast();

  // Check if user has done today's check-in
  const checkTodaysStatus = useCallback(async (): Promise<DailyCheckIn | null> => {
    if (!clientId) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Look for today's check-in in path_entries with daily_check_in type
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', clientId)
        .eq('type', 'check-in')
        .gte('timestamp', `${today}T00:00:00.000Z`)
        .lte('timestamp', `${today}T23:59:59.999Z`)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const checkInData = data[0].metadata as unknown as DailyCheckIn;
        setTodaysCheckIn(checkInData);
        return checkInData;
      }

      return null;
    } catch (error) {
      console.error('Error checking today\'s status:', error);
      return null;
    }
  }, [clientId]);

  // Submit daily check-in
  const submitCheckIn = useCallback(async (checkInData: Omit<DailyCheckIn, 'id' | 'user_id' | 'completed_at' | 'xp_earned' | 'streak_maintained' | 'created_at'>): Promise<boolean> => {
    if (!clientId) return false;

    try {
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Check if already checked in today
      const existingCheckIn = await checkTodaysStatus();
      if (existingCheckIn) {
        toast({
          title: "Du har redan checkat in idag",
          description: "Kom tillbaka imorgon för nästa check-in!",
        });
        return false;
      }

      const fullCheckIn: DailyCheckIn = {
        id: `checkin_${Date.now()}`,
        user_id: clientId,
        date: today,
        completed_at: now,
        xp_earned: 25,
        streak_maintained: true,
        created_at: now,
        ...checkInData
      };

      // Create path entry for the check-in
      const { error: pathError } = await supabase
        .from('path_entries')
        .insert({
          user_id: clientId,
          type: 'check-in',
          title: `Daglig check-in - ${new Date().toLocaleDateString('sv-SE')}`,
          details: `Humör: ${checkInData.mood_score}/10 | Energi: ${checkInData.energy_level}/10 | Fokus: ${checkInData.pillar_focus}`,
          content: checkInData.reflection_notes || checkInData.daily_intention,
          status: 'completed',
          ai_generated: false,
          created_by: clientId,
          visible_to_client: true,
          timestamp: now,
          metadata: fullCheckIn as any
        });

      if (pathError) throw pathError;

      setTodaysCheckIn(fullCheckIn);
      
      // Award XP for check-in
      await trackActivity('check_in_completed', 25);

      // Trigger AI coaching response based on check-in
      await supabase.functions.invoke('proactive-coaching-scheduler', {
        body: {
          user_id: clientId,
          trigger_event: 'daily_check_in',
          check_in_data: fullCheckIn
        }
      });

      toast({
        title: "Check-in genomförd! 🌟",
        description: "Du fick 25 XP! Stefan kommer att analysera din check-in.",
      });

      return true;
    } catch (error: any) {
      console.error('Error submitting check-in:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara din check-in: " + error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, trackActivity, toast, checkTodaysStatus]);

  // Get check-in history
  const getCheckInHistory = useCallback(async (days: number = 30): Promise<DailyCheckIn[]> => {
    if (!clientId) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', clientId)
        .eq('type', 'check-in')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const history = (data || []).map(entry => entry.metadata as unknown as DailyCheckIn);
      setCheckInHistory(history);
      return history;
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      return [];
    }
  }, [clientId]);

  // Get check-in trends
  const getCheckInTrends = useCallback(async (days: number = 7): Promise<{
    mood_trend: number;
    energy_trend: number;
    stress_trend: number;
    motivation_trend: number;
    most_focused_pillar: string;
  }> => {
    const history = await getCheckInHistory(days);
    
    if (history.length === 0) {
      return {
        mood_trend: 0,
        energy_trend: 0,
        stress_trend: 0,
        motivation_trend: 0,
        most_focused_pillar: 'self_care'
      };
    }

    const recent = history.slice(0, Math.ceil(days / 2));
    const older = history.slice(Math.ceil(days / 2));

    const calculateAverage = (items: DailyCheckIn[], field: keyof DailyCheckIn) => {
      const values = items.map(item => item[field] as number).filter(v => typeof v === 'number');
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const recentMood = calculateAverage(recent, 'mood_score');
    const olderMood = calculateAverage(older, 'mood_score');

    const pillarCounts: Record<string, number> = {};
    history.forEach(checkIn => {
      pillarCounts[checkIn.pillar_focus] = (pillarCounts[checkIn.pillar_focus] || 0) + 1;
    });
    
    const mostFocusedPillar = Object.entries(pillarCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'self_care';

    return {
      mood_trend: recentMood - olderMood,
      energy_trend: calculateAverage(recent, 'energy_level') - calculateAverage(older, 'energy_level'),
      stress_trend: calculateAverage(recent, 'stress_level') - calculateAverage(older, 'stress_level'),
      motivation_trend: calculateAverage(recent, 'motivation_level') - calculateAverage(older, 'motivation_level'),
      most_focused_pillar: mostFocusedPillar
    };
  }, [getCheckInHistory]);

  return {
    isLoading,
    todaysCheckIn,
    checkInHistory,
    submitCheckIn,
    checkTodaysStatus,
    getCheckInHistory,
    getCheckInTrends
  };
};