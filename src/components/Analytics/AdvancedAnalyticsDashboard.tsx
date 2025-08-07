import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  Brain,
  Zap,
  Users,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: 'performance' | 'engagement' | 'growth' | 'prediction';
  timeframe: string;
  confidence: number;
}

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  timeHorizon: string;
  recommendations: string[];
  dataPoints: number;
}

interface ChartData {
  name: string;
  value: number;
  trend?: number;
  prediction?: number;
  confidence?: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Simulate advanced analytics data - Replace with real Supabase queries
  const generateMockData = useMemo(() => {
    const mockMetrics: AnalyticsMetric[] = [
      {
        id: '1',
        name: 'Coaching Velocity',
        value: 87.3,
        change: 12.5,
        trend: 'up',
        category: 'performance',
        timeframe: '30 days',
        confidence: 94.2
      },
      {
        id: '2', 
        name: 'Goal Achievement Rate',
        value: 73.8,
        change: -3.2,
        trend: 'down',
        category: 'performance',
        timeframe: '30 days',
        confidence: 89.1
      },
      {
        id: '3',
        name: 'User Engagement Score',
        value: 8.7,
        change: 15.3,
        trend: 'up',
        category: 'engagement',
        timeframe: '7 days',
        confidence: 91.5
      },
      {
        id: '4',
        name: 'Predictive Success Rate',
        value: 82.1,
        change: 7.8,
        trend: 'up',
        category: 'prediction',
        timeframe: 'Next 30 days',
        confidence: 86.3
      }
    ];

    const mockInsights: PredictiveInsight[] = [
      {
        id: '1',
        title: 'Höjd risk för avhopp nästa vecka',
        description: 'AI-modellen förutspår 23% högre risk för användaravhopp baserat på aktivitetsmönster och engagemang.',
        probability: 76.3,
        impact: 'high',
        category: 'retention',
        timeHorizon: '7 dagar',
        recommendations: [
          'Implementera proaktiv outreach för riskgrupper',
          'Anpassa coaching-intensitet baserat på användarpreferenser',
          'Optimera onboarding för nya användare'
        ],
        dataPoints: 847
      },
      {
        id: '2',
        title: 'Optimal tid för coaching-sessioner',
        description: 'Data visar att sessioner mellan 14:00-16:00 har 34% högre completion rate.',
        probability: 89.2,
        impact: 'medium',
        category: 'optimization',
        timeHorizon: 'Nästa månaden',
        recommendations: [
          'Föreslå optimala tider baserat på användarens historik',
          'Implementera smart schemaläggning',
          'Anpassa påminnelser efter zeitgeist'
        ],
        dataPoints: 1247
      },
      {
        id: '3',
        title: 'Pillar-prestanda prediktion',
        description: 'Användare med hög aktivitet i "Self Care" har 67% högre sannolikhet att lyckas med andra pelare.',
        probability: 91.7,
        impact: 'high',
        category: 'performance',
        timeHorizon: '3 månader',
        recommendations: [
          'Prioritera Self Care som grundpelare',
          'Skapa cross-pillar coaching strategier',
          'Utveckla holistiskt utvecklingsramverk'
        ],
        dataPoints: 2103
      }
    ];

    const mockChartData: ChartData[] = [
      { name: 'Jan', value: 65, trend: 5, prediction: 72, confidence: 85 },
      { name: 'Feb', value: 72, trend: 7, prediction: 78, confidence: 87 },
      { name: 'Mar', value: 78, trend: 6, prediction: 84, confidence: 89 },
      { name: 'Apr', value: 84, trend: 6, prediction: 89, confidence: 91 },
      { name: 'Maj', value: 89, trend: 5, prediction: 93, confidence: 88 },
      { name: 'Jun', value: 93, trend: 4, prediction: 96, confidence: 90 }
    ];

    return { mockMetrics, mockInsights, mockChartData };
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        
        // Simulate API calls - Replace with real Supabase queries
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMetrics(generateMockData.mockMetrics);
        setInsights(generateMockData.mockInsights);
        setChartData(generateMockData.mockChartData);
        
        toast({
          title: "Analytics Loaded",
          description: "Advanced analytics dashboard ready!",
        });
      } catch (error) {
        console.error('Analytics loading error:', error);
        toast({
          title: "Analytics Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadAnalytics();
    }
  }, [user, generateMockData, toast]);

  const renderMetricCard = (metric: AnalyticsMetric) => {
    const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Activity;
    const trendColor = metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-yellow-500';

    return (
      <Card key={metric.id} className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            <Badge variant={metric.category === 'prediction' ? 'default' : 'secondary'}>
              {metric.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">{metric.value.toFixed(1)}</div>
            <div className={`flex items-center space-x-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{Math.abs(metric.change).toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Confidence</span>
              <span>{metric.confidence.toFixed(1)}%</span>
            </div>
            <Progress value={metric.confidence} className="h-1" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{metric.timeframe}</p>
        </CardContent>
      </Card>
    );
  };

  const renderInsightCard = (insight: PredictiveInsight) => {
    const impactColor = insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary';
    const ImpactIcon = insight.impact === 'high' ? AlertTriangle : insight.impact === 'medium' ? Target : Brain;

    return (
      <Card key={insight.id} className="relative">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <ImpactIcon className="h-5 w-5" />
              <CardTitle className="text-base">{insight.title}</CardTitle>
            </div>
            <Badge variant={impactColor}>{insight.impact} impact</Badge>
          </div>
          <CardDescription>{insight.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Probability:</span>
              <span className="text-sm font-bold">{insight.probability.toFixed(1)}%</span>
            </div>
            <Progress value={insight.probability} className="h-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Time Horizon: {insight.timeHorizon}</span>
              <span>Data Points: {insight.dataPoints.toLocaleString()}</span>
            </div>
            
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">AI Recommendations:</p>
              <ul className="text-xs space-y-1">
                {insight.recommendations.slice(0, 2).map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-1">
                    <span className="text-primary">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">Enterprise-grade insights och prediktiv intelligens</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>AI Powered</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Real-time</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map(renderMetricCard)}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="prediction" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {insights.map(renderInsightCard)}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Automatiska insights baserade på användardata och beteendemönster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "Användare som genomför morning routines har 34% högre måluppfyllelse",
                  "Peak performance tid är 14:00-16:00 för 73% av användarna", 
                  "Self-care aktiviteter korrelerar starkt med overall wellbeing (r=0.87)",
                  "Coaching sessions på måndagar har 28% högre completion rate"
                ].map((insight, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Brain className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confidence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="confidence" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};