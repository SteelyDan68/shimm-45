/**
 * 🚀 REAL-TIME OPTIMIZATION ENGINE
 * SCRUM-TEAM FAS 6 IMPLEMENTATION
 * 
 * Dynamic system optimization baserat på real-time metrics
 * Budget: 1 miljard kronor development standard
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Brain, 
  CheckCircle,
  Eye,
  MousePointer2,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  Zap 
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/utils/advancedAnalytics';
import { usePerformanceMonitoringV2 } from '@/utils/performanceOptimizationV2';

interface OptimizationSuggestion {
  type: 'performance' | 'ui' | 'conversion' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: number;
}

interface UserBehaviorInsight {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

const LiveOptimizationDashboard: React.FC = React.memo(() => {
  usePerformanceMonitoringV2('LiveOptimizationDashboard');
  
  const { metrics, trackCustomEvent } = useAdvancedAnalytics();
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [behaviorInsights, setBehaviorInsights] = useState<UserBehaviorInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());

  // Analyze metrics and generate optimization suggestions
  const analyzeMetrics = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const suggestions: OptimizationSuggestion[] = [];
      const insights: UserBehaviorInsight[] = [];

      // Performance analysis
      if (metrics.performance?.summary?.avg > 16) {
        suggestions.push({
          type: 'performance',
          severity: 'high',
          title: 'Slow Render Performance Detected',
          description: `Average render time is ${metrics.performance.summary.avg.toFixed(1)}ms, exceeding the 16ms target.`,
          impact: 'Users experience laggy interactions and poor responsiveness',
          implementation: 'Implement React.memo, useMemo, and useCallback optimizations',
          estimatedImprovement: 60
        });
      }

      // Error rate analysis
      if (metrics.javascript_error?.count > 5) {
        suggestions.push({
          type: 'error',
          severity: 'critical',
          title: 'High Error Rate Detected',
          description: `${metrics.javascript_error.count} JavaScript errors in the current session`,
          impact: 'Degraded user experience and potential functionality loss',
          implementation: 'Review error logs and implement proper error boundaries',
          estimatedImprovement: 85
        });
      }

      // User interaction analysis
      if (metrics.user_interaction?.count > 0) {
        const clickData = metrics.user_interaction.latest;
        if (clickData?.coordinates) {
          insights.push({
            pattern: 'High click concentration on specific elements',
            frequency: metrics.user_interaction.count,
            impact: 'positive',
            recommendation: 'Consider making frequently clicked elements more prominent'
          });
        }
      }

      // Scroll behavior analysis
      if (metrics.scroll_depth?.latest?.depth < 50) {
        insights.push({
          pattern: 'Low scroll engagement',
          frequency: 1,
          impact: 'negative',
          recommendation: 'Improve above-the-fold content and add engaging elements'
        });
      }

      // Conversion optimization
      if (metrics.page_visibility?.count > 3) {
        suggestions.push({
          type: 'conversion',
          severity: 'medium',
          title: 'High Tab Switching Detected',
          description: 'Users frequently switch away from the page',
          impact: 'Reduced engagement and potential conversion loss',
          implementation: 'Add progress indicators and reduce cognitive load',
          estimatedImprovement: 30
        });
      }

      // Mobile optimization
      const isMobile = window.innerWidth < 768;
      if (isMobile && metrics.user_interaction?.count < 5) {
        suggestions.push({
          type: 'ui',
          severity: 'medium',
          title: 'Low Mobile Engagement',
          description: 'Mobile users showing low interaction rates',
          impact: 'Poor mobile user experience',
          implementation: 'Optimize touch targets and mobile-specific interactions',
          estimatedImprovement: 45
        });
      }

      setOptimizations(suggestions);
      setBehaviorInsights(insights);
      setLastAnalysis(new Date());
      
      trackCustomEvent('optimization_analysis_completed', {
        suggestionsCount: suggestions.length,
        insightsCount: insights.length
      });
      
    } catch (error) {
      console.error('Failed to analyze metrics:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [metrics, trackCustomEvent]);

  // Auto-analyze every 30 seconds
  useEffect(() => {
    const interval = setInterval(analyzeMetrics, 30000);
    return () => clearInterval(interval);
  }, [analyzeMetrics]);

  // Real-time metrics summary
  const metricsSummary = useMemo(() => {
    const totalEvents = Object.values(metrics).reduce((sum, metric: any) => sum + (metric.count || 0), 0);
    const errorRate = metrics.javascript_error?.count || 0;
    const performanceScore = metrics.performance?.summary?.avg 
      ? Math.max(0, 100 - (metrics.performance.summary.avg - 16) * 2)
      : 95;
    
    return {
      totalEvents,
      errorRate,
      performanceScore,
      activeMetrics: Object.keys(metrics).length
    };
  }, [metrics]);

  // Severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Live Optimization Engine
          </h1>
          <p className="text-muted-foreground">
            Real-time system optimization baserat på user behavior analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last analysis: {lastAnalysis.toLocaleTimeString()}
          </span>
          <Button 
            onClick={analyzeMetrics}
            disabled={isAnalyzing}
            variant="outline"
          >
            <Target className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Analyze Now
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Zap className="h-5 w-5 text-performance" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metricsSummary.performanceScore.toFixed(1)}%
            </div>
            <Progress value={metricsSummary.performanceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-5 w-5 text-activity" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metricsSummary.totalEvents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tracking {metricsSummary.activeMetrics} metric types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metricsSummary.errorRate}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Errors this session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Math.max(0, 100 - optimizations.length * 10)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              System health score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="optimizations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimizations">Optimization Suggestions</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Metrics</TabsTrigger>
        </TabsList>

        {/* Optimization Suggestions */}
        <TabsContent value="optimizations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Optimization Opportunities</h3>
            <Badge variant="outline">
              {optimizations.length} suggestions
            </Badge>
          </div>

          {optimizations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-foreground">System Fully Optimized</h4>
                  <p className="text-muted-foreground">
                    No optimization opportunities detected at this time
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {optimizations.map((opt, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="outline" className={getSeverityColor(opt.severity)}>
                            {opt.severity.toUpperCase()}
                          </Badge>
                          {opt.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {opt.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-success">
                          +{opt.estimatedImprovement}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Est. improvement
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm mb-1">Impact:</h5>
                        <p className="text-sm text-muted-foreground">{opt.impact}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-1">Implementation:</h5>
                        <p className="text-sm text-muted-foreground">{opt.implementation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* User Behavior Insights */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Behavior Insights</h3>
            <Badge variant="outline">
              {behaviorInsights.length} insights
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {behaviorInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-5 w-5" />
                    {insight.pattern}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Frequency:</span>
                      <Badge variant="outline">{insight.frequency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Impact:</span>
                      <Badge 
                        variant="outline" 
                        className={
                          insight.impact === 'positive' ? 'text-success' :
                          insight.impact === 'negative' ? 'text-destructive' :
                          'text-muted-foreground'
                        }
                      >
                        {insight.impact}
                      </Badge>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-1">Recommendation:</h5>
                      <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Real-time Metrics */}
        <TabsContent value="realtime" className="space-y-4">
          <h3 className="text-lg font-semibold">Live System Metrics</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(metrics).map(([type, data]: [string, any]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">
                    {type.replace(/_/g, ' ')}
                  </CardTitle>
                  <CardDescription>
                    {data.count} events recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.summary && (
                    <div className="space-y-2">
                      {typeof data.summary.avg === 'number' && (
                        <div className="flex justify-between">
                          <span className="text-sm">Average:</span>
                          <span className="text-sm font-medium">
                            {data.summary.avg.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {typeof data.summary.max === 'number' && (
                        <div className="flex justify-between">
                          <span className="text-sm">Maximum:</span>
                          <span className="text-sm font-medium">
                            {data.summary.max.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {data.latest && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-xs font-medium mb-2">Latest Event:</h5>
                      <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto max-h-20">
                        {JSON.stringify(data.latest, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

LiveOptimizationDashboard.displayName = 'LiveOptimizationDashboard';

export default LiveOptimizationDashboard;