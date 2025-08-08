import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedCalendarTasks } from '@/hooks/useUnifiedCalendarTasks';
import { Calendar as CalendarIcon, Clock, Target, CheckCircle2 } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/tasks';

interface TaskCalendarSchedulerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export function TaskCalendarScheduler({ 
  task, 
  isOpen, 
  onClose, 
  onScheduled 
}: TaskCalendarSchedulerProps) {
  const { toast } = useToast();
  const { createUnifiedTaskEvent } = useUnifiedCalendarTasks(task?.user_id);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [eventType, setEventType] = useState<'event' | 'both'>('event');
  const [isScheduling, setIsScheduling] = useState(false);

  if (!task) return null;

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast({
        title: "Datum krävs",
        description: "Välj ett datum för att schemalägga uppgiften",
        variant: "destructive"
      });
      return;
    }

    setIsScheduling(true);
    
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = setMinutes(setHours(selectedDate, hours), minutes);

      const success = await createUnifiedTaskEvent({
        title: task.title,
        description: task.description,
        date: scheduledDateTime,
        type: eventType,
        priority: task.priority,
        ai_generated: task.ai_generated,
        created_by_role: 'user',
        visible_to_client: true
      });

      if (success) {
        toast({
          title: "Framgång! 📅",
          description: `"${task.title}" schemalagd för ${format(scheduledDateTime, 'PPP', { locale: sv })} kl ${selectedTime}`
        });
        
        onScheduled?.();
        onClose();
      }
    } catch (error) {
      console.error('Scheduling failed:', error);
      toast({
        title: "Fel vid schemaläggning",
        description: "Kunde inte schemalägga uppgiften. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20'; 
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDatePreview = () => {
    if (!selectedDate) return 'Välj datum';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Idag';
    } else if (selectedDate.toDateString() === tomorrow.toDateString()) {
      return 'Imorgon';
    } else {
      return format(selectedDate, 'EEEE d MMMM', { locale: sv });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schemalägga uppgift i kalender
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Preview */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                    {task.priority === 'high' ? 'Hög prioritet' : 
                     task.priority === 'medium' ? 'Medium prioritet' : 'Låg prioritet'}
                  </Badge>
                  {task.ai_generated && (
                    <Badge variant="secondary" className="text-xs">
                      AI-genererad
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling Type */}
          <div className="space-y-2">
            <Label>Vad vill du skapa?</Label>
            <Select value={eventType} onValueChange={(value: 'event' | 'both') => setEventType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Endast kalenderhändelse
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Kalenderhändelse + Ny uppgift
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {eventType === 'event' 
                ? 'Skapar endast en kalenderhändelse baserad på uppgiften'
                : 'Skapar både en kalenderhändelse och duplicerar uppgiften som schemalagd'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label>Välj datum</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={sv}
                className={cn("rounded-md border pointer-events-auto")}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>

            {/* Time and Summary */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="time">Tid</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">08:00 - Tidig start 🌅</SelectItem>
                    <SelectItem value="09:00">09:00 - Förmiddag ☀️</SelectItem>
                    <SelectItem value="10:00">10:00 - Sen förmiddag</SelectItem>
                    <SelectItem value="11:00">11:00 - Förmiddag</SelectItem>
                    <SelectItem value="13:00">13:00 - Lunch tid 🍽️</SelectItem>
                    <SelectItem value="14:00">14:00 - Eftermiddag</SelectItem>
                    <SelectItem value="15:00">15:00 - Eftermiddag</SelectItem>
                    <SelectItem value="16:00">16:00 - Sen eftermiddag</SelectItem>
                    <SelectItem value="17:00">17:00 - Kväll</SelectItem>
                    <SelectItem value="18:00">18:00 - Kväll 🌆</SelectItem>
                    <SelectItem value="19:00">19:00 - Kväll</SelectItem>
                    <SelectItem value="20:00">20:00 - Sen kväll</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Schemalagd för:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getDatePreview()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Klockan {selectedTime}</span>
                  </div>
                </div>
              </div>

              {/* Quick Time Buttons */}
              <div className="space-y-2">
                <Label className="text-xs">Snabbval</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTime('09:00')}
                    className={selectedTime === '09:00' ? 'bg-primary/10 border-primary' : ''}
                  >
                    Förmiddag
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTime('14:00')}
                    className={selectedTime === '14:00' ? 'bg-primary/10 border-primary' : ''}
                  >
                    Eftermiddag
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTime('18:00')}
                    className={selectedTime === '18:00' ? 'bg-primary/10 border-primary' : ''}
                  >
                    Kväll
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                      setSelectedTime(currentTime);
                    }}
                  >
                    Nu
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSchedule} 
              disabled={isScheduling || !selectedDate}
              className="flex-1"
            >
              {isScheduling ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Schemalägger...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schemalägga {eventType === 'both' ? '& Duplicera' : 'i kalender'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}