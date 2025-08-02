import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Activity,
  Calendar,
  Award,
  Brain,
  Download,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

interface AnalyticsDashboardProps {
  clientId?: string;
  onBack?: () => void;
  showClientName?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  clientId, 
  onBack, 
  showClientName = true 
}) => {
  const { 
    analyticsData, 
    performanceMetrics, 
    isLoading, 
    timeRange, 
    setTimeRange,
    insights,
    exportAnalytics 
  } = useAnalytics();

  if (isLoading || !analyticsData || !performanceMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Spåra din utveckling och framsteg
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Vecka</SelectItem>
              <SelectItem value="month">Månad</SelectItem>
              <SelectItem value="quarter">Kvartal</SelectItem>
              <SelectItem value="year">År</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportAnalytics('json')}>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Övergripande Framsteg</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overallProgress}%</div>
            <Progress value={analyticsData.overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Velocity Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.velocityScore}</div>
            <p className="text-xs text-muted-foreground">
              Produktivitet: {performanceMetrics.productivityScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inloggningssvit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.loginStreak}</div>
            <p className="text-xs text-muted-foreground">
              dagar i rad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uppgifter Slutförda</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.taskCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              denna period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <Card key={index} className={`
              ${insight.type === 'success' ? 'border-green-200 bg-green-50' : ''}
              ${insight.type === 'warning' ? 'border-orange-200 bg-orange-50' : ''}
              ${insight.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
            `}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pillar Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fem Pelare - Utveckling
          </CardTitle>
          <CardDescription>
            Din utveckling inom varje pelare över tid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.pillarsProgress.map((pillar) => (
              <div key={pillar.pillarKey} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {pillar.pillarKey.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(pillar.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(pillar.trend)}`}>
                        {pillar.currentScore.toFixed(1)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {pillar.trend === 'up' ? '+' : pillar.trend === 'down' ? '' : '±'}
                        {Math.abs(pillar.change).toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={(pillar.currentScore / 10) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Aktiva Mål
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.goalProgress.map((goal) => (
              <div key={goal.goalId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.progress}/{goal.target}
                  </span>
                </div>
                <Progress value={(goal.progress / goal.target) * 100} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs capitalize">
                    {goal.category.replace('_', ' ')}
                  </Badge>
                  {goal.deadline && (
                    <span>
                      Deadline: {new Date(goal.deadline).toLocaleDateString('sv-SE')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Aktivitetssammanfattning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {analyticsData.totalSessions}
                </div>
                <p className="text-sm text-muted-foreground">Totala sessioner</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {analyticsData.averageSessionDuration.toFixed(1)}m
                </div>
                <p className="text-sm text-muted-foreground">Snitt sessionstid</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Stefan Interaktioner
              </h4>
              <div className="flex justify-between text-sm">
                <span>Totala chattningar:</span>
                <span className="font-medium">{analyticsData.stefanInteractions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Följda rekommendationer:</span>
                <span className="font-medium">{analyticsData.aiRecommendationsFollowed}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Engagemang
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Engagemangsnivå:</span>
                <Badge 
                  variant={performanceMetrics.engagementLevel === 'high' ? 'default' : 
                          performanceMetrics.engagementLevel === 'medium' ? 'secondary' : 'outline'}
                  className="capitalize"
                >
                  {performanceMetrics.engagementLevel === 'high' ? 'Hög' :
                   performanceMetrics.engagementLevel === 'medium' ? 'Medium' : 'Låg'}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">Konsistens</div>
                <Progress value={analyticsData.consistencyScore} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {analyticsData.consistencyScore}% konsistens
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {performanceMetrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Stefan's Rekommendationer
            </CardTitle>
            <CardDescription>
              Baserat på din aktivitet och framsteg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceMetrics.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};