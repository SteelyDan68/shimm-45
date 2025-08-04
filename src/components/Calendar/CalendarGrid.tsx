import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarEvent } from './CalendarEvent';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarEventData } from './CalendarModule';

interface CalendarGridProps {
  dates: Date[];
  events: CalendarEventData[];
  viewMode: 'week' | 'month';
  getEventsForDate: (date: Date) => CalendarEventData[];
  pillarColors: Record<string, string>;
}

export function CalendarGrid({ 
  dates, 
  events, 
  viewMode, 
  getEventsForDate, 
  pillarColors 
}: CalendarGridProps) {
  const DayCell = ({ date }: { date: Date }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `day-${date.toISOString()}`,
      data: { date },
    });

    const dayEvents = getEventsForDate(date);
    const isCurrentDay = isToday(date);

    return (
      <div
        ref={setNodeRef}
        className={`
          p-2 border border-gray-100 min-h-[120px] 
          hover:bg-gray-50 transition-colors relative
          ${isCurrentDay ? 'bg-blue-50 border-blue-200' : ''}
          ${isOver ? 'bg-blue-100 border-blue-300' : ''}
        `}
      >
        <div className={`
          text-sm font-medium mb-2 p-1 rounded
          ${isCurrentDay ? 'bg-blue-600 text-white' : ''}
        `}>
          {format(date, 'd', { locale: sv })}
        </div>
        
        <div className="space-y-1">
          {dayEvents.map(event => (
            <CalendarEvent
              key={event.id}
              event={event}
              pillarColors={pillarColors}
              compact={viewMode === 'month'}
              canManage={true}
              isCoachView={false}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className={`
          grid gap-1 
          ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}
        `}>
          {/* Day headers */}
          {viewMode === 'week' && (
            <>
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </>
          )}
          
          {/* Calendar cells */}
          {dates.map(date => (
            <DayCell key={date.toISOString()} date={date} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}