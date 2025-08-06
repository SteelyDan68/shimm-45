/**
 * 📅 CALENDAR WIDGET - Kommande aktiviteter och events
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ArrowRight, Plus } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { format, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const CalendarWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  
  // Mock calendar data - detta kommer senare från calendar hooks
  const events = [
    {
      id: '1',
      title: 'Coaching session med Stefan',
      description: 'Månatlig uppföljning av utvecklingsresan',
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Imorgon
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1h
      category: 'coaching',
      location: 'Video call'
    },
    {
      id: '2',
      title: 'Pillar Assessment: Skills',
      description: 'Genomför Skills-bedömningen',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dagar
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45min
      category: 'assessment',
      location: 'Online'
    },
    {
      id: '3',
      title: 'Daglig reflektion',
      description: 'Utvärdera dagens framsteg',
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // Imorgon 18:00
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 18.5 * 60 * 60 * 1000), // 30min
      category: 'reflection',
      location: null
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coaching': return 'default';
      case 'assessment': return 'secondary';
      case 'reflection': return 'outline';
      case 'habit': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'coaching': return 'Coaching';
      case 'assessment': return 'Bedömning';
      case 'reflection': return 'Reflektion';
      case 'habit': return 'Vana';
      default: return category;
    }
  };

  const upcomingEvents = events
    .filter(event => event.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, widget.config?.maxItems || 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Kommande Aktiviteter</span>
          <Badge variant="secondary" className="text-xs">
            {upcomingEvents.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction?.('create-event')}
          className="w-8 h-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inga kommande aktiviteter</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => onAction?.('view-calendar')}
            >
              Öppna kalender
            </Button>
          </div>
        ) : (
          upcomingEvents.map((event) => {
            const isToday = format(event.startTime, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isTomorrow = format(event.startTime, 'yyyy-MM-dd') === format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
            
            return (
              <div 
                key={event.id}
                className={`p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                  isToday ? 'border-blue-200 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Calendar className="w-4 h-4 mt-0.5 text-blue-600" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">
                        {event.title}
                      </p>
                      
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge 
                          variant={getCategoryColor(event.category) as any} 
                          className="text-xs"
                        >
                          {getCategoryLabel(event.category)}
                        </Badge>
                        
                        {widget.config?.showTime && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {isToday ? 'Idag' : isTomorrow ? 'Imorgon' : 
                             formatDistanceToNow(event.startTime, { locale: sv, addSuffix: true })}
                            {' '}
                            {format(event.startTime, 'HH:mm')}
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction?.(`view-event-${event.id}`)}
                    className="w-8 h-8 p-0 ml-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {upcomingEvents.length > 0 && (
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAction?.('view-calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Öppna Kalender
          </Button>
          
          <Button 
            size="sm"
            onClick={() => onAction?.('create-event')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ny
          </Button>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;