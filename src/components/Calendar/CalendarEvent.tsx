import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useDraggable } from '@dnd-kit/core';
import { Clock, AlertTriangle, CheckCircle, FileText, Brain, Target } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarEventData } from './CalendarModule';
import { cn } from '@/lib/utils';

interface CalendarEventProps {
  event: CalendarEventData;
  pillarColors: Record<string, string>;
  compact?: boolean;
  isDragging?: boolean;
}

const TYPE_ICONS = {
  task: Target,
  assessment: FileText,
  path_entry: Brain,
  custom_event: Clock
};

const PRIORITY_COLORS = {
  low: 'border-gray-300',
  medium: 'border-yellow-400',
  high: 'border-red-500'
};

export const CalendarEvent = ({ event, pillarColors, compact = false, isDragging = false }: CalendarEventProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    disabled: event.type === 'assessment' || event.type === 'path_entry' // Only tasks and custom events are draggable
  });

  const TypeIcon = TYPE_ICONS[event.type];
  const pillarColor = event.pillar_type ? pillarColors[event.pillar_type] : pillarColors.default;
  const priorityColor = event.priority ? PRIORITY_COLORS[event.priority] : PRIORITY_COLORS.medium;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isOverdue = event.isOverdue;
  const isDueSoon = event.isDueSoon;
  const isCompleted = event.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "relative rounded-md border p-2 transition-all cursor-pointer",
        "hover:shadow-md hover:scale-105",
        priorityColor,
        isDragging && "opacity-50 rotate-2 shadow-lg",
        isCompleted && "opacity-60",
        isOverdue && "bg-red-50 border-red-300",
        isDueSoon && "bg-yellow-50 border-yellow-300",
        compact ? "text-xs" : "text-sm"
      )}
    >
      {/* Color bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-md", pillarColor)} />
      
      <div className="pl-2">
        {/* Header */}
        <div className="flex items-center gap-1 mb-1">
          <TypeIcon className={cn("flex-shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
          
          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
          {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
          
          {event.duration && !compact && (
            <span className="text-xs text-muted-foreground ml-auto">
              {event.duration}min
            </span>
          )}
        </div>

        {/* Title */}
        <div className={cn(
          "font-medium line-clamp-1 mb-1",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {event.title}
        </div>

        {/* Description - only in non-compact mode */}
        {!compact && event.description && (
          <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
            {event.description}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Time */}
          <span className="text-xs text-muted-foreground">
            {format(event.date, 'HH:mm', { locale: sv })}
          </span>
          
          {/* Badges */}
          <div className="flex gap-1">
            {event.priority === 'high' && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                !
              </Badge>
            )}
            
            {event.pillar_type && !compact && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {event.pillar_type}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};