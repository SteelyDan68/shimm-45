/**
 * 📅 ENHANCED CALENDAR VIEW - Enterprise-grade kalenderfunktionalitet
 * SCRUM-TEAM IMPLEMENTATION: Google Calendar/Outlook-nivå med actionables-integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Grid3X3,
  List,
  Clock,
  MapPin,
  Users,
  Bell
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  event_type: 'actionable' | 'appointment' | 'deadline' | 'reminder';
  priority?: 'high' | 'medium' | 'low';
  completion_status?: string;
  pillar_key?: string;
  location?: string;
  attendees?: string[];
  color?: string;
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

interface EnhancedCalendarViewProps {
  userId: string;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date: Date) => void;
}

export const EnhancedCalendarView: React.FC<EnhancedCalendarViewProps> = ({
  userId,
  onEventClick,
  onDateClick,
  onCreateEvent
}) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);

  const loadCalendarData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Bestäm datumintervall baserat på view mode
      let startDate: Date, endDate: Date;
      
      switch (viewMode) {
        case 'month':
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
          break;
        case 'week':
          startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
          endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
          break;
        case 'day':
          startDate = currentDate;
          endDate = currentDate;
          break;
        case 'agenda':
          startDate = currentDate;
          endDate = addDays(currentDate, 30); // 30 dagar framåt för agenda
          break;
        default:
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
      }

      // Ladda actionables som calendar events
      const { data: actionables, error: actionablesError } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (actionablesError) throw actionablesError;

      // Konvertera actionables till calendar events
      const actionableEvents: CalendarEvent[] = (actionables || []).map(actionable => ({
        id: actionable.id,
        title: actionable.title,
        description: actionable.description,
        start_date: actionable.created_at,
        end_date: actionable.created_at,
        event_type: 'actionable' as const,
        priority: (actionable.priority as 'high' | 'medium' | 'low') || 'medium',
        completion_status: actionable.completion_status,
        pillar_key: actionable.pillar_key,
        color: getEventColor(actionable.pillar_key, actionable.priority, actionable.completion_status)
      }));

      // TODO: Ladda riktiga kalenderhändelser från separata events-tabeller
      // För nu använder vi bara actionables

      setEvents(actionableEvents);

    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda kalenderdata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (pillarKey?: string, priority?: string, status?: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    
    if (priority === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    
    // Pillar-specifika färger
    const pillarColors: Record<string, string> = {
      'self_care': 'bg-green-100 text-green-800 border-green-200',
      'skills': 'bg-blue-100 text-blue-800 border-blue-200',
      'talent': 'bg-purple-100 text-purple-800 border-purple-200',
      'brand': 'bg-orange-100 text-orange-800 border-orange-200',
      'economy': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'open_track': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    
    return pillarColors[pillarKey || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'agenda':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : subDays(currentDate, 7));
        break;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: sv });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
      case 'day':
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: sv });
      case 'agenda':
        return 'Kommande 30 dagar';
      default:
        return '';
    }
  };

  const filteredEvents = useMemo(() => {
    if (selectedFilters.includes('all')) return events;
    
    return events.filter(event => {
      if (selectedFilters.includes('actionables') && event.event_type === 'actionable') return true;
      if (selectedFilters.includes('high-priority') && event.priority === 'high') return true;
      if (selectedFilters.includes('completed') && event.completion_status === 'completed') return true;
      if (selectedFilters.includes('overdue') && event.completion_status === 'overdue') return true;
      return false;
    });
  }, [events, selectedFilters]);

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-medium text-muted-foreground bg-muted/50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map(day => {
          const dayEvents = filteredEvents.filter(event => 
            isSameDay(new Date(event.start_date), day)
          );
          
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isTodayDay = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-1 border border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                isCurrentMonth ? 'bg-background' : 'bg-muted/20 text-muted-foreground'
              } ${isTodayDay ? 'ring-2 ring-primary' : ''}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className={`text-sm font-medium mb-1 ${isTodayDay ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${event.color}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    {event.event_type === 'actionable' && (
                      <div className="text-xs opacity-75">
                        {event.completion_status === 'completed' ? '✓' : '○'}
                      </div>
                    )}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} mer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-4 text-center border rounded-lg">
              <div className="font-medium">{format(day, 'EEE', { locale: sv })}</div>
              <div className={`text-2xl ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week events */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const dayEvents = filteredEvents.filter(event => 
              isSameDay(new Date(event.start_date), day)
            );
            
            return (
              <div key={day.toISOString()} className="min-h-[300px] border rounded-lg p-2 space-y-2">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${event.color}`}
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    {event.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {event.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = filteredEvents.filter(event => 
      isSameDay(new Date(event.start_date), currentDate)
    );

    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-bold">{format(currentDate, 'EEEE', { locale: sv })}</h2>
          <p className="text-lg text-muted-foreground">{format(currentDate, 'd MMMM yyyy', { locale: sv })}</p>
        </div>
        
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Inga händelser denna dag</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => onCreateEvent?.(currentDate)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa händelse
                </Button>
              </CardContent>
            </Card>
          ) : (
            dayEvents.map(event => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onEventClick?.(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={event.color}>
                          {event.event_type}
                        </Badge>
                        {event.priority && (
                          <Badge variant={event.priority === 'high' ? 'destructive' : 'secondary'}>
                            {event.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {event.completion_status && (
                      <div className="text-2xl">
                        {event.completion_status === 'completed' ? '✅' : '⏳'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const groupedEvents = filteredEvents.reduce((groups, event) => {
      const date = format(new Date(event.start_date), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
      return groups;
    }, {} as Record<string, CalendarEvent[]>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedEvents).map(([date, events]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(new Date(date), 'EEEE d MMMM', { locale: sv })}
                {isToday(new Date(date)) && (
                  <Badge variant="outline" className="ml-2">Idag</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded border cursor-pointer hover:shadow-sm transition-shadow ${event.color}`}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {event.priority && (
                        <Badge variant={event.priority === 'high' ? 'destructive' : 'secondary'}>
                          {event.priority}
                        </Badge>
                      )}
                      {event.completion_status === 'completed' && <span className="text-green-600">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        
        {Object.keys(groupedEvents).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Inga kommande händelser</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadCalendarData();
  }, [userId, viewMode, currentDate]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Laddar kalender...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[250px] text-center">
                {getViewTitle()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Månad</SelectItem>
                  <SelectItem value="week">Vecka</SelectItem>
                  <SelectItem value="day">Dag</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filter */}
              <Select value={selectedFilters[0]} onValueChange={(value) => setSelectedFilters([value])}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla händelser</SelectItem>
                  <SelectItem value="actionables">Uppgifter</SelectItem>
                  <SelectItem value="high-priority">Hög prioritet</SelectItem>
                  <SelectItem value="completed">Slutförda</SelectItem>
                  <SelectItem value="overdue">Förfallna</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="sm" onClick={() => setCurrentDate(new Date())}>
                Idag
              </Button>
              
              <Button size="sm" onClick={() => onCreateEvent?.(currentDate)}>
                <Plus className="w-4 h-4 mr-1" />
                Ny
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-6">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'agenda' && renderAgendaView()}
        </CardContent>
      </Card>

      {/* Event Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sammanfattning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{filteredEvents.length}</div>
              <div className="text-sm text-muted-foreground">Totala händelser</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredEvents.filter(e => e.completion_status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Slutförda</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {filteredEvents.filter(e => e.priority === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">Hög prioritet</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {filteredEvents.filter(e => e.completion_status === 'overdue').length}
              </div>
              <div className="text-sm text-muted-foreground">Förfallna</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCalendarView;