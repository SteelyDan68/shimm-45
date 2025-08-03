import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, TrendingUp, CheckSquare, Calendar, Brain, Target, 
  AlertCircle, Clock, ArrowRight, Activity, Star, FileText
} from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRealCoachDashboard } from '@/hooks/useRealCoachDashboard';
import { format, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function RealCoachDashboard() {
  const { clients, coachStats, loading, refreshData } = useRealCoachDashboard();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default'; 
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'inactive': return Calendar;
      case 'low_progress': return TrendingUp;
      case 'abandoned_assessments': return FileText;
      case 'overdue_tasks': return Clock;
      default: return AlertCircle;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600'; 
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/user/${clientId}?context=client`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Laddar coach-dashboard...</CardTitle>
                <p className="text-muted-foreground">Hämtar verklig klient-data</p>
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Välkomst-header */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Välkommen, {profile?.first_name || 'Coach'}!
                  <HelpTooltip content="Din realtids-dashboard baserad på verklig klient-data från databasen" />
                </CardTitle>
                <p className="text-muted-foreground">
                  Här är en översikt av dina klienter och deras aktuella status <Badge variant="outline" className="ml-2">Live Data</Badge>
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {coachStats.totalActiveClients}
              </div>
              <p className="text-sm text-muted-foreground">Aktiva klienter</p>
              <Badge variant="outline" className="mt-1">
                {clients.filter(c => c.real_issues.length > 0).length} behöver uppmärksamhet
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Verkliga Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Genomsnittlig framsteg
              <HelpTooltip content="Verkligt medelvärde från user_journey_tracking tabellen" />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProgressColor(coachStats.avgProgressAcrossClients)}`}>
              {coachStats.avgProgressAcrossClients}%
            </div>
            <Progress value={coachStats.avgProgressAcrossClients} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Baserat på faktisk data
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Aktiva bedömningar
              <HelpTooltip content="Pågående assessments från assessment_states tabellen" />
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachStats.pendingAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Påbörjade men ej slutförda
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Slutförda uppgifter
              <HelpTooltip content="Verkliga task completions från tasks tabellen" />
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{coachStats.completedTasksThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              senaste 7 dagarna
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Kommande events
              <HelpTooltip content="Från calendar_events tabellen" />
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{coachStats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">
              schemalagda aktiviteter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Verkliga klientdata */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Verklig klient-data
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Live från databas
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <Activity className="h-4 w-4 mr-1" />
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga klienter tilldelade</h3>
              <p className="text-muted-foreground">
                Du har för närvarande inga aktiva klient-tilldelningar i databasen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map(client => (
                <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={client.avatar_url} />
                          <AvatarFallback>
                            {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {client.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {client.current_phase}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progression */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Framsteg</span>
                        <span className={`text-sm font-bold ${getProgressColor(client.overall_progress)}`}>
                          {client.overall_progress}%
                        </span>
                      </div>
                      <Progress value={client.overall_progress} className="h-2" />
                    </div>

                    {/* Aktivitets-metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-bold">{client.activity_metrics.days_since_last_activity}</div>
                        <div className="text-muted-foreground">dagar sedan aktivitet</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-bold">{Math.round(client.activity_metrics.task_completion_rate)}%</div>
                        <div className="text-muted-foreground">uppgifter slutförda</div>
                      </div>
                    </div>

                    {/* Aktiva bedömningar */}
                    {client.active_assessments.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Pågående bedömningar ({client.active_assessments.length})
                        </h5>
                        {client.active_assessments.slice(0, 2).map(assessment => (
                          <div key={assessment.id} className="text-xs bg-blue-50 p-2 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{assessment.assessment_type}</span>
                              <span>{assessment.progress_percentage}%</span>
                            </div>
                            <div className="text-muted-foreground">
                              Steg: {assessment.current_step}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Six Pillars status */}
                    {client.pillar_activations.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Six Pillars ({client.pillar_activations.filter(p => p.is_active).length}/6 aktiva)
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {client.pillar_activations.filter(p => p.is_active).slice(0, 4).map(pillar => (
                            <Badge key={pillar.pillar_key} variant="secondary" className="text-xs">
                              {pillar.pillar_key}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verkliga issues */}
                    {client.real_issues.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-orange-600">
                          Problem som kräver uppmärksamhet ({client.real_issues.length})
                        </h5>
                        {client.real_issues.slice(0, 2).map((issue, index) => {
                          const IssueIcon = getIssueIcon(issue.type);
                          return (
                            <div key={index} className={`text-xs p-2 rounded border flex items-center gap-2`}>
                              <IssueIcon className="h-3 w-3" />
                              <span className="flex-1">{issue.description}</span>
                              <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                                {issue.severity}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Last activity */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Senaste aktivitet: {formatDistanceToNow(new Date(client.last_activity_at), { 
                          addSuffix: true, 
                          locale: sv 
                        })}
                      </span>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewClient(client.id)}
                        className="text-xs"
                      >
                        Visa klient
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Översikts-statistik */}
      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Verklig databas-översikt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{clients.length}</div>
                <div className="text-sm text-muted-foreground">Totala klienter</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {coachStats.clientsWithRecentActivity}
                </div>
                <div className="text-sm text-muted-foreground">Aktiva (7 dagar)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {clients.filter(c => c.real_issues.some(i => i.severity === 'high')).length}
                </div>
                <div className="text-sm text-muted-foreground">Hög prioritet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {clients.reduce((sum, c) => sum + c.active_assessments.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Pågående assessments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {clients.reduce((sum, c) => sum + c.pending_tasks.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Väntande uppgifter</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}