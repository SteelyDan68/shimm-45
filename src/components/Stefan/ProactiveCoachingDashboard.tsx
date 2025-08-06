import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Heart,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { useStefanProactiveCoaching } from '@/hooks/useStefanProactiveCoaching';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';

/**
 * 🎯 PROACTIVE COACHING DASHBOARD - SPRINT 2
 * Advanced Stefan coaching interface med AI-driven insights
 */

export const ProactiveCoachingDashboard: React.FC = () => {
  const {
    coachingMetrics,
    isAnalyzing,
    analyzeCoachingNeeds,
    checkProactiveInterventions,
    getCoachingInsights
  } = useStefanProactiveCoaching();
  
  const { getInterventionStats } = useStefanInterventions();
  
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const handleProactiveCheck = async () => {
    setIsRunningCheck(true);
    await checkProactiveInterventions();
    setIsRunningCheck(false);
  };

  const interventionStats = getInterventionStats();
  const insights = getCoachingInsights();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Stefan Proaktiv Coaching
          </h2>
          <p className="text-muted-foreground">
            AI-driven coaching insights och proaktiva interventioner
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={analyzeCoachingNeeds}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyserar...' : 'Uppdatera Analys'}
          </Button>
          <Button 
            onClick={handleProactiveCheck}
            disabled={isRunningCheck}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isRunningCheck ? 'Kontrollerar...' : 'Kör Check-in'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="interventions">Interventioner</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Coaching Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Coaching Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Intervention Behov</span>
                    <Badge 
                      variant={coachingMetrics?.interventionNeeded ? 
                        getUrgencyColor(coachingMetrics.urgencyLevel) : 'outline'
                      }
                    >
                      {coachingMetrics?.interventionNeeded ? 'Ja' : 'Nej'}
                    </Badge>
                  </div>
                  
                  {coachingMetrics?.interventionType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Typ</span>
                      <span className="text-sm font-medium capitalize">
                        {coachingMetrics.interventionType}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Urgency</span>
                    <Badge variant={getUrgencyColor(coachingMetrics?.urgencyLevel || 'low')}>
                      {coachingMetrics?.urgencyLevel || 'Low'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Trends */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Assessment Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Utveckling</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(coachingMetrics?.assessmentTrends || 'stable')}
                      <span className="text-sm font-medium capitalize">
                        {coachingMetrics?.assessmentTrends || 'Stable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Aktivitet</span>
                    <span className="text-sm font-medium">
                      {coachingMetrics?.recentActivity || 0} senaste veckan
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intervention Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Intervention Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Totalt</span>
                    <span className="text-sm font-medium">{interventionStats.total}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Svarsfrekvens</span>
                    <span className="text-sm font-medium">{interventionStats.responseRate}%</span>
                  </div>
                  
                  <Progress value={interventionStats.responseRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pillar Performance</CardTitle>
              <CardDescription>
                Aktuella scores för alla aktiverade pillars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coachingMetrics?.pillarScores && Object.keys(coachingMetrics.pillarScores).length > 0 ? (
                  Object.entries(coachingMetrics.pillarScores).map(([pillar, score]) => (
                    <div key={pillar} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{pillar.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">{score}/5</span>
                      </div>
                      <Progress value={(score / 5) * 100} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Inga pillar-assessments hittades</p>
                    <p className="text-sm">Genomför assessments för att se metrics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Insights</CardTitle>
              <CardDescription>
                AI-genererade insights baserat på användardata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights && insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="mt-0.5">
                        {insight.type === 'concern' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {insight.type === 'success' && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {insight.type === 'alert' && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {insight.type === 'celebration' && <Sparkles className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{insight.message}</p>
                      </div>
                      <Badge variant={getUrgencyColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Inga insights tillgängliga ännu</p>
                    <p className="text-sm">Kör analys för att generera insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Urgent</span>
                    <Badge variant="destructive">{interventionStats.priorityStats.urgent}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High</span>
                    <Badge variant="destructive">{interventionStats.priorityStats.high}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium</span>
                    <Badge variant="secondary">{interventionStats.priorityStats.medium}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low</span>
                    <Badge variant="secondary">{interventionStats.priorityStats.low}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {interventionStats.avgEffectiveness || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-medium">{interventionStats.responseRate}%</span>
                  </div>
                  <Progress value={interventionStats.responseRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};