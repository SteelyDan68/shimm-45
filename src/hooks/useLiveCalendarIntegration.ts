import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventDate: Date;
  category: string;
  createdBy: string;
  createdByRole: string;
  visibleToClient: boolean;
}

export const useLiveCalendarIntegration = (userId: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadCalendarEvents = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (error) throw error;

      const formattedEvents = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: new Date(event.event_date),
        category: event.category,
        createdBy: event.created_by,
        createdByRole: event.created_by_role,
        visibleToClient: event.visible_to_client
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda kalenderhändelser",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCalendarEvent = async (
    title: string,
    date: Date,
    time?: string,
    description?: string,
    category: string = 'development'
  ) => {
    try {
      // Combine date and time if provided
      let eventDate = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title,
          description,
          event_date: eventDate.toISOString(),
          category,
          created_by: userId,
          created_by_role: 'client',
          visible_to_client: true
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent: CalendarEvent = {
        id: data.id,
        title: data.title,
        description: data.description,
        eventDate: new Date(data.event_date),
        category: data.category,
        createdBy: data.created_by,
        createdByRole: data.created_by_role,
        visibleToClient: data.visible_to_client
      };

      setEvents(prev => [...prev, newEvent].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()));

      toast({
        title: "📅 Kalenderhändelse skapad!",
        description: `"${title}" schemalagd för ${eventDate.toLocaleDateString('sv-SE')}${time ? ` kl ${time}` : ''}`,
      });

      return newEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa kalenderhändelse",
        variant: "destructive"
      });
      return null;
    }
  };

  const scheduleActionableToCalendar = async (actionableId: string, actionableTitle: string, date: Date, time?: string) => {
    try {
      // First mark the actionable as scheduled in calendar_actionables
      const { error: actionableError } = await supabase
        .from('calendar_actionables')
        .update({
          scheduled_date: time ? 
            `${date.toISOString().split('T')[0]}T${time}:00.000Z` : 
            date.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', actionableId);

      if (actionableError) throw actionableError;

      // Then create a calendar event
      const calendarEvent = await createCalendarEvent(
        actionableTitle,
        date,
        time,
        `Actionable schemalagd från utvecklingsplan`,
        'actionable'
      );

      if (calendarEvent) {
        toast({
          title: "✅ Schemalagt i kalendern!",
          description: `"${actionableTitle}" är nu planerat för ${date.toLocaleDateString('sv-SE')}${time ? ` kl ${time}` : ''}`,
        });
      }

      return calendarEvent;
    } catch (error) {
      console.error('Error scheduling actionable to calendar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte schemalägga actionable i kalendern",
        variant: "destructive"
      });
      return null;
    }
  };

  const getUpcomingEvents = (days: number = 7): CalendarEvent[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return events.filter(event => 
      event.eventDate >= now && event.eventDate <= futureDate
    );
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return events.filter(event => {
      const eventDate = new Date(event.eventDate.getFullYear(), event.eventDate.getMonth(), event.eventDate.getDate());
      return eventDate.getTime() === targetDate.getTime();
    });
  };

  const deleteCalendarEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));

      toast({
        title: "🗑️ Händelse borttagen",
        description: "Kalenderhändelsen har tagits bort",
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort kalenderhändelse",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadCalendarEvents();
  }, [userId]);

  return {
    events,
    isLoading,
    createCalendarEvent,
    scheduleActionableToCalendar,
    getUpcomingEvents,
    getEventsForDate,
    deleteCalendarEvent,
    refetch: loadCalendarEvents
  };
};