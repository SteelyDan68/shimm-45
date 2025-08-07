import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedCalendarTasks } from '@/hooks/useUnifiedCalendarTasks';
import { LANGUAGE_16YO } from '@/config/language16yo';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2,
  PlayCircle,
  Target,
  Brain
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ScheduledActionable {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  estimated_duration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completion_status: 'pending' | 'in_progress' | 'completed' | 'paused';
  pillar_key: string;
  ai_generated: boolean;
}

interface ActionableCalendarViewProps {
  userId: string;
}

export const ActionableCalendarView = ({ userId }: ActionableCalendarViewProps) => {
  const { toast } = useToast();
  const { moveItem } = useUnifiedCalendarTasks(userId);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledActionables, setScheduledActionables] = useState<ScheduledActionable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScheduledActionables = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .not('scheduled_date', 'is', null)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const actionables: ScheduledActionable[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        scheduled_date: item.scheduled_date,
        estimated_duration: item.estimated_duration || 30,
        priority: item.priority || 'medium',
        completion_status: item.completion_status || 'pending',
        pillar_key: item.pillar_key,
        ai_generated: item.ai_generated || false
      }));

      setScheduledActionables(actionables);
    } catch (error) {
      console.error('Error loading scheduled actionables:', error);
      toast({
        title: LANGUAGE_16YO.ui.errors.something_wrong,
        description: LANGUAGE_16YO.ui.errors.try_again,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDayActionables = (date: Date) => {
    return scheduledActionables.filter(actionable => 
      isSameDay(parseISO(actionable.scheduled_date), date)
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateActionableStatus = async (actionableId: string, status: string) => {
    try {
      await supabase
        .from('calendar_actionables')
        .update({ 
          completion_status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', actionableId);

      await loadScheduledActionables();
      
      if (status === 'completed') {
        toast({
          title: LANGUAGE_16YO.ui.success.milestone_reached,
          description: "Bra jobbat! Du har slutfört en uppgift! 🎉",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: LANGUAGE_16YO.ui.errors.something_wrong,
        description: LANGUAGE_16YO.ui.errors.try_again,
        variant: "destructive"
      });
    }
  };

  const moveActionableToDate = async (actionableId: string, newDate: Date) => {
    try {
      const success = await moveItem(actionableId, 'task', newDate);
      if (success) {
        await loadScheduledActionables();
        toast({
          title: LANGUAGE_16YO.ui.success.moved,
          description: `Flyttat till ${format(newDate, 'EEEE d MMMM', { locale: sv })}`,
        });
      }
    } catch (error) {
      console.error('Error moving actionable:', error);
      toast({
        title: LANGUAGE_16YO.ui.errors.something_wrong,
        description: LANGUAGE_16YO.ui.errors.try_again,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadScheduledActionables();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              {LANGUAGE_16YO.ui.loading.loading}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const todayActionables = getDayActionables(selectedDate);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Kalender */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {LANGUAGE_16YO.calendar.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Klicka på en dag för att se vad du ska göra
          </p>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={sv}
            className="rounded-md border"
            modifiers={{
              hasActionables: (date) => getDayActionables(date).length > 0
            }}
            modifiersStyles={{
              hasActionables: { 
                backgroundColor: 'hsl(var(--primary))', 
                color: 'white',
                fontWeight: 'bold'
              }
            }}
          />
          <div className="mt-4 text-xs text-muted-foreground">
            💡 Blå dagar har inplanerade saker att göra
          </div>
        </CardContent>
      </Card>

      {/* Dagens actionables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {format(selectedDate, 'EEEE d MMMM', { locale: sv })}
          </CardTitle>
          {todayActionables.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {todayActionables.length} saker att göra
              </Badge>
              <Badge variant="outline">
                {todayActionables.reduce((sum, a) => sum + a.estimated_duration, 0)} min totalt
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {todayActionables.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ledig dag! 🎉</h3>
              <p className="text-muted-foreground">
                Inga inplanerade saker denna dag
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayActionables
                .sort((a, b) => parseISO(a.scheduled_date).getTime() - parseISO(b.scheduled_date).getTime())
                .map((actionable) => (
                  <div
                    key={actionable.id}
                    className={`p-4 rounded-lg border ${getPriorityColor(actionable.priority)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{actionable.title}</h4>
                        {actionable.description && (
                          <p className="text-sm opacity-80 mb-2">{actionable.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(actionable.scheduled_date), 'HH:mm')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {actionable.estimated_duration} min
                          </div>
                          {actionable.ai_generated && (
                            <Badge variant="secondary" className="text-xs">
                              <Brain className="h-3 w-3 mr-1" />
                              Stefan
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(actionable.completion_status)}`}
                          >
                            {LANGUAGE_16YO.actionables.status[actionable.completion_status as keyof typeof LANGUAGE_16YO.actionables.status]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {LANGUAGE_16YO.actionables.priority[actionable.priority as keyof typeof LANGUAGE_16YO.actionables.priority]}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {actionable.completion_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateActionableStatus(actionable.id, 'in_progress')}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Börja
                          </Button>
                        )}
                        {actionable.completion_status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateActionableStatus(actionable.id, 'completed')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Klart!
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const tomorrow = new Date(selectedDate);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            moveActionableToDate(actionable.id, tomorrow);
                          }}
                        >
                          {LANGUAGE_16YO.ui.buttons.move_task}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};