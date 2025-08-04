import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDraggable } from '@dnd-kit/core';
import { Clock, AlertTriangle, CheckCircle, FileText, Brain, Target, User, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarEventData } from './CalendarModule';
import { cn } from '@/lib/utils';
import { useGDPRCalendarCompliance } from '@/hooks/useGDPRCalendarCompliance';

interface EnhancedCalendarEventProps {
  event: CalendarEventData;
  pillarColors: Record<string, string>;
  compact?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
  isCoachView?: boolean;
  showHover?: boolean;
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

export const EnhancedCalendarEvent = ({ 
  event, 
  pillarColors, 
  compact = false, 
  isDragging = false,
  showHover = true
}: EnhancedCalendarEventProps) => {
  const [hoverOpen, setHoverOpen] = useState(false);
  const { logGDPRAction } = useGDPRCalendarCompliance();
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    disabled: event.type === 'assessment' || event.type === 'path_entry'
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

  // 📊 Track hover interaction for analytics
  const handleHoverOpenChange = (open: boolean) => {
    setHoverOpen(open);
    
    if (open) {
      logGDPRAction('calendar_event_hover_viewed', {
        event_id: event.id,
        event_type: event.type,
        pillar_type: event.pillar_type,
        hover_timestamp: new Date().toISOString(),
        interaction_type: 'hover_preview'
      });
    }
  };

  // Base event component
  const EventComponent = (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "relative rounded-md border p-2 transition-all cursor-pointer group",
        "hover:shadow-md hover:scale-[1.02] hover:z-10",
        priorityColor,
        isDragging && "opacity-50 rotate-2 shadow-lg scale-110",
        isCompleted && "opacity-60",
        isOverdue && "bg-red-50 border-red-300 animate-pulse",
        isDueSoon && "bg-yellow-50 border-yellow-300",
        compact ? "text-xs" : "text-sm",
        // Enhanced interactive states
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        "active:scale-95 transition-transform duration-75"
      )}
    >
      {/* Enhanced color bar with gradient */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-md opacity-80 group-hover:opacity-100 group-hover:w-2 transition-all",
        pillarColor
      )} />
      
      {/* Drag indicator */}
      {!compact && (
        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-50 transition-opacity">
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
          </div>
        </div>
      )}
      
      <div className="pl-2 pr-4">
        {/* Enhanced header */}
        <div className="flex items-center gap-1 mb-1">
          <TypeIcon className={cn(
            "flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity",
            compact ? "h-3 w-3" : "h-4 w-4"
          )} />
          
          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />}
          {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
          
          {event.duration && !compact && (
            <span className="text-xs text-muted-foreground ml-auto bg-muted px-1 rounded">
              {event.duration}min
            </span>
          )}
        </div>

        {/* Enhanced title */}
        <div className={cn(
          "font-medium line-clamp-1 mb-1 group-hover:text-foreground transition-colors",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {event.title}
        </div>

        {/* Description preview - enhanced for hover hint */}
        {!compact && event.description && (
          <div className="text-xs text-muted-foreground line-clamp-1 mb-1 italic">
            {event.description.substring(0, 30)}
            {event.description.length > 30 && '...'}
          </div>
        )}

        {/* Enhanced footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {format(event.date, 'HH:mm', { locale: sv })}
          </span>
          
          <div className="flex gap-1 items-center">
            {event.priority === 'high' && (
              <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                !
              </Badge>
            )}
            
            {event.pillar_type && !compact && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                {event.pillar_type}
              </Badge>
            )}

            {/* Hover indicator */}
            {showHover && !compact && (
              <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                ⓘ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Return with or without hover enhancement
  if (!showHover || compact) {
    return EventComponent;
  }

  return (
    <HoverCard openDelay={300} closeDelay={150} open={hoverOpen} onOpenChange={handleHoverOpenChange}>
      <HoverCardTrigger asChild>
        {EventComponent}
      </HoverCardTrigger>
      
      <HoverCardContent 
        className="w-80 p-0 border-0 shadow-xl" 
        side="right" 
        align="start"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TypeIcon className="h-4 w-4" />
              {event.title}
              {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
              {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3 pt-0">
            {/* Description */}
            {event.description && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Beskrivning</h4>
                <p className="text-sm leading-relaxed">{event.description}</p>
              </div>
            )}
            
            <Separator />
            
            {/* Event details grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <span>{format(event.date, 'dd MMM yyyy', { locale: sv })}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{format(event.date, 'HH:mm', { locale: sv })}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {event.priority && (
                  <div className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-muted-foreground" />
                    <Badge variant={event.priority === 'high' ? 'destructive' : 'outline'} className="text-xs h-4">
                      {event.priority}
                    </Badge>
                  </div>
                )}
                
                {event.pillar_type && (
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", pillarColor)} />
                    <span className="capitalize">{event.pillar_type}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional metadata */}
            {(event.duration || event.created_by_role) && (
              <>
                <Separator />
                <div className="space-y-1 text-xs text-muted-foreground">
                  {event.duration && (
                    <div className="flex justify-between">
                      <span>Varaktighet:</span>
                      <span>{event.duration} minuter</span>
                    </div>
                  )}
                  
                  {event.created_by_role && (
                    <div className="flex justify-between">
                      <span>Skapad av:</span>
                      <Badge variant="outline" className="text-xs h-4">
                        {event.created_by_role}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Typ:</span>
                    <span className="capitalize">{event.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </>
            )}

            {/* Status indicators */}
            <div className="flex gap-2 pt-2">
              {isOverdue && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Försenad
                </Badge>
              )}
              
              {isDueSoon && !isOverdue && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Förfaller snart
                </Badge>
              )}
              
              {isCompleted && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3" />
                  Slutförd
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
};