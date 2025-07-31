import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContextualReminder } from '@/types/habitFormation';

interface ReminderContext {
  timeOfDay: string;
  dayOfWeek: string;
  mood?: number;
  location?: string;
  recentActivity?: string;
  weatherCondition?: string;
  stress_level?: number;
}

export const useContextualReminders = (clientId?: string) => {
  const [reminders, setReminders] = useState<ContextualReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Create context-aware reminder
  const createReminder = useCallback(async (
    habitId: string,
    reminderType: ContextualReminder['reminder_type'],
    triggerCondition: Record<string, any>,
    messageTemplate: string
  ): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const newReminder: ContextualReminder = {
        id: `reminder_${Date.now()}`,
        client_id: clientId,
        habit_id: habitId,
        reminder_type: reminderType,
        trigger_condition: triggerCondition,
        message_template: messageTemplate,
        effectiveness_score: 0.5, // Default starting score
        last_triggered: '',
        success_rate: 0,
        created_at: new Date().toISOString()
      };

      // Store in database as path entry
      const { error } = await supabase
        .from('path_entries')
        .insert({
          client_id: clientId,
          type: 'system',
          title: `🔔 Kontextuell påminnelse skapad`,
          details: `${reminderType} - ${messageTemplate.substring(0, 50)}...`,
          status: 'active',
          ai_generated: true,
          created_by: 'system',
          visible_to_client: false,
          metadata: {
            reminder_data: newReminder as any,
            is_reminder: true,
            reminder_id: newReminder.id
          }
        });

      if (error) throw error;

      setReminders(prev => [...prev, newReminder]);
      return true;
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      return false;
    }
  }, [clientId]);

  // Check if any reminders should trigger
  const checkReminderTriggers = useCallback(async (context: ReminderContext): Promise<void> => {
    if (!clientId) return;

    const activeReminders = reminders.filter(r => {
      const daysSinceLastTrigger = r.last_triggered ? 
        (Date.now() - new Date(r.last_triggered).getTime()) / (1000 * 60 * 60 * 24) : 999;
      return daysSinceLastTrigger >= 1; // Don't trigger same reminder within 24h
    });

    for (const reminder of activeReminders) {
      if (shouldTriggerReminder(reminder, context)) {
        await triggerReminder(reminder, context);
      }
    }
  }, [clientId, reminders]);

  // Trigger a specific reminder
  const triggerReminder = useCallback(async (
    reminder: ContextualReminder,
    context: ReminderContext
  ): Promise<void> => {
    try {
      // Personalize message based on context
      const personalizedMessage = personalizeMessage(reminder.message_template, context);

      // Send notification (this would integrate with actual notification system)
      toast({
        title: "Påminnelse 🔔",
        description: personalizedMessage,
        duration: 10000,
      });

      // Update reminder stats
      const updatedReminder = {
        ...reminder,
        last_triggered: new Date().toISOString()
      };

      await updateReminderInDatabase(updatedReminder);
      setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r));

      // Log reminder trigger
      await supabase
        .from('path_entries')
        .insert({
          client_id: clientId!,
          type: 'notification',
          title: `🔔 Påminnelse skickad`,
          details: personalizedMessage,
          status: 'sent',
          ai_generated: true,
          created_by: 'system',
          visible_to_client: true,
          metadata: {
            reminder_id: reminder.id,
            context: context as any,
            is_reminder_log: true
          }
        });

    } catch (error) {
      console.error('Error triggering reminder:', error);
    }
  }, [clientId, toast]);

  // Update reminder effectiveness based on user response
  const updateReminderEffectiveness = useCallback(async (
    reminderId: string,
    wasEffective: boolean
  ): Promise<void> => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const newSuccessRate = calculateNewSuccessRate(reminder, wasEffective);
    const newEffectivenessScore = calculateEffectivenessScore(reminder, wasEffective);

    const updatedReminder = {
      ...reminder,
      success_rate: newSuccessRate,
      effectiveness_score: newEffectivenessScore
    };

    await updateReminderInDatabase(updatedReminder);
    setReminders(prev => prev.map(r => r.id === reminderId ? updatedReminder : r));
  }, [reminders]);

  // Load reminders for client
  const loadReminders = useCallback(async (): Promise<void> => {
    if (!clientId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .contains('metadata', { is_reminder: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reminderData = (data || []).map(entry => {
        const metadata = entry.metadata as any;
        return metadata.reminder_data as ContextualReminder;
      });

      setReminders(reminderData);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Auto-optimize reminders based on ML patterns
  const optimizeReminders = useCallback(async (): Promise<void> => {
    if (!clientId) return;

    try {
      // Get habit completion patterns for ML analysis
      const { data: completionData } = await supabase
        .from('path_entries')
        .select('*')
        .eq('client_id', clientId)
        .contains('metadata', { is_habit_completion: true })
        .order('created_at', { ascending: false })
        .limit(100);

      // Analyze patterns and optimize reminder timing/context
      const patterns = analyzeCompletionPatterns(completionData || []);
      
      // Update reminders based on patterns
      for (const reminder of reminders) {
        if (reminder.effectiveness_score < 0.3) {
          await optimizeReminderTriggers(reminder, patterns);
        }
      }

    } catch (error) {
      console.error('Error optimizing reminders:', error);
    }
  }, [clientId, reminders]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Auto-optimize reminders weekly
  useEffect(() => {
    const interval = setInterval(optimizeReminders, 7 * 24 * 60 * 60 * 1000); // Weekly
    return () => clearInterval(interval);
  }, [optimizeReminders]);

  return {
    reminders,
    isLoading,
    createReminder,
    checkReminderTriggers,
    triggerReminder,
    updateReminderEffectiveness,
    optimizeReminders,
    refreshReminders: loadReminders
  };
};

// Helper functions
function shouldTriggerReminder(reminder: ContextualReminder, context: ReminderContext): boolean {
  const { trigger_condition } = reminder;

  switch (reminder.reminder_type) {
    case 'time_based':
      return context.timeOfDay === trigger_condition.preferred_time;
    
    case 'mood_based':
      return context.mood !== undefined && 
             context.mood >= trigger_condition.min_mood && 
             context.mood <= trigger_condition.max_mood;
    
    case 'activity_based':
      return context.recentActivity === trigger_condition.target_activity;
    
    case 'location_based':
      return context.location === trigger_condition.target_location;
    
    default:
      return false;
  }
}

function personalizeMessage(template: string, context: ReminderContext): string {
  return template
    .replace('{timeOfDay}', getTimeOfDayGreeting(context.timeOfDay))
    .replace('{mood}', getMoodAdjustment(context.mood))
    .replace('{weather}', context.weatherCondition || '')
    .replace('{location}', context.location || '');
}

function getTimeOfDayGreeting(timeOfDay: string): string {
  const hour = parseInt(timeOfDay.split(':')[0]);
  if (hour < 12) return 'God morgon';
  if (hour < 17) return 'God eftermiddag';
  return 'God kväll';
}

function getMoodAdjustment(mood?: number): string {
  if (!mood) return '';
  if (mood >= 8) return 'Du verkar vara på gott humör - perfekt för att bygga vanor!';
  if (mood >= 6) return 'En bra dag att göra framsteg med dina vanor.';
  if (mood >= 4) return 'Små steg räknas också - du klarar detta!';
  return 'Var snäll mot dig själv idag, även små insatser gör skillnad.';
}

function calculateNewSuccessRate(reminder: ContextualReminder, wasEffective: boolean): number {
  // Simple weighted average with recency bias
  const weight = 0.1; // How much new data affects the average
  return reminder.success_rate * (1 - weight) + (wasEffective ? 100 : 0) * weight;
}

function calculateEffectivenessScore(reminder: ContextualReminder, wasEffective: boolean): number {
  // ML-inspired effectiveness calculation
  const alpha = 0.2; // Learning rate
  const newScore = reminder.effectiveness_score + alpha * (wasEffective ? 1 : 0 - reminder.effectiveness_score);
  return Math.max(0, Math.min(1, newScore));
}

async function updateReminderInDatabase(reminder: ContextualReminder): Promise<void> {
  await supabase
    .from('path_entries')
    .update({
      metadata: {
        reminder_data: reminder as any,
        is_reminder: true,
        reminder_id: reminder.id
      }
    })
    .contains('metadata', { reminder_id: reminder.id });
}

function analyzeCompletionPatterns(completionData: any[]): Record<string, any> {
  // Analyze when habits are most successfully completed
  const patterns: Record<string, any> = {
    best_times: [],
    best_days: [],
    mood_correlations: {},
    contextual_factors: {}
  };

  // Extract completion times and days
  const completions = completionData.map(entry => {
    const metadata = entry.metadata as any;
    return {
      time: new Date(entry.created_at),
      quality: metadata.habit_completion?.completion_quality || 5,
      mood_before: metadata.habit_completion?.mood_before || 5
    };
  });

  // Find best completion times (simplified analysis)
  const timeFrequency: Record<string, number> = {};
  completions.forEach(completion => {
    const hour = completion.time.getHours();
    const timeSlot = `${hour}:00`;
    timeFrequency[timeSlot] = (timeFrequency[timeSlot] || 0) + completion.quality;
  });

  patterns.best_times = Object.entries(timeFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([time]) => time);

  return patterns;
}

async function optimizeReminderTriggers(reminder: ContextualReminder, patterns: Record<string, any>): Promise<void> {
  // Use patterns to optimize reminder triggers
  if (reminder.reminder_type === 'time_based' && patterns.best_times.length > 0) {
    const optimizedTrigger = {
      ...reminder.trigger_condition,
      preferred_time: patterns.best_times[0]
    };
    
    const optimizedReminder = {
      ...reminder,
      trigger_condition: optimizedTrigger
    };
    
    await updateReminderInDatabase(optimizedReminder);
  }
}