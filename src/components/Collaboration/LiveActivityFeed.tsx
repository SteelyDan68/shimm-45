import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Edit3, MessageSquare, Mouse, FileText } from 'lucide-react';
import { CollaborationEvent } from '@/hooks/useRealtimeCollaboration';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface LiveActivityFeedProps {
  events: CollaborationEvent[];
  maxEvents?: number;
}

export function LiveActivityFeed({ events, maxEvents = 20 }: LiveActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const recentEvents = events.slice(-maxEvents);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type: CollaborationEvent['type']) => {
    switch (type) {
      case 'document_edit': return <Edit3 className="h-3 w-3" />;
      case 'assessment_update': return <FileText className="h-3 w-3" />;
      case 'message': return <MessageSquare className="h-3 w-3" />;
      case 'cursor_move': return <Mouse className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: CollaborationEvent['type']) => {
    switch (type) {
      case 'document_edit': return 'bg-blue-500';
      case 'assessment_update': return 'bg-green-500';
      case 'message': return 'bg-purple-500';
      case 'cursor_move': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const getEventDescription = (event: CollaborationEvent) => {
    switch (event.type) {
      case 'document_edit':
        return `redigerade ${event.data.documentId || 'dokument'}`;
      case 'assessment_update':
        return `uppdaterade en bedömning`;
      case 'message':
        if (event.data.typing) {
          return 'skriver...';
        }
        return 'skickade ett meddelande';
      case 'cursor_move':
        return `flyttade markören till rad ${event.data.cursor?.line || '?'}`;
      default:
        return 'utförde en aktivitet';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-4 w-4" />
          Live aktivitetsflöde
          <Badge variant="secondary" className="ml-auto">
            {recentEvents.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Realtidsuppdateringar från alla medarbetare
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full" ref={scrollRef}>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Ingen aktivitet ännu</p>
              <p className="text-sm">Aktivitet kommer att visas här när medarbetare gör ändringar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 group">
                  <div className={`p-1.5 rounded-full ${getEventColor(event.type)} text-white mt-0.5`}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {event.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getEventDescription(event)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { 
                          addSuffix: true, 
                          locale: sv 
                        })}
                      </span>
                      
                      {event.type === 'message' && event.data.typing && (
                        <Badge variant="outline" className="text-xs animate-pulse">
                          Skriver
                        </Badge>
                      )}
                      
                      {event.data.context && (
                        <Badge variant="outline" className="text-xs">
                          {event.data.context}
                        </Badge>
                      )}
                    </div>

                    {/* Show additional data for certain event types */}
                    {event.type === 'document_edit' && event.data.changes && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(event.data.changes, null, 2).slice(0, 100)}
                          {JSON.stringify(event.data.changes).length > 100 && '...'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}