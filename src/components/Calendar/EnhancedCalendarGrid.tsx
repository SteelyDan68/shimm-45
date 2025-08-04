import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isSameDay, isWeekend } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarEventData } from './CalendarModule';
import { EnhancedCalendarEvent } from './EnhancedCalendarEvent';
import { cn } from '@/lib/utils';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

interface EnhancedCalendarGridProps {
  dates: Date[];
  events: CalendarEventData[];
  viewMode: 'week' | 'month';
  getEventsForDate: (date: Date) => CalendarEventData[];
  pillarColors: Record<string, string>;
  onQuickAdd?: (date: Date) => void;
  isCoachView?: boolean;
}

export function EnhancedCalendarGrid({ 
  dates, 
  events, 
  viewMode, 
  getEventsForDate, 
  pillarColors,
  onQuickAdd,
  isCoachView = false
}: EnhancedCalendarGridProps) {
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const DayCell = ({ date }: { date: Date }) => {
    const { setNodeRef, isOver, active } = useDroppable({
      id: date.toISOString(),
      data: { 
        date,
        type: 'calendar_day',
        accepts: ['task', 'calendar_event']
      },
    });

    const dayEvents = getEventsForDate(date);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    const hasEvents = dayEvents.length > 0;
    const overdueCount = dayEvents.filter(e => e.isOverdue).length;
    const completedCount = dayEvents.filter(e => e.status === 'completed').length;

    // Enhanced hover and drop states
    const isDropActive = isOver && active;
    const isDropTarget = dragOverDate && isSameDay(dragOverDate, date);

    return (
      <div
        ref={setNodeRef}
        className={cn(
          "relative p-2 border transition-all duration-200 min-h-[120px] group",
          "hover:shadow-sm hover:border-primary/30",
          
          // Base styling
          "border-border/50",
          
          // Current day highlighting
          isCurrentDay && "bg-primary/5 border-primary/40 shadow-sm",
          
          // Weekend styling
          isWeekendDay && "bg-muted/30",
          
          // Drag and drop states
          isDropActive && "bg-primary/10 border-primary/60 shadow-lg scale-[1.01]",
          isDropTarget && "bg-secondary/20 border-secondary/60",
          
          // Event status indicators
          hasEvents && "bg-gradient-to-br from-transparent to-muted/20",
          overdueCount > 0 && "bg-gradient-to-br from-red-50/50 to-transparent border-red-200/50",
          
          // Enhanced interactions
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1"
        )}
        onMouseEnter={() => setDragOverDate(date)}
        onMouseLeave={() => setDragOverDate(null)}
      >
        {/* Enhanced day header */}
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            "text-sm font-medium px-2 py-1 rounded-md transition-all",
            isCurrentDay && "bg-primary text-primary-foreground shadow-sm",
            !isCurrentDay && isWeekendDay && "text-muted-foreground",
            !isCurrentDay && !isWeekendDay && "text-foreground hover:bg-muted/50"
          )}>
            {format(date, 'd', { locale: sv })}
          </div>
          
          {/* Event indicators and stats */}
          <div className="flex items-center gap-1">
            {hasEvents && (
              <Badge 
                variant={overdueCount > 0 ? "destructive" : "secondary"} 
                className="text-xs h-4 px-1"
              >
                {dayEvents.length}
              </Badge>
            )}
            
            {/* Quick add button - only visible on hover */}
            {onQuickAdd && (
              <button
                onClick={() => onQuickAdd(date)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "w-4 h-4 rounded-full bg-primary/20 hover:bg-primary/30",
                  "flex items-center justify-center text-primary"
                )}
                title="Snabbt lägg till händelse"
              >
                <Plus className="w-2 h-2" />
              </button>
            )}
          </div>
        </div>

        {/* Events container with enhanced layout */}
        <div className="space-y-1 overflow-hidden">
          {dayEvents.slice(0, viewMode === 'month' ? 2 : 4).map(event => (
            <EnhancedCalendarEvent
              key={event.id}
              event={event}
              pillarColors={pillarColors}
              compact={viewMode === 'month'}
              showHover={!isDropActive}
              canManage={true}
              isCoachView={isCoachView}
            />
          ))}
          
          {/* More events indicator */}
          {dayEvents.length > (viewMode === 'month' ? 2 : 4) && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 text-center">
              +{dayEvents.length - (viewMode === 'month' ? 2 : 4)} fler
            </div>
          )}
        </div>

        {/* Enhanced drop zone indicator */}
        {isDropActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-lg bg-primary/5 flex items-center justify-center">
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <CalendarIcon className="w-4 h-4" />
                Släpp här
              </div>
            </div>
          </div>
        )}

        {/* Summary stats for day (only in week view) */}
        {viewMode === 'week' && hasEvents && (
          <div className="absolute bottom-1 right-1 flex gap-1">
            {completedCount > 0 && (
              <div className="w-2 h-2 bg-green-400 rounded-full" title={`${completedCount} slutförda`} />
            )}
            {overdueCount > 0 && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title={`${overdueCount} försenade`} />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className={cn(
          "grid gap-1",
          viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
        )}>
          {/* Enhanced day headers with additional info */}
          {(viewMode === 'week' || dates.length <= 7) && (
            <>
              {['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'].map((day, index) => {
                const dayEvents = getEventsForDate(dates[index]);
                const dayOverdue = dayEvents?.filter(e => e.isOverdue).length || 0;
                
                return (
                  <div key={day} className="p-2 text-center border-b border-border/50">
                    <div className="text-sm font-medium text-muted-foreground">
                      {day.substring(0, 3)}
                    </div>
                    {dayEvents && dayEvents.length > 0 && (
                      <div className="flex justify-center mt-1">
                        <Badge 
                          variant={dayOverdue > 0 ? "destructive" : "secondary"} 
                          className="text-xs h-4 px-1"
                        >
                          {dayEvents.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          
          {/* Calendar cells */}
          {dates.map(date => (
            <DayCell key={date.toISOString()} date={date} />
          ))}
        </div>

        {/* Grid statistics - only in week view */}
        {viewMode === 'week' && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div>
                <div className="font-medium text-foreground">{events.length}</div>
                <div className="text-muted-foreground">Totalt</div>
              </div>
              <div>
                <div className="font-medium text-green-600">
                  {events.filter(e => e.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Slutförda</div>
              </div>
              <div>
                <div className="font-medium text-red-600">
                  {events.filter(e => e.isOverdue).length}
                </div>
                <div className="text-muted-foreground">Försenade</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">
                  {events.filter(e => e.isDueSoon).length}
                </div>
                <div className="text-muted-foreground">Förfaller snart</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}