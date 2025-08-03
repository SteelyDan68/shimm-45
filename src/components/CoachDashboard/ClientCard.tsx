import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight,
  Brain,
  Target,
  Calendar,
  Star
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { ClientPriority, ClientIssue } from '@/hooks/useCoachDashboard';
import { CapacityBarometer } from '@/components/CapacityBarometer';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';

interface ClientCardProps {
  client: ClientPriority;
}

const getIssueIcon = (type: ClientIssue['type']) => {
  switch (type) {
    case 'new_barriers': return AlertTriangle;
    case 'incomplete_tasks': return Clock;
    case 'negative_sentiment': return TrendingDown;
    case 'inactive': return Calendar;
    default: return AlertTriangle;
  }
};

const getIssueColor = (severity: ClientIssue['severity']) => {
  switch (severity) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getPriorityColor = (score: number) => {
  if (score > 50) return 'text-red-600 bg-red-50';
  if (score > 25) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
};

const getVelocityColor = (rank: number) => {
  if (rank <= 3) return 'text-red-600 bg-red-50';
  if (rank <= 6) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
};

export function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();
  const { getActivatedPillars, generateHeatmapData } = useSixPillarsModular(client.id);
  
  const activatedPillars = getActivatedPillars();
  const heatmapData = generateHeatmapData();

  const highestSeverityIssue = client.issues.reduce((highest, issue) => {
    const severityOrder = { low: 1, medium: 2, high: 3 };
    return severityOrder[issue.severity] > severityOrder[highest.severity] ? issue : highest;
  }, client.issues[0]);

  const handleViewClient = () => {
    console.log('🔥🔥🔥 ClientCard: CLICK DETECTED - client:', client);
    console.log('🔥🔥🔥 ClientCard: Navigating to:', `/user/${client.id}?context=client`);
    navigate(`/user/${client.id}?context=client`);
    console.log('🔥🔥🔥 ClientCard: Navigate called successfully');
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {client.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {client.category}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${getPriorityColor(client.priority_score)}`}
              >
                Prioritet: {client.priority_score}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Velocity</div>
            <Badge 
              variant="outline" 
              className={`${getVelocityColor(client.velocity_rank)}`}
            >
              {client.velocity_rank}/10
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Issues */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Aktiva problem ({client.issues.length})</h4>
          <div className="space-y-1">
            {client.issues.slice(0, 2).map((issue, index) => {
              const IssueIcon = getIssueIcon(issue.type);
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-2 text-xs p-2 rounded border ${getIssueColor(issue.severity)}`}
                >
                  <IssueIcon className="h-3 w-3" />
                  <span className="flex-1">{issue.description}</span>
                  {issue.days_since && (
                    <span className="font-medium">{issue.days_since}d</span>
                  )}
                </div>
              );
            })}
            {client.issues.length > 2 && (
              <div className="text-xs text-muted-foreground pl-5">
                +{client.issues.length - 2} fler problem...
              </div>
            )}
          </div>
        </div>

        {/* Latest AI Recommendation */}
        {client.latest_ai_recommendation && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Senaste AI-rekommendation
            </h4>
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {client.latest_ai_recommendation}
            </p>
          </div>
        )}

        {/* Next Planned Action */}
        {client.next_planned_action && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Target className="h-3 w-3" />
              Nästa steg
            </h4>
            <div className="flex items-center gap-2 text-xs bg-primary/5 p-2 rounded">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span className="flex-1">{client.next_planned_action}</span>
            </div>
          </div>
        )}

        {/* Kapacitetsbarometer - Compact version */}
        <CapacityBarometer 
          clientId={client.id} 
          variant="compact" 
          showTitle={false}
        />

        {/* Assessment Progress */}
        {client.assessment_scores && Object.keys(client.assessment_scores).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Hinder-nivå</h4>
            <div className="space-y-1">
              {Object.entries(client.assessment_scores)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([area, score]) => (
                  <div key={area} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 truncate">{area}</span>
                    <Progress value={score * 10} className="flex-1 h-1" />
                    <span className="text-xs font-medium w-8">{score}/10</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Six Pillars Mini-Heatmap */}
        {activatedPillars.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Star className="h-3 w-3" />
              Six Pillars ({activatedPillars.length}/6 aktiva)
            </h4>
            <div className="grid grid-cols-3 gap-1">
              {heatmapData.slice(0, 6).map((pillar) => {
                const getScoreColor = (score: number) => {
                  if (score === 0) return '#gray';
                  if (score <= 3) return '#ef4444'; // 🔴 Kritisk
                  if (score <= 6) return '#f97316'; // 🟠 Utmaning  
                  return '#22c55e'; // 🟢 Stark
                };
                
                return (
                  <div key={pillar.pillar_key} className="flex items-center gap-1 text-xs">
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: getScoreColor(pillar.score) }} 
                    />
                    <span className="flex-1 truncate">{pillar.name}</span>
                    {pillar.score > 0 && (
                      <span className="font-medium text-[10px]">{pillar.score.toFixed(1)}</span>
                    )}
                  </div>
                );
              })}
              {heatmapData.length > 6 && (
                <div className="text-xs text-muted-foreground col-span-3 text-center">
                  +{heatmapData.length - 6} fler...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Uppdaterad: {formatDistanceToNow(new Date(client.last_updated), { 
              addSuffix: true, 
              locale: sv 
            })}
          </span>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleViewClient}
            className="text-xs"
          >
            Visa klient
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}