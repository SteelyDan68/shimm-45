import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock,
  Plus,
  Download,
  Upload,
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CalendarGrid } from './CalendarGrid';
import { CalendarEvent } from './CalendarEvent';
import { AddEventForm } from './AddEventForm';
import { NotificationSettings } from './NotificationSettings';
import { CalendarExportImport } from './CalendarExportImport';

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
  client_id?: string;
  duration?: number; // minutes
  isOverdue?: boolean;
  isDueSoon?: boolean;
  metadata?: Record<string, any>;
}

interface CalendarModuleProps {
  clientId?: string;
  clientName?: string;
  isCoachView?: boolean;
  showNotifications?: boolean;
}

const PILLAR_COLORS = {
  self_care: 'bg-green-500',
  skills: 'bg-blue-500', 
  talent: 'bg-purple-500',
  brand: 'bg-orange-500',
  economy: 'bg-red-500',
  default: 'bg-gray-500'
};

export const CalendarModule = ({ 
  clientId, 
  clientName, 
  isCoachView = false,
  showNotifications = true 
}: CalendarModuleProps) => {
  const { canManageUsers } = useAuth();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEventData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  // Generate calendar dates for current view
  const calendarDates = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      // Month view - simplified to 4 weeks for now
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 28 }, (_, i) => addDays(start, i));
    }
  }, [currentDate, viewMode]);

  // Filter events by date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  // Check for overdue and due soon events
  const overdueEvents = useMemo(() => {
    return events.filter(event => 
      event.type === 'task' && 
      event.status !== 'completed' && 
      isPast(event.date) && !isToday(event.date)
    );
  }, [events]);

  const dueSoonEvents = useMemo(() => {
    const tomorrow = addDays(new Date(), 1);
    return events.filter(event => 
      event.type === 'task' && 
      event.status !== 'completed' && 
      (isToday(event.date) || isSameDay(event.date, tomorrow))
    );
  }, [events]);

  // Load calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        // Here you would fetch from your APIs
        // For now, mock data
        const mockEvents: CalendarEventData[] = [
          {
            id: '1',
            title: 'Bedömning av Self Care',
            date: new Date(),
            type: 'assessment',
            pillar_type: 'self_care',
            client_id: clientId
          },
          {
            id: '2', 
            title: 'Implementera morgonrutin',
            date: addDays(new Date(), 2),
            type: 'task',
            priority: 'high',
            status: 'planned',
            client_id: clientId
          }
        ];
        
        setEvents(mockEvents);
      } catch (error) {
        console.error('Error loading calendar data:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda kalenderdata",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [clientId, toast]);

  // Notification system
  useEffect(() => {
    if (!showNotifications) return;

    if (overdueEvents.length > 0) {
      toast({
        title: "Försenade uppgifter",
        description: `${overdueEvents.length} uppgifter är försenade`,
        variant: "destructive"
      });
    }

    if (dueSoonEvents.length > 0) {
      toast({
        title: "Kommande deadlines", 
        description: `${dueSoonEvents.length} uppgifter förfaller snart`,
      });
    }
  }, [overdueEvents.length, dueSoonEvents.length, showNotifications, toast]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = events.find(e => e.id === event.active.id);
    setDraggedEvent(draggedItem || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedEvent) {
      setDraggedEvent(null);
      return;
    }

    const newDate = new Date(over.id as string);
    const updatedEvent = { ...draggedEvent, date: newDate };
    
    setEvents(prev => prev.map(e => 
      e.id === active.id ? updatedEvent : e
    ));

    // Here you would update the database
    toast({
      title: "Händelse flyttad",
      description: `"${draggedEvent.title}" flyttades till ${format(newDate, 'dd MMM', { locale: sv })}`
    });

    setDraggedEvent(null);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const increment = viewMode === 'week' ? 7 : 30;
    setCurrentDate(prev => 
      direction === 'next' 
        ? addDays(prev, increment)
        : addDays(prev, -increment)
    );
  };

  const addCustomEvent = (eventData: Partial<CalendarEventData>) => {
    const newEvent: CalendarEventData = {
      id: Date.now().toString(),
      title: eventData.title || 'Ny händelse',
      description: eventData.description,
      date: eventData.date || new Date(),
      type: 'custom_event',
      category: eventData.category,
      priority: eventData.priority || 'medium',
      client_id: clientId,
      duration: eventData.duration || 60
    };

    setEvents(prev => [...prev, newEvent]);
    toast({
      title: "Händelse tillagd",
      description: `"${newEvent.title}" har lagts till i kalendern`
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Laddar kalender...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isCoachView ? `Kalender - ${clientName}` : 'Min planering'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Notifications indicator */}
              {(overdueEvents.length > 0 || dueSoonEvents.length > 0) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueEvents.length + dueSoonEvents.length}
                </Badge>
              )}
              
              {/* Action buttons */}
              {canManageUsers() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Lägg till
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotificationSettings(true)}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Notiser
                  </Button>
                  
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowExportImport(true)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-medium">
                {format(currentDate, 'MMMM yyyy', { locale: sv })}
              </h3>
              
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs value={viewMode} onValueChange={(value: 'week' | 'month') => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="week">Vecka</TabsTrigger>
                <TabsTrigger value="month">Månad</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <CalendarGrid
          dates={calendarDates}
          events={events}
          viewMode={viewMode}
          getEventsForDate={getEventsForDate}
          pillarColors={PILLAR_COLORS}
        />
        
        <DragOverlay>
          {draggedEvent && (
            <CalendarEvent 
              event={draggedEvent} 
              pillarColors={PILLAR_COLORS}
              isDragging 
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      {showAddForm && (
        <AddEventForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAdd={addCustomEvent}
          clientId={clientId}
        />
      )}

      {showNotificationSettings && (
        <NotificationSettings
          isOpen={showNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
          clientId={clientId}
        />
      )}

      {showExportImport && (
        <CalendarExportImport
          isOpen={showExportImport}
          onClose={() => setShowExportImport(false)}
          events={events}
          clientName={clientName}
        />
      )}
    </div>
  );
};