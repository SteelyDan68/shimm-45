import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isPast, isSameMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarEvent } from './CalendarEvent';
import { CalendarEventData } from './CalendarModule';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  dates: Date[];
  events: CalendarEventData[];
  viewMode: 'week' | 'month';
  getEventsForDate: (date: Date) => CalendarEventData[];
  pillarColors: Record<string, string>;
}

export const CalendarGrid = ({ 
  dates, 
  events, 
  viewMode, 
  getEventsForDate, 
  pillarColors 
}: CalendarGridProps) => {
  return (
    <div className={cn(
      "grid gap-2",
      viewMode === 'week' ? "grid-cols-7" : "grid-cols-7"
    )}>
      {/* Header with day names */}
      {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day) => (
        <div key={day} className="p-2 text-center font-medium text-muted-foreground border-b">
          {day}
        </div>
      ))}
      
      {/* Calendar cells */}
      {dates.map((date, index) => (
        <CalendarCell
          key={date.toISOString()}
          date={date}
          events={getEventsForDate(date)}
          pillarColors={pillarColors}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};

interface CalendarCellProps {
  date: Date;
  events: CalendarEventData[];
  pillarColors: Record<string, string>;
  viewMode: 'week' | 'month';
}

const CalendarCell = ({ date, events, pillarColors, viewMode }: CalendarCellProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: date.toISOString(),
  });

  const cellHeight = viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[80px]';
  const isCurrentMonth = isSameMonth(date, new Date());

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        cellHeight,
        "relative transition-colors",
        isToday(date) && "ring-2 ring-primary",
        isOver && "bg-muted/50",
        !isCurrentMonth && viewMode === 'month' && "opacity-50"
      )}
    >
      <CardContent className="p-2 h-full">
        {/* Date header */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "text-sm font-medium",
            isToday(date) && "text-primary font-semibold",
            isPast(date) && !isToday(date) && "text-muted-foreground"
          )}>
            {format(date, 'd', { locale: sv })}
          </span>
          
          {events.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {events.length}
            </Badge>
          )}
        </div>

        {/* Events */}
        <div className="space-y-1">
          {events.slice(0, viewMode === 'week' ? 4 : 2).map((event) => (
            <CalendarEvent
              key={event.id}
              event={event}
              pillarColors={pillarColors}
              compact={viewMode === 'month'}
            />
          ))}
          
          {events.length > (viewMode === 'week' ? 4 : 2) && (
            <div className="text-xs text-muted-foreground">
              +{events.length - (viewMode === 'week' ? 4 : 2)} fler
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};