import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Filter, User, Brain, Target, Award, Building, DollarSign } from 'lucide-react';
import { useClientPath } from '@/hooks/useClientPath';
import { PathEntry, TimelineEntry, PillarType, PathEntryType } from '@/types/clientPath';
import { TimelineFilters } from './TimelineFilters';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ClientPathTimelineProps {
  clientId: string;
  clientName: string;
  isCoachView?: boolean;
}

const PILLAR_CONFIG = {
  self_care: { name: 'Self Care', icon: '🧘', color: '#10b981' },
  skills: { name: 'Skills', icon: '🎯', color: '#3b82f6' },
  talent: { name: 'Talent', icon: '⭐', color: '#8b5cf6' },
  brand: { name: 'Brand', icon: '🏆', color: '#f59e0b' },
  economy: { name: 'Economy', icon: '💰', color: '#ef4444' },
};

const TYPE_CONFIG = {
  assessment: { name: 'Bedömning', color: 'hsl(var(--primary))' },
  recommendation: { name: 'AI-råd', color: 'hsl(var(--secondary))' },
  task_completed: { name: 'Genomfört', color: 'hsl(var(--accent))' },
  'check-in': { name: 'Check-in', color: 'hsl(var(--muted))' },
  summary: { name: 'Summering', color: 'hsl(var(--border))' },
  action: { name: 'Åtgärd', color: 'hsl(var(--primary))' },
  note: { name: 'Anteckning', color: 'hsl(var(--muted))' },
};

export const ClientPathTimeline = ({ 
  clientId, 
  clientName, 
  isCoachView = false 
}: ClientPathTimelineProps) => {
  const { entries, loading, filters, setFilters } = useClientPath(clientId);
  const [selectedEntry, setSelectedEntry] = useState<PathEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Transform entries to timeline entries with pillar info and excerpts
  const timelineEntries: TimelineEntry[] = entries.map(entry => {
    const pillarType = entry.metadata?.pillar_type as PillarType;
    const pillarInfo = pillarType ? {
      type: pillarType,
      name: PILLAR_CONFIG[pillarType]?.name || pillarType,
      color: PILLAR_CONFIG[pillarType]?.color || '#6b7280',
      icon: PILLAR_CONFIG[pillarType]?.icon || '📋'
    } : undefined;

    // Create short excerpt (80-100 chars)
    const shortExcerpt = entry.details 
      ? entry.details.length > 100 
        ? entry.details.substring(0, 97) + '...'
        : entry.details
      : 'Ingen beskrivning tillgänglig';

    return {
      ...entry,
      pillarInfo,
      shortExcerpt
    };
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: sv });
    } catch {
      return 'Okänt datum';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: sv });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isCoachView ? 'Historik' : 'Min resa'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-16 h-4 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {isCoachView ? `${clientName}s historik` : 'Min resa'}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          
          {showFilters && (
            <TimelineFilters 
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </CardHeader>

        <CardContent>
          {timelineEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga händelser att visa ännu.</p>
              <p className="text-sm">
                {isCoachView 
                  ? "Klientens utvecklingsresa kommer att visas här." 
                  : "Din utvecklingsresa kommer att visas här när du gör dina första bedömningar."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {timelineEntries.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {/* Timeline line */}
                  {index < timelineEntries.length - 1 && (
                    <div className="absolute left-8 top-12 w-0.5 h-full bg-border" />
                  )}
                  
                  <div 
                    className="flex gap-4 cursor-pointer hover:bg-muted/30 rounded-lg p-3 transition-colors"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {/* Date circle */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white mb-1"
                        style={{ backgroundColor: entry.pillarInfo?.color || TYPE_CONFIG[entry.type]?.color }}
                      >
                        {formatDate(entry.timestamp).split(' ')[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Pillar badge */}
                          {entry.pillarInfo && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${entry.pillarInfo.color}20`,
                                color: entry.pillarInfo.color,
                                borderColor: `${entry.pillarInfo.color}40`
                              }}
                            >
                              {entry.pillarInfo.icon} {entry.pillarInfo.name}
                            </Badge>
                          )}
                          
                          {/* Type badge */}
                          <Badge variant="outline" className="text-xs">
                            {TYPE_CONFIG[entry.type]?.name || entry.type}
                          </Badge>
                          
                          {/* AI generated indicator */}
                          {entry.ai_generated && (
                            <Badge variant="secondary" className="text-xs">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>

                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {entry.title}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.shortExcerpt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Details Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(selectedEntry as TimelineEntry).pillarInfo && (
                <span>{(selectedEntry as TimelineEntry).pillarInfo!.icon}</span>
              )}
              {selectedEntry?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(selectedEntry as TimelineEntry).pillarInfo && (
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${(selectedEntry as TimelineEntry).pillarInfo!.color}20`,
                      color: (selectedEntry as TimelineEntry).pillarInfo!.color,
                      borderColor: `${(selectedEntry as TimelineEntry).pillarInfo!.color}40`
                    }}
                  >
                    {(selectedEntry as TimelineEntry).pillarInfo!.name}
                  </Badge>
                )}
                <Badge variant="outline">
                  {TYPE_CONFIG[selectedEntry.type]?.name || selectedEntry.type}
                </Badge>
                {selectedEntry.ai_generated && (
                  <Badge variant="secondary">
                    <Brain className="h-3 w-3 mr-1" />
                    AI-genererad
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedEntry.timestamp), 'd MMMM yyyy, HH:mm', { locale: sv })}
                </div>
                {selectedEntry.metadata?.assessment_score && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Poäng: {selectedEntry.metadata.assessment_score}/10
                  </div>
                )}
              </div>

              {selectedEntry.details && (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedEntry.details}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};