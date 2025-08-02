import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpTooltip } from '@/components/HelpTooltip';
import { 
  Calendar, 
  Play, 
  Pause, 
  CheckCircle, 
  Target, 
  Clock,
  TrendingUp,
  Flag
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  eventType: string;
  eventTitle: string;
  eventDescription?: string;
  occurredAt: string;
  journeyId: string;
  pillarName?: string;
  eventData?: any;
}

interface JourneyTimelineProps {
  timeline: TimelineEvent[];
  userId: string;
}

// Huvudpolicy från UX Expert: Kronologisk klarhet med visuell hierarki
export const JourneyTimeline = ({ timeline, userId }: JourneyTimelineProps) => {
  
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'started': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-orange-600" />;
      case 'resumed': return <Play className="h-4 w-4 text-green-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'milestone': return <Flag className="h-4 w-4 text-purple-600" />;
      case 'task_completed': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'started': return 'border-blue-200 bg-blue-50';
      case 'paused': return 'border-orange-200 bg-orange-50';
      case 'resumed': return 'border-green-200 bg-green-50';
      case 'completed': return 'border-green-200 bg-green-50';
      case 'milestone': return 'border-purple-200 bg-purple-50';
      case 'task_completed': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'started': return 'Startad';
      case 'paused': return 'Pausad';
      case 'resumed': return 'Återupptagen';
      case 'completed': return 'Slutförd';
      case 'milestone': return 'Milstolpe';
      case 'task_completed': return 'Uppgift slutförd';
      default: return eventType;
    }
  };

  // Huvudpolicy från Product Manager: Gruppera per dag för översikt
  const groupEventsByDate = (events: TimelineEvent[]) => {
    const grouped = events.reduce((groups, event) => {
      const date = new Date(event.occurredAt).toLocaleDateString('sv-SE');
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
      return groups;
    }, {} as Record<string, TimelineEvent[]>);

    // Huvudpolicy från Frontend Dev: Sortera senaste först
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, events]) => ({
        date,
        events: events.sort((a, b) => 
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
      }));
  };

  const groupedTimeline = groupEventsByDate(timeline);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Utvecklingshistorik
          <HelpTooltip content="Kronologisk översikt över din utvecklingsresa. Se viktiga milstolpar och framsteg över tid." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Ingen historik än</h3>
            <p className="text-sm">
              När du startar utvecklingsresor kommer din historik att visas här.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTimeline.map(({ date, events }) => (
              <div key={date} className="space-y-4">
                {/* Huvudpolicy från UX Expert: Tydlig datumgruppering */}
                <div className="flex items-center gap-3">
                  <div className="h-px bg-border flex-1" />
                  <Badge variant="outline" className="px-3 py-1">
                    {date}
                  </Badge>
                  <div className="h-px bg-border flex-1" />
                </div>

                {/* Händelser för dagen */}
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div key={event.id} className="relative">
                      {/* Tidslinje-linje */}
                      {index < events.length - 1 && (
                        <div className="absolute left-6 top-8 bottom-0 w-px bg-border" />
                      )}
                      
                      <div className={`flex gap-4 p-4 rounded-lg border ${getEventColor(event.eventType)}`}>
                        {/* Ikon */}
                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-current">
                          {getEventIcon(event.eventType)}
                        </div>
                        
                        {/* Innehåll */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.eventTitle}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {getEventTypeLabel(event.eventType)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.occurredAt).toLocaleTimeString('sv-SE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {event.pillarName && (
                            <p className="text-sm font-medium text-primary">
                              {event.pillarName}
                            </p>
                          )}
                          
                          {event.eventDescription && (
                            <p className="text-sm text-muted-foreground">
                              {event.eventDescription}
                            </p>
                          )}
                          
                          {/* Huvudpolicy från Coaching Psykolog: Visa framsteg data när relevant */}
                          {event.eventData?.progress && (
                            <div className="text-xs text-muted-foreground">
                              Framsteg: {event.eventData.progress}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Huvudpolicy från UX Expert: Visuell avslutning */}
            <div className="flex items-center justify-center pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flag className="h-4 w-4" />
                <span>Början av din utvecklingsresa</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};