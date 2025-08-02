import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  Phone,
  Coffee,
  Plus,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, 
         isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  category: string;
  created_by: string;
  created_by_role: string;
  visible_to_client: boolean;
  user_id?: string;
}

interface CalendarViewProps {
  onCreateEvent?: (date?: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ onCreateEvent, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coaching': return <Users className="h-3 w-3" />;
      case 'video_call': return <Video className="h-3 w-3" />;
      case 'phone_call': return <Phone className="h-3 w-3" />;
      case 'coffee_meeting': return <Coffee className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coaching': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'video_call': return 'bg-green-100 text-green-800 border-green-200';
      case 'phone_call': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'coffee_meeting': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', monthStart.toISOString())
        .lte('event_date', monthEnd.toISOString())
        .order('event_date', { ascending: true });

      // Filter based on user role and permissions
      if (hasRole('client')) {
        // Clients see only their own events or events visible to clients
        query = query.or(`user_id.eq.${user?.id},and(visible_to_client.eq.true,user_id.eq.${user?.id})`);
      } else if (hasRole('coach')) {
        // Coaches see events they created or events for their clients
        query = query.or(`created_by.eq.${user?.id},created_by_role.eq.coach`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda kalenderhändelser",
          variant: "destructive"
        });
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error in loadEvents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate, user]);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.event_date), date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const filteredEvents = events.filter(event => {
    if (filterRole === 'all') return true;
    return event.created_by_role === filterRole;
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-semibold min-w-[180px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: sv })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Idag
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {(hasRole('admin') || hasRole('superadmin') || hasRole('coach')) && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">Alla roller</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          <Button
            onClick={() => onCreateEvent?.(new Date())}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nytt möte
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Laddar kalender...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map(day => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-1 border border-gray-100 relative cursor-pointer
                      hover:bg-gray-50 transition-colors
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                    `}
                    onClick={() => onCreateEvent?.(day)}
                  >
                    <div className={`
                      text-sm font-medium p-1 rounded
                      ${isTodayDate ? 'bg-blue-600 text-white' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>

                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`
                            text-xs p-1 rounded border cursor-pointer
                            hover:shadow-sm transition-shadow
                            ${getCategoryColor(event.category)}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(event.category)}
                            <span className="truncate">
                              {format(new Date(event.event_date), 'HH:mm')} {event.title}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground p-1">
                          +{dayEvents.length - 2} fler
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Händelser denna månad ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Inga händelser denna månad
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(event.category)}
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.event_date), 'dd MMM, HH:mm', { locale: sv })}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={getCategoryColor(event.category)}>
                    {event.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}