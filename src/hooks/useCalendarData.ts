import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, isPast, isFuture } from 'date-fns';

export interface CalendarEventData {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'task' | 'assessment' | 'path_entry' | 'custom_event';
  category?: string;
  pillar_type?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: string;
  user_id?: string;
  duration?: number;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  created_by_role?: string;
  metadata?: Record<string, any>;
}

interface UseCalendarDataProps {
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const useCalendarData = ({ userId, dateRange }: UseCalendarDataProps = {}) => {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadEvents = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Build queries with optional date filtering
      let eventsQuery = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true });

      if (dateRange) {
        eventsQuery = eventsQuery
          .gte('event_date', dateRange.start.toISOString())
          .lte('event_date', dateRange.end.toISOString());
        
        tasksQuery = tasksQuery
          .gte('deadline', dateRange.start.toISOString())
          .lte('deadline', dateRange.end.toISOString());
      }

      const [eventsResponse, tasksResponse] = await Promise.all([
        eventsQuery.abortSignal(controller.signal),
        tasksQuery.abortSignal(controller.signal)
      ]);

      clearTimeout(timeoutId);

      if (eventsResponse.error) throw eventsResponse.error;
      if (tasksResponse.error) console.warn('Tasks loading failed:', tasksResponse.error);

      // Transform calendar events
      const calendarEvents: CalendarEventData[] = (eventsResponse.data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.event_date),
        type: 'custom_event',
        category: event.category,
        user_id: event.user_id,
        metadata: event
      }));

      // Transform tasks to calendar events
      const taskEvents: CalendarEventData[] = (tasksResponse.data || []).map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        description: task.description,
        date: new Date(task.deadline),
        type: 'task',
        priority: task.priority as 'low' | 'medium' | 'high',
        status: task.status,
        user_id: task.user_id,
        isOverdue: isPast(new Date(task.deadline)) && task.status !== 'completed',
        isDueSoon: isFuture(new Date(task.deadline)) && 
                   new Date(task.deadline) <= addDays(new Date(), 2),
        metadata: task
      }));

      setEvents([...calendarEvents, ...taskEvents]);

    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' 
        ? 'Request timeout - please try again'
        : err.message || 'Failed to load calendar data';
      
      setError(errorMessage);
      setEvents([]);
      
      console.error('Calendar data loading failed:', err);
      
      if (err.name !== 'AbortError') {
        toast({
          title: "Kalenderdata kunde inte laddas",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange?.start?.toISOString(), dateRange?.end?.toISOString(), toast]);

  useEffect(() => {
    const debounceId = setTimeout(loadEvents, 150);
    return () => clearTimeout(debounceId);
  }, [loadEvents]);

  const refetch = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refetch
  };
};