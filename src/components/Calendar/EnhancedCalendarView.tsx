import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Target,
  Brain,
  Plus,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time?: string;
  priority: 'high' | 'medium' | 'low';
  completion_status: string;
  ai_generated: boolean;
  estimated_duration: number;
  category?: string;
}

interface EnhancedCalendarViewProps {
  userId: string;
}

export const EnhancedCalendarView: React.FC<EnhancedCalendarViewProps> = ({ userId }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarEvents();
  }, [userId, selectedDate, viewMode]);

  const loadCalendarEvents = async () => {
    setLoading(true);
    try {
      // Bestäm datumintervall baserat på viewMode
      let startDate: Date;
      let endDate: Date;

      switch (viewMode) {
        case 'month':
          startDate = startOfWeek(startOfMonth(selectedDate));
          endDate = endOfWeek(endOfMonth(selectedDate));
          break;
        case 'week':
          startDate = startOfWeek(selectedDate);
          endDate = endOfWeek(selectedDate);
          break;
        case 'day':
          startDate = selectedDate;
          endDate = selectedDate;
          break;
        default:
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
      }

      const { data, error } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .not('scheduled_date', 'is', null)
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      setEvents((data as CalendarEvent[]) || []);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda kalenderhändelser",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.scheduled_date === dateStr);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-300 text-gray-700';
      case 'deferred': return 'bg-orange-300 text-orange-700';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  const filteredEvents = showCompleted 
    ? events 
    : events.filter(event => event.completion_status !== 'completed');

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setSelectedDate(newDate);
  };

  const todaysEvents = getEventsForDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header med navigation och kontroller */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Utvecklingskalender
              <Badge variant="outline">{filteredEvents.length} händelser</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showCompleted ? 'Dölj avklarade' : 'Visa avklarade'}
              </Button>
              
              <div className="flex border rounded-md">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    {mode === 'month' ? 'Månad' : mode === 'week' ? 'Vecka' : 'Dag'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-semibold">
                {format(selectedDate, viewMode === 'month' ? 'MMMM yyyy' : 
                                    viewMode === 'week' ? "'Vecka' w, yyyy" : 
                                    'EEEE d MMMM yyyy', { locale: sv })}
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Idag
            </Button>
          </div>

          {/* Statistik för aktuell period */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredEvents.length}</div>
              <div className="text-sm text-blue-700">Totalt händelser</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.completion_status === 'completed').length}
              </div>
              <div className="text-sm text-green-700">Avklarade</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {filteredEvents.filter(e => e.priority === 'high').length}
              </div>
              <div className="text-sm text-red-700">Hög prioritet</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.ai_generated).length}
              </div>
              <div className="text-sm text-purple-700">AI-genererade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Huvudkalender */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full pointer-events-auto"
            />
          </CardContent>
        </Card>
      )}

      {/* Händelser för vald dag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Händelser för {format(selectedDate, 'EEEE d MMMM', { locale: sv })}
            <Badge variant="outline">{getEventsForDate(selectedDate).length} händelser</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 animate-pulse text-blue-600" />
              <p>Laddar händelser...</p>
            </div>
          ) : getEventsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Inga händelser denna dag</h3>
              <p className="mb-4">Din utvecklingskalender är tom för detta datum.</p>
              <Button variant="outline" onClick={() => window.location.href = '/user-analytics?tab=priority'}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till händelser
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate)
                .filter(event => showCompleted || event.completion_status !== 'completed')
                .map((event) => (
                <Card key={event.id} className={`border-l-4 ${getPriorityColor(event.priority)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge variant="outline" className={getStatusColor(event.completion_status)}>
                            {event.completion_status === 'completed' ? 'Klar' :
                             event.completion_status === 'in_progress' ? 'Pågår' :
                             event.completion_status === 'deferred' ? 'Uppskjuten' : 'Väntande'}
                          </Badge>
                          {event.ai_generated && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {event.scheduled_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{event.scheduled_time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{event.estimated_duration} min</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.priority === 'high' ? 'Hög' : 
                             event.priority === 'medium' ? 'Medium' : 'Låg'} prioritet
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sammanfattning för idag om det inte är vald dag */}
      {format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && todaysEvents.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">🌟 Dagens utvecklingsuppgifter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todaysEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{event.scheduled_time || 'Inte schemalagd'}</span>
                  <span>{event.title}</span>
                  <Badge variant="outline" className="text-xs">{event.estimated_duration}min</Badge>
                </div>
              ))}
              {todaysEvents.length > 3 && (
                <p className="text-sm text-muted-foreground">...och {todaysEvents.length - 3} till</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};