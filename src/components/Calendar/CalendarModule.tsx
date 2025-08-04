import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { EnhancedCalendarGrid } from './EnhancedCalendarGrid';
import { EnhancedCalendarEvent } from './EnhancedCalendarEvent';
import { AddEventForm } from './AddEventForm';
import { NotificationSettings } from './NotificationSettings';
import { CalendarExportImport } from './CalendarExportImport';
import { AIPlanningDialog } from './AIPlanningDialog';
import { UnifiedTaskEventCreator } from './UnifiedTaskEventCreator';
import { useAIPlanning } from '@/hooks/useAIPlanning';
import { useCalendarData, CalendarEventData } from '@/hooks/useCalendarData';
import { useUnifiedCalendarTasks } from '@/hooks/useUnifiedCalendarTasks';
import { useUniversalDependencyTracker } from '@/hooks/useUniversalDependencyTracker';
import { supabase } from '@/integrations/supabase/client';

// Export CalendarEventData for other components
export type { CalendarEventData };

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
  const [draggedEvent, setDraggedEvent] = useState<CalendarEventData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUnifiedCreator, setShowUnifiedCreator] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  // Use unified calendar-task integration
  const { 
    events, 
    tasks, 
    loading, 
    error, 
    createUnifiedTaskEvent,
    deleteUnifiedItem,
    moveItem,
    refreshAll,
    statistics,
    isRealTimeConnected
  } = useUnifiedCalendarTasks(clientId);
  
  // AI Planning integration
  const { 
    lastRecommendation, 
    showPlanningDialog, 
    dismissPlanningDialog, 
    handlePlanCreated 
  } = useAIPlanning(clientId);

  // Universal dependency tracking
  const { trackCalendarEventMove, notifyAffectedUsers } = useUniversalDependencyTracker();

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
    return events.filter(event => event.isOverdue);
  }, [events]);

  const dueSoonEvents = useMemo(() => {
    return events.filter(event => event.isDueSoon);
  }, [events]);

  // Enhanced calendar analytics using unified statistics
  const calendarStats = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const thisWeekEvents = events.filter(event => 
      event.date >= thisWeekStart && event.date <= thisWeekEnd
    );

    return {
      totalEvents: statistics.totalEvents,
      totalTasks: statistics.totalTasks,
      thisWeekEvents: thisWeekEvents.length,
      completedTasks: statistics.completedTasks,
      upcomingDeadlines: statistics.upcomingDeadlines,
      overdueItems: statistics.overdueItems,
      aiGeneratedCount: statistics.aiGeneratedCount,
      efficiency: statistics.totalTasks > 0 
        ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100)
        : 0,
      realTimeConnected: isRealTimeConnected
    };
  }, [events, statistics, isRealTimeConnected]);

  // Data loading is now handled by useCalendarData hook

  // Optimized notification system - less frequent
  const [notificationShown, setNotificationShown] = useState(false);
  
  React.useEffect(() => {
    if (!showNotifications || notificationShown || loading) return;

    const totalIssues = overdueEvents.length + dueSoonEvents.length;
    if (totalIssues > 0) {
      toast({
        title: totalIssues > 1 ? "Kalenderpåminnelser" : "Kalenderpåminnelse",
        description: `${overdueEvents.length} försenade, ${dueSoonEvents.length} förfaller snart`,
        variant: overdueEvents.length > 0 ? "destructive" : "default"
      });
      setNotificationShown(true);
      
      // Reset notification flag after 30 seconds
      setTimeout(() => setNotificationShown(false), 30000);
    }
  }, [overdueEvents.length, dueSoonEvents.length, showNotifications, loading, notificationShown, toast]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = events.find(e => e.id === event.active.id);
    setDraggedEvent(draggedItem || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedEvent) {
      setDraggedEvent(null);
      return;
    }

    const newDate = new Date(over.id as string);
    const oldDate = draggedEvent.date;
    
    // Enhanced move functionality with dependency tracking
    try {
      const itemType = draggedEvent.type === 'task' ? 'task' : 'calendar_event';
      const itemId = draggedEvent.type === 'task' 
        ? draggedEvent.id.replace('task-', '')
        : draggedEvent.id;
      
      // First, move the item
      const success = await moveItem(itemId, itemType, newDate);
      
      if (success) {
        // Track dependency changes
        const changeLog = await trackCalendarEventMove(
          itemId,
          draggedEvent.title,
          itemType,
          oldDate,
          newDate
        );
        
        // Notify affected users
        const affectedUsers = await notifyAffectedUsers(changeLog);
        
        toast({
          title: "Händelse flyttad ✅",
          description: `"${draggedEvent.title}" flyttades till ${format(newDate, 'dd MMM', { locale: sv })}. ${affectedUsers.length} användare notifierade.`
        });
      }
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: "Fel",
        description: "Kunde inte flytta händelsen",
        variant: "destructive"
      });
    }

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

  const addCustomEvent = async (eventData: Partial<CalendarEventData>) => {
    try {
      // Use unified creation for better integration
      const success = await createUnifiedTaskEvent({
        title: eventData.title || 'Ny händelse',
        description: eventData.description,
        date: eventData.date || new Date(),
        type: 'event',
        category: eventData.category || 'custom',
        priority: eventData.priority || 'medium',
        duration: eventData.duration,
        visible_to_client: true,
        created_by_role: isCoachView ? 'coach' : 'client'
      });

      if (!success) {
        throw new Error('Unified creation failed');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till händelsen",
        variant: "destructive"
      });
    }
  };

  const handleQuickAdd = (date: Date) => {
    addCustomEvent({ date, title: 'Snabb händelse' });
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
      {/* Enhanced Calendar Statistics */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Kalenderöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{calendarStats.totalEvents}</div>
              <div className="text-xs text-muted-foreground">Kalenderhändelser</div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{calendarStats.totalTasks}</div>
              <div className="text-xs text-muted-foreground">Uppgifter</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{calendarStats.completedTasks}</div>
              <div className="text-xs text-muted-foreground">Slutförda</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{calendarStats.upcomingDeadlines}</div>
              <div className="text-xs text-muted-foreground">Kommande</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{calendarStats.overdueItems}</div>
              <div className="text-xs text-muted-foreground">Försenade</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg relative">
              <div className="text-2xl font-bold text-purple-600">{calendarStats.aiGeneratedCount}</div>
              <div className="text-xs text-muted-foreground">AI-skapade</div>
              {calendarStats.realTimeConnected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                     title="Real-time ansluten" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isCoachView ? `Kalender - ${clientName}` : 'Min planering'}
              <Badge variant="outline" className="ml-2">
                {calendarStats.totalEvents} händelser
              </Badge>
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
                    onClick={() => setShowUnifiedCreator(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Skapa Smart
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

      {/* Enhanced Calendar Grid with Hover & Improved Drag/Drop */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <EnhancedCalendarGrid
          dates={calendarDates}
          events={events}
          viewMode={viewMode}
          getEventsForDate={getEventsForDate}
          pillarColors={PILLAR_COLORS}
          onQuickAdd={handleQuickAdd}
          isCoachView={isCoachView}
        />
        
        <DragOverlay>
          {draggedEvent && (
            <EnhancedCalendarEvent 
              event={draggedEvent} 
              pillarColors={PILLAR_COLORS}
              isDragging 
              showHover={false}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      {showUnifiedCreator && (
        <UnifiedTaskEventCreator
          isOpen={showUnifiedCreator}
          onClose={() => setShowUnifiedCreator(false)}
          onCreate={createUnifiedTaskEvent}
          clientId={clientId}
          isCoachView={isCoachView}
        />
      )}

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

      {/* AI Planning Dialog */}
      {lastRecommendation && (
        <AIPlanningDialog
          isOpen={showPlanningDialog}
          onClose={dismissPlanningDialog}
          recommendation={lastRecommendation}
          clientId={clientId!}
          clientName={clientName || 'Klient'}
          onPlanCreated={handlePlanCreated}
        />
      )}
    </div>
  );
};