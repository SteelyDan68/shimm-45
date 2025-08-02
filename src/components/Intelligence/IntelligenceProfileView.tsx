import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Brain,
  Target,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Share2,
  Download,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';
import { IntelligenceProfile } from '@/types/intelligenceHub';
import { IntelligenceDataCollector } from './IntelligenceDataCollector';
import { IntelligenceNewsCard } from './IntelligenceNewsCard';
import { IntelligenceSocialCard } from './IntelligenceSocialCard';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface IntelligenceProfileViewProps {
  profile: IntelligenceProfile;
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
}

export function IntelligenceProfileView({ 
  profile, 
  onRefresh, 
  onExport, 
  loading = false 
}: IntelligenceProfileViewProps) {
  
  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'trend': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'recommendation': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Profile Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 text-lg">
                {profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              {profile.category && (
                <Badge variant="secondary" className="mt-2 capitalize">
                  {profile.category.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Datakvalitet</div>
              <div className="flex items-center gap-2">
                <Progress value={profile.dataQuality * 100} className="w-20" />
                <span className="font-medium">{Math.round(profile.dataQuality * 100)}%</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.metrics.length}</div>
              <div className="text-xs text-muted-foreground">Metrics</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.insights.length}</div>
              <div className="text-xs text-muted-foreground">Insights</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{profile.coachingJourney.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Sessioner</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{profile.pillarProgress.length}</div>
              <div className="text-xs text-muted-foreground">Aktiva pillars</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Data Collector */}
            <IntelligenceDataCollector 
              profile={{
                userId: profile.userId,
                displayName: profile.displayName,
                email: profile.email,
                socialProfiles: profile.socialProfiles
              }}
              onDataCollected={onRefresh}
            />
            
            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Senaste Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.insights.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Inga insights tillgängliga
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profile.insights.slice(0, 3).map(insight => (
                      <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getInsightIcon(insight.category)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{insight.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                                {insight.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(insight.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{insight.source}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(insight.timestamp, { addSuffix: true, locale: sv })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Nyckelmetrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.metrics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Inga metrics tillgängliga
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.metrics.slice(0, 6).map(metric => (
                      <div key={metric.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{metric.name.replace('_', ' ')}</span>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <div className="text-2xl font-bold">{metric.value} {metric.unit}</div>
                        <div className="text-xs text-muted-foreground">
                          {metric.category} • {formatDistanceToNow(metric.timestamp, { addSuffix: true, locale: sv })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* News Mentions */}
            <IntelligenceNewsCard 
              newsMentions={profile.newsMentions}
              title="Senaste Nyhetsmentioner"
              maxItems={3}
              showFilters={true}
            />
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <IntelligenceSocialCard 
              socialProfiles={profile.socialProfiles}
              title="Social Media Profiler"
              showGrowthMetrics={true}
              onRefreshPlatform={(platform, handle) => {
                console.log(`Refreshing ${platform} for handle: ${handle}`);
                // Trigger refresh for specific platform
                onRefresh?.();
              }}
            />
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {/* Pillar Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Six Pillars Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.pillarProgress.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Ingen pillar-progress tillgänglig
                  </p>
                ) : (
                  <div className="space-y-4">
                    {profile.pillarProgress.map(pillar => (
                      <div key={pillar.pillarKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{pillar.pillarName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {pillar.currentScore}/{pillar.targetScore}
                            </span>
                            <Badge variant="outline">
                              {Math.round(pillar.progress * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={pillar.progress * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          Senaste bedömning: {formatDistanceToNow(pillar.lastAssessment, { addSuffix: true, locale: sv })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coaching Journey */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Coaching Resa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.coachingJourney.totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Totala sessioner</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{profile.coachingJourney.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Genomsnittligt betyg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{profile.coachingJourney.completedRecommendations}</div>
                    <div className="text-sm text-muted-foreground">Genomförda rekommendationer</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{profile.coachingJourney.activeGoals}</div>
                    <div className="text-sm text-muted-foreground">Aktiva mål</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alla Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.insights.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Inga insights tillgängliga
                  </p>
                ) : (
                  <div className="space-y-4">
                    {profile.insights.map(insight => (
                      <div key={insight.id} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.category)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                                  {insight.severity}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(insight.confidence * 100)}% säkerhet
                                </span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-3">{insight.description}</p>
                            
                            {insight.actionItems && insight.actionItems.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-medium text-sm mb-1">Rekommenderade åtgärder:</h5>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {insight.actionItems.map((action, index) => (
                                    <li key={index}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Källa: {insight.source}</span>
                              <span>•</span>
                              <span>Kategori: {insight.category}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(insight.timestamp, { addSuffix: true, locale: sv })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t bg-gray-50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Senast uppdaterad: {formatDistanceToNow(profile.lastUpdated, { addSuffix: true, locale: sv })}
          </span>
          <div className="flex items-center gap-4">
            <span>Datakällor: {profile.connectedSources.length}</span>
            <span>Privacy: {profile.privacySettings.shareAnalytics ? 'Öppen' : 'Privat'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}