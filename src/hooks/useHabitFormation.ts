import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProgress } from '@/hooks/useProgress';
import type { 
  NeuroplasticityHabit, 
  HabitCompletion, 
  HabitAdjustment,
  SetbackEvent,
  RecoveryPlan,
  HabitAnalytics 
} from '@/types/habitFormation';

export const useHabitFormation = (clientId?: string) => {
  const [habits, setHabits] = useState<NeuroplasticityHabit[]>([]);
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);
  const [activeSetbacks, setActiveSetbacks] = useState<SetbackEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { trackActivity } = useProgress(clientId);

  // Create a new neuroplasticity-based habit
  const createHabit = useCallback(async (habitData: Omit<NeuroplasticityHabit, 'id' | 'created_at' | 'updated_at' | 'completion_history' | 'ai_adjustments' | 'current_repetitions' | 'streak_current' | 'streak_longest' | 'success_rate'>): Promise<boolean> => {
    if (!clientId) return false;

    try {
      setIsLoading(true);

      const newHabit: NeuroplasticityHabit = {
        ...habitData,
        id: `habit_${Date.now()}`,
        client_id: clientId,
        current_repetitions: 0,
        completion_history: [],
        streak_current: 0,
        streak_longest: 0,
        success_rate: 0,
        ai_adjustments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in path_entries with habit metadata
      const { error } = await supabase
        .from('path_entries')
        .insert({
          client_id: clientId,
          type: 'action',
          title: `🎯 Ny vana: ${habitData.title}`,
          details: `Neuroplasticitet-baserad vana - ${habitData.frequency} ${habitData.difficulty}`,
          content: habitData.description,
          status: 'planned',
          ai_generated: true,
          created_by: clientId,
          visible_to_client: true,
          metadata: {
            habit_data: newHabit as any,
            is_habit: true,
            habit_id: newHabit.id
          }
        });

      if (error) throw error;

      setHabits(prev => [...prev, newHabit]);
      
      // Award XP for creating habit
      await trackActivity('habit_created', 30);

      toast({
        title: "Ny vana skapad! 🎯",
        description: `${habitData.title} är nu aktiv. Kom ihåg: små steg leder till stora förändringar!`,
      });

      return true;
    } catch (error: any) {
      console.error('Error creating habit:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa vana: " + error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, trackActivity, toast]);

  // Complete a habit occurrence
  const completeHabit = useCallback(async (
    habitId: string, 
    completionData: Omit<HabitCompletion, 'id' | 'habit_id' | 'completed_at' | 'created_at'>
  ): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error('Habit not found');

      const completion: HabitCompletion = {
        id: `completion_${Date.now()}`,
        habit_id: habitId,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...completionData
      };

      // Update habit statistics
      const updatedHabit = {
        ...habit,
        current_repetitions: habit.current_repetitions + 1,
        completion_history: [...habit.completion_history, completion],
        streak_current: calculateNewStreak(habit, completion),
        success_rate: calculateSuccessRate(habit, completion),
        updated_at: new Date().toISOString()
      };

      updatedHabit.streak_longest = Math.max(updatedHabit.streak_current, habit.streak_longest);

      // Check for habit progression (neuroplasticity milestone)
      const shouldProgress = checkForProgression(updatedHabit);
      if (shouldProgress) {
        await progressHabitDifficulty(updatedHabit);
      }

      // Update in database
      await updateHabitInDatabase(updatedHabit);
      
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));

      // Award XP based on difficulty and streak
      const xpAmount = calculateHabitXP(updatedHabit, completion);
      await trackActivity('habit_completed', xpAmount);

      // Create path entry for completion
      await supabase
        .from('path_entries')
        .insert({
          client_id: clientId,
          type: 'action',
          title: `✅ ${habit.title} genomförd`,
          details: `Streak: ${updatedHabit.streak_current} | Kvalitet: ${completion.completion_quality}/10`,
          status: 'completed',
          ai_generated: false,
          created_by: clientId,
          visible_to_client: true,
          metadata: {
            habit_completion: completion as any,
            habit_id: habitId,
            is_habit_completion: true
          }
        });

      toast({
        title: `Vana genomförd! 🎉`,
        description: `${habit.title} - Streak: ${updatedHabit.streak_current} dagar (+${xpAmount} XP)`,
      });

      // Trigger AI analysis for habit optimization
      if (updatedHabit.current_repetitions % 7 === 0) { // Every week
        analyzeHabitPattern(updatedHabit);
      }

      return true;
    } catch (error: any) {
      console.error('Error completing habit:', error);
      toast({
        title: "Fel",
        description: "Kunde inte registrera vangenomförande",
        variant: "destructive"
      });
      return false;
    }
  }, [clientId, habits, trackActivity, toast]);

  // Detect and handle setbacks
  const detectSetbacks = useCallback(async (): Promise<SetbackEvent[]> => {
    if (!clientId) return [];

    const detectedSetbacks: SetbackEvent[] = [];
    const now = new Date();
    
    for (const habit of habits) {
      if (habit.status !== 'active') continue;

      const daysSinceLastCompletion = getDaysSinceLastCompletion(habit);
      const expectedFrequency = getExpectedFrequencyDays(habit.frequency);
      
      // Detect missed habits
      if (daysSinceLastCompletion > expectedFrequency * 2) {
        const setback: SetbackEvent = {
          id: `setback_${Date.now()}_${habit.id}`,
          client_id: clientId,
          habit_id: habit.id,
          setback_type: daysSinceLastCompletion > expectedFrequency * 4 ? 'low_motivation' : 'missed_days',
          severity: daysSinceLastCompletion > expectedFrequency * 7 ? 'major' : 
                   daysSinceLastCompletion > expectedFrequency * 4 ? 'moderate' : 'minor',
          detected_at: now.toISOString(),
          context: {
            days_missed: daysSinceLastCompletion,
            habit_title: habit.title,
            previous_streak: habit.streak_current,
            success_rate: habit.success_rate
          }
        };
        
        detectedSetbacks.push(setback);
      }
    }

    if (detectedSetbacks.length > 0) {
      setActiveSetbacks(prev => [...prev, ...detectedSetbacks]);
      
      // Generate recovery plans
      for (const setback of detectedSetbacks) {
        await generateRecoveryPlan(setback);
      }
    }

    return detectedSetbacks;
  }, [clientId, habits]);

  // Generate AI-driven recovery plan
  const generateRecoveryPlan = useCallback(async (setback: SetbackEvent): Promise<void> => {
    try {
      const { data, error } = await supabase.functions.invoke('habit-recovery-planner', {
        body: {
          client_id: clientId,
          setback_event: setback,
          habit_context: habits.find(h => h.id === setback.habit_id)
        }
      });

      if (error) {
        console.error('Error generating recovery plan:', error);
        return;
      }

      toast({
        title: "Återhämtningsplan skapad 🔄",
        description: "Stefan har skapat en plan för att komma tillbaka på rätt spår.",
      });

    } catch (error) {
      console.error('Error in recovery plan generation:', error);
    }
  }, [clientId, habits, toast]);

  // Load user's habits
  const loadHabits = useCallback(async (): Promise<void> => {
    if (!clientId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .contains('metadata', { is_habit: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitData = (data || []).map(entry => {
        const metadata = entry.metadata as any;
        return metadata.habit_data as NeuroplasticityHabit;
      });

      setHabits(habitData);
      
      // Check for setbacks
      setTimeout(detectSetbacks, 1000);
      
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda vanor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, detectSetbacks, toast]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  return {
    habits,
    analytics,
    activeSetbacks,
    isLoading,
    createHabit,
    completeHabit,
    detectSetbacks,
    generateRecoveryPlan,
    refreshHabits: loadHabits
  };
};

// Helper functions
function calculateNewStreak(habit: NeuroplasticityHabit, completion: HabitCompletion): number {
  const now = new Date();
  const lastCompletion = habit.completion_history[habit.completion_history.length - 1];
  
  if (!lastCompletion) return 1;
  
  const daysBetween = Math.floor(
    (now.getTime() - new Date(lastCompletion.completed_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const expectedFrequency = getExpectedFrequencyDays(habit.frequency);
  
  return daysBetween <= expectedFrequency * 1.5 ? habit.streak_current + 1 : 1;
}

function calculateSuccessRate(habit: NeuroplasticityHabit, newCompletion: HabitCompletion): number {
  const allCompletions = [...habit.completion_history, newCompletion];
  const last30Days = allCompletions.filter(c => {
    const daysSince = (Date.now() - new Date(c.completed_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });
  
  const expectedCompletions = Math.floor(30 / getExpectedFrequencyDays(habit.frequency));
  return Math.min((last30Days.length / expectedCompletions) * 100, 100);
}

function checkForProgression(habit: NeuroplasticityHabit): boolean {
  const { success_threshold } = habit.progression_rules;
  return habit.streak_current >= success_threshold && habit.success_rate >= 80;
}

async function progressHabitDifficulty(habit: NeuroplasticityHabit): Promise<void> {
  // Implementation for increasing habit difficulty based on neuroplasticity principles
  // This would call an AI function to suggest the next level
}

async function updateHabitInDatabase(habit: NeuroplasticityHabit): Promise<void> {
  // Update the path_entry with new habit data
  await supabase
    .from('path_entries')
    .update({
      metadata: {
        habit_data: habit as any,
        is_habit: true,
        habit_id: habit.id
      }
    })
    .contains('metadata', { habit_id: habit.id });
}

function calculateHabitXP(habit: NeuroplasticityHabit, completion: HabitCompletion): number {
  const baseXP = {
    micro: 10,
    small: 15,
    medium: 25,
    large: 40,
    challenging: 60
  }[habit.difficulty];
  
  const streakMultiplier = Math.min(1 + (habit.streak_current * 0.1), 3);
  const qualityMultiplier = completion.completion_quality / 10;
  
  return Math.round(baseXP * streakMultiplier * qualityMultiplier);
}

function getDaysSinceLastCompletion(habit: NeuroplasticityHabit): number {
  if (habit.completion_history.length === 0) return 999;
  
  const lastCompletion = habit.completion_history[habit.completion_history.length - 1];
  return Math.floor((Date.now() - new Date(lastCompletion.completed_at).getTime()) / (1000 * 60 * 60 * 24));
}

function getExpectedFrequencyDays(frequency: string): number {
  switch (frequency) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    default: return 1;
  }
}

async function analyzeHabitPattern(habit: NeuroplasticityHabit): Promise<void> {
  // Trigger AI analysis of habit patterns for optimization
  await supabase.functions.invoke('habit-pattern-analyzer', {
    body: {
      habit_data: habit,
      analysis_type: 'weekly_review'
    }
  });
}