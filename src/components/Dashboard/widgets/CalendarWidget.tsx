/**
 * 📅 CALENDAR WIDGET - Kommande aktiviteter och kalenderhändelser
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WidgetProps } from '../types/dashboard-types';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const CalendarWidget: React.FC<WidgetProps> = ({ widget, stats }) => {
  // Temporarily disable calendar functionality to prevent crashes
  const events = [];
  const loading = false;
  const error = null;

  const maxItems = widget.config?.maxItems || 5;
  const upcomingEvents = events?.slice(0, maxItems) || [];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'path_entry': return 'bg-primary/10 text-primary';
      case 'assessment': return 'bg-secondary/10 text-secondary';
      case 'custom_event': return 'bg-accent/10 text-accent';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-muted';
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-md" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kunde inte ladda kalenderhändelser</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="w-4 h-4" />
          {widget.title}
        </CardTitle>
        {widget.description && (
          <p className="text-xs text-muted-foreground">{widget.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Inga kommande aktiviteter</p>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border-l-4 bg-card hover:bg-accent/5 transition-colors ${getPriorityColor(event.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{event.title}</h4>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.date), 'MMM d, HH:mm', { locale: sv })}
                    </div>
                    {event.description && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Online
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getEventTypeColor(event.type)}`}
                  >
                    {event.type === 'path_entry' ? 'Uppgift' : 
                     event.type === 'assessment' ? 'Assessment' :
                     event.type === 'custom_event' ? 'Händelse' : 
                     event.category || event.type}
                  </Badge>
                  {event.priority && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {event.priority === 'high' ? 'Hög' :
                       event.priority === 'medium' ? 'Medium' : 'Låg'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarWidget;