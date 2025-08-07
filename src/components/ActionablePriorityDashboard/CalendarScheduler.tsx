import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedCalendarTasks } from '@/hooks/useUnifiedCalendarTasks';
import { LANGUAGE_16YO } from '@/config/language16yo';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Zap,
  Target,
  CheckCircle2
} from 'lucide-react';
import { format, addDays, setHours, setMinutes, isToday, isTomorrow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ActionableItem {
  id: string;
  title: string;
  description?: string;
  pillar_key: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration: number;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'paused';
  scheduled_date?: string;
  ai_generated: boolean;
}

interface CalendarSchedulerProps {
  actionables: ActionableItem[];
  userId: string;
  onScheduled: () => void;
}

export const CalendarScheduler = ({ actionables, userId, onScheduled }: CalendarSchedulerProps) => {
  const { toast } = useToast();
  const { createUnifiedTaskEvent } = useUnifiedCalendarTasks(userId);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState<'smart' | 'manual'>('smart');

  // Filtrera bort redan schemalagda och färdiga actionables
  const unscheduledActionables = actionables.filter(
    a => !a.scheduled_date && a.completion_status !== 'completed'
  );

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return LANGUAGE_16YO.calendar.today;
    if (isTomorrow(date)) return LANGUAGE_16YO.calendar.tomorrow;
    return format(date, 'EEEE d MMMM', { locale: sv });
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

  const scheduleActionable = async (actionable: ActionableItem, date: Date, time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDateTime = setMinutes(setHours(date, hours), minutes);

      // Skapa i kalendern genom unified hook
      await createUnifiedTaskEvent({
        title: actionable.title,
        description: actionable.description,
        date: scheduledDateTime,
        type: 'task',
        priority: actionable.priority === 'critical' ? 'high' : actionable.priority,
        pillar_type: actionable.pillar_key,
        duration: actionable.estimated_duration,
        ai_generated: actionable.ai_generated
      });

      // Uppdatera actionable med schemalagd tid
      await supabase
        .from('calendar_actionables')
        .update({ 
          scheduled_date: scheduledDateTime.toISOString(),
          completion_status: 'pending'
        })
        .eq('id', actionable.id);

      return true;
    } catch (error) {
      console.error('Error scheduling actionable:', error);
      return false;
    }
  };

  const handleSmartScheduling = async () => {
    setIsScheduling(true);
    try {
      let successCount = 0;
      let currentDate = new Date();
      
      // Sortera efter prioritet (critical först)
      const sortedActionables = [...unscheduledActionables].sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (let i = 0; i < Math.min(5, sortedActionables.length); i++) {
        const actionable = sortedActionables[i];
        
        // Fördela över nästa 5 dagar
        const scheduleDate = addDays(currentDate, i);
        const timeSlot = i % 2 === 0 ? '09:00' : '14:00'; // Växla mellan förmiddag och eftermiddag
        
        const success = await scheduleActionable(actionable, scheduleDate, timeSlot);
        if (success) successCount++;
      }

      toast({
        title: LANGUAGE_16YO.ui.success.scheduled,
        description: `${successCount} saker inplanerade! 📅`,
      });

      onScheduled();
    } catch (error) {
      toast({
        title: LANGUAGE_16YO.ui.errors.scheduling_failed,
        description: LANGUAGE_16YO.ui.errors.try_again,
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleManualSchedule = async (actionable: ActionableItem) => {
    const success = await scheduleActionable(actionable, selectedDate, selectedTime);
    
    if (success) {
      toast({
        title: LANGUAGE_16YO.ui.success.scheduled,
        description: `"${actionable.title}" inplanerat ${getDateLabel(selectedDate)} kl ${selectedTime}`,
      });
      onScheduled();
    } else {
      toast({
        title: LANGUAGE_16YO.ui.errors.scheduling_failed,
        description: LANGUAGE_16YO.ui.errors.try_again,
        variant: "destructive"
      });
    }
  };

  if (unscheduledActionables.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Alla saker är inplanerade! 🎉</h3>
          <p className="text-muted-foreground">Bra jobbat - du har koll på läget!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schemaläggnings-alternativ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {LANGUAGE_16YO.actionables.add_to_calendar}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {unscheduledActionables.length} saker väntar på att planeras in
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={schedulingMode === 'smart' ? 'default' : 'outline'}
              onClick={() => setSchedulingMode('smart')}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              {LANGUAGE_16YO.actionables.schedule_smart}
            </Button>
            <Button
              variant={schedulingMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setSchedulingMode('manual')}
              className="flex-1"
            >
              <Target className="h-4 w-4 mr-2" />
              Jag väljer själv
            </Button>
          </div>

          {schedulingMode === 'smart' && (
            <div className="text-center">
              <Button
                onClick={handleSmartScheduling}
                disabled={isScheduling}
                size="lg"
                className="w-full"
              >
                {isScheduling ? (
                  LANGUAGE_16YO.ui.loading.scheduling
                ) : (
                  `Planera in ${Math.min(5, unscheduledActionables.length)} saker automatiskt 🚀`
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Stefan fördelar dem smart över nästa dagarna
              </p>
            </div>
          )}

          {schedulingMode === 'manual' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Välj datum</h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={sv}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Välj tid</h4>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00">08:00 - Tidig start 🌅</SelectItem>
                      <SelectItem value="09:00">09:00 - Förmiddag ☀️</SelectItem>
                      <SelectItem value="10:00">10:00 - Sent förmiddag</SelectItem>
                      <SelectItem value="14:00">14:00 - Eftermiddag</SelectItem>
                      <SelectItem value="16:00">16:00 - Sen eftermiddag</SelectItem>
                      <SelectItem value="18:00">18:00 - Kväll 🌆</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{getDateLabel(selectedDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Klockan {selectedTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista över saker att planera */}
      <Card>
        <CardHeader>
          <CardTitle>Saker att planera in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unscheduledActionables.map((actionable) => (
              <div
                key={actionable.id}
                className={`p-3 rounded-lg border ${getPriorityColor(actionable.priority)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{actionable.title}</h4>
                    {actionable.description && (
                      <p className="text-sm opacity-80 mt-1">{actionable.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {LANGUAGE_16YO.actionables.priority[actionable.priority]}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {actionable.estimated_duration} min
                      </div>
                    </div>
                  </div>
                  {schedulingMode === 'manual' && (
                    <Button
                      size="sm"
                      onClick={() => handleManualSchedule(actionable)}
                    >
                      Planera in
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};