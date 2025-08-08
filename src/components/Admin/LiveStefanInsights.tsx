import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAdminLiveInsights } from '@/hooks/useAdminLiveInsights';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  RefreshCw
} from 'lucide-react';

export const LiveStefanInsights: React.FC = () => {
  const { insights, loading, error, lastUpdated, refreshInsights } = useAdminLiveInsights();

  if (loading && !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse text-purple-600" />
            Stefan AI - Liveinsikter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Stefan AI - Insights (Offline)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Kunde inte ladda live insights. {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshInsights}
                className="ml-2"
              >
                Försök igen
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getInsightTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-orange-800';
      case 'critical':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stefan AI Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Stefan AI - Administratörsinsikter
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Live Data
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshInsights}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Senast uppdaterad: {lastUpdated.toLocaleTimeString('sv-SE')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights?.insights.map((insight, index) => (
            <div 
              key={insight.id} 
              className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-2 mb-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${getInsightTextColor(insight.type)}`}>
                    {insight.title}
                  </h4>
                  <p className={`text-xs mt-1 ${getInsightTextColor(insight.type)} opacity-80`}>
                    {insight.description}
                  </p>
                </div>
                <Badge 
                  variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {insight.priority === 'high' ? 'Hög' : insight.priority === 'medium' ? 'Medel' : 'Låg'}
                </Badge>
              </div>
              
              {insight.actionText && (
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  {insight.actionText}
                </Button>
              )}
            </div>
          ))}

          {(!insights?.insights || insights.insights.length === 0) && (
            <div className="p-4 text-center text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Stefan AI analyserar systemdata...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Actions */}
      {insights?.priorityActions && insights.priorityActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              Prioriterade Åtgärder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {insights.priorityActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      action.urgency === 'high' ? 'bg-red-500 text-white' :
                      action.urgency === 'medium' ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {action.type === 'client-outreach' ? <Users className="h-4 w-4" /> :
                       action.type === 'stefan-review' ? <Brain className="h-4 w-4" /> :
                       <Target className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {action.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pillar Performance Summary */}
      {insights?.pillarStats && Object.keys(insights.pillarStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Pillar-prestanda Sammanfattning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(insights.pillarStats)
                .sort(([,a], [,b]) => b.completionRate - a.completionRate)
                .map(([pillar, stats]) => (
                <div key={pillar} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{pillar}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(stats.completionRate)}% completion
                      </span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium">{stats.avgScore.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">avg score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Summary */}
      {insights?.clientsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Klientaktivitet Översikt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {insights.clientsData.total}
                </div>
                <p className="text-xs text-muted-foreground">Totala klienter</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {insights.clientsData.active}
                </div>
                <p className="text-xs text-muted-foreground">Aktiva (5 dagar)</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {insights.clientsData.inactive}
                </div>
                <p className="text-xs text-muted-foreground">Inaktiva</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};