import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { 
  Brain, 
  Target, 
  BookOpen, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Star,
  Lightbulb,
  Activity
} from 'lucide-react';

interface TimelineEntry {
  id: string;
  entry_type: string;
  title: string;
  description?: string;
  impact_score?: number;
  metadata: any;
  created_at: string;
}

interface CoachingTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

export function CoachingTimeline({ entries, className = '' }: CoachingTimelineProps) {
  const getIcon = (entryType: string) => {
    const iconMap = {
      'session_start': <Brain className="h-4 w-4" />,
      'session_end': <CheckCircle className="h-4 w-4" />,
      'recommendation_created': <Lightbulb className="h-4 w-4" />,
      'recommendation_completed': <Target className="h-4 w-4" />,
      'milestone_achieved': <Star className="h-4 w-4" />,
      'plan_created': <Calendar className="h-4 w-4" />,
      'plan_updated': <Activity className="h-4 w-4" />,
      'reflection': <BookOpen className="h-4 w-4" />,
      'breakthrough': <TrendingUp className="h-4 w-4" />,
      'setback': <Activity className="h-4 w-4" />
    };
    return iconMap[entryType as keyof typeof iconMap] || <Activity className="h-4 w-4" />;
  };

  const getIconColor = (entryType: string) => {
    const colorMap = {
      'session_start': 'text-blue-500',
      'session_end': 'text-green-500',
      'recommendation_created': 'text-yellow-500',
      'recommendation_completed': 'text-green-600',
      'milestone_achieved': 'text-purple-500',
      'plan_created': 'text-indigo-500',
      'plan_updated': 'text-orange-500',
      'reflection': 'text-cyan-500',
      'breakthrough': 'text-emerald-500',
      'setback': 'text-red-500'
    };
    return colorMap[entryType as keyof typeof colorMap] || 'text-gray-500';
  };

  const getTypeDisplayName = (entryType: string) => {
    const nameMap = {
      'session_start': 'Session Startad',
      'session_end': 'Session Avslutad',
      'recommendation_created': 'Ny Rekommendation',
      'recommendation_completed': 'Rekommendation Genomförd',
      'milestone_achieved': 'Milstolpe Uppnådd',
      'plan_created': 'Plan Skapad',
      'plan_updated': 'Plan Uppdaterad',
      'reflection': 'Reflektion',
      'breakthrough': 'Genombrott',
      'setback': 'Utmaning'
    };
    return nameMap[entryType as keyof typeof nameMap] || entryType;
  };

  if (!entries || entries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Utvecklings-timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen utvecklingshistorik än</p>
            <p className="text-sm">Starta en AI coaching-session för att börja spåra din utveckling</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Utvecklings-timeline
          <Badge variant="secondary" className="ml-auto">
            {entries.length} händelser
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline line and icon */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border ${getIconColor(entry.entry_type)}`}>
                  {getIcon(entry.entry_type)}
                </div>
                {index < entries.length - 1 && (
                  <div className="w-px h-6 bg-border mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getTypeDisplayName(entry.entry_type)}
                      </Badge>
                      {entry.impact_score && entry.impact_score > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Impact: {entry.impact_score}/10
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium">{entry.title}</h4>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                    
                    {/* Metadata display */}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.metadata.priority && (
                          <Badge variant="outline" className="text-xs">
                            {entry.metadata.priority}
                          </Badge>
                        )}
                        {entry.metadata.category && (
                          <Badge variant="outline" className="text-xs">
                            {entry.metadata.category}
                          </Badge>
                        )}
                        {entry.metadata.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {entry.metadata.difficulty}
                          </Badge>
                        )}
                        {entry.metadata.completion_rate && (
                          <Badge variant="secondary" className="text-xs">
                            {entry.metadata.completion_rate}% genomfört
                          </Badge>
                        )}
                        {entry.metadata.user_rating && (
                          <Badge variant="secondary" className="text-xs">
                            ⭐ {entry.metadata.user_rating}/5
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: sv })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}