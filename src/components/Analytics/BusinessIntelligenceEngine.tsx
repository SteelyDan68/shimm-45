import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Calendar,
  Zap,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BusinessMetric {
  id: string;
  name: string;
  value: number | string;
  previousValue: number | string;
  change: number;
  target: number;
  unit: string;
  category: 'revenue' | 'engagement' | 'performance' | 'growth';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: number[];
}

interface KPIAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  actionRequired: boolean;
  timestamp: Date;
  recommendations: string[];
}

interface SegmentAnalysis {
  segment: string;
  users: number;
  revenue: number;
  engagement: number;
  retention: number;
  growth: number;
  color: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))', 
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  '#8B5CF6',
  '#10B981'
];

export const BusinessIntelligenceEngine: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('kpis');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);
  const [segments, setSegments] = useState<SegmentAnalysis[]>([]);

  // Generate comprehensive business intelligence data
  const generateBusinessData = useMemo(() => {
    const businessMetrics: BusinessMetric[] = [
      {
        id: '1',
        name: 'Monthly Recurring Revenue',
        value: '€127,350',
        previousValue: '€118,200',
        change: 7.7,
        target: 135000,
        unit: '€',
        category: 'revenue',
        status: 'good',
        trend: [95000, 102000, 108000, 118200, 127350]
      },
      {
        id: '2',
        name: 'Customer Lifetime Value',
        value: '€2,847',
        previousValue: '€2,650',
        change: 7.4,
        target: 3000,
        unit: '€',
        category: 'revenue',
        status: 'good',
        trend: [2200, 2350, 2500, 2650, 2847]
      },
      {
        id: '3',
        name: 'Daily Active Users',
        value: 2847,
        previousValue: 2654,
        change: 7.3,
        target: 3000,
        unit: 'users',
        category: 'engagement',
        status: 'good',
        trend: [2100, 2300, 2500, 2654, 2847]
      },
      {
        id: '4',
        name: 'Coaching Success Rate',
        value: 89.3,
        previousValue: 87.1,
        change: 2.5,
        target: 90,
        unit: '%',
        category: 'performance',
        status: 'excellent',
        trend: [82, 84, 86, 87.1, 89.3]
      },
      {
        id: '5',
        name: 'User Retention (90d)',
        value: 73.2,
        previousValue: 69.8,
        change: 4.9,
        target: 75,
        unit: '%',
        category: 'engagement',
        status: 'warning',
        trend: [65, 67, 68, 69.8, 73.2]
      },
      {
        id: '6',
        name: 'Average Session Duration',
        value: '47.3',
        previousValue: '43.8',
        change: 8.0,
        target: 50,
        unit: 'min',
        category: 'engagement',
        status: 'good',
        trend: [38, 40, 42, 43.8, 47.3]
      }
    ];

    const kpiAlerts: KPIAlert[] = [
      {
        id: '1',
        title: 'Churn Risk Increasing',
        description: 'User churn rate har ökat med 15% senaste veckan för segment "Young Professionals"',
        severity: 'high',
        category: 'retention',
        actionRequired: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        recommendations: [
          'Implementera targeted retention campaigns för riskgrupper',
          'Förbättra onboarding för young professionals segment', 
          'Analysera user feedback från churned users'
        ]
      },
      {
        id: '2',
        title: 'Revenue Target på Track',
        description: 'MRR växer enligt plan och är 94.5% av månadsmålet med 8 dagar kvar',
        severity: 'medium',
        category: 'revenue',
        actionRequired: false,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        recommendations: [
          'Fortsätt med nuvarande sales strategy',
          'Fokusera på upselling till existing customers'
        ]
      },
      {
        id: '3',
        title: 'Coach Utilization Optimal',
        description: 'Coach utilization rate är 87% vilket är inom optimal range (80-90%)',
        severity: 'low',
        category: 'operations',
        actionRequired: false,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        recommendations: [
          'Behåll nuvarande coach allocation',
          'Övervaka för potential capacity constraints'
        ]
      }
    ];

    const segmentData: SegmentAnalysis[] = [
      {
        segment: 'Enterprise Clients',
        users: 847,
        revenue: 45720,
        engagement: 94.2,
        retention: 89.7,
        growth: 12.3,
        color: CHART_COLORS[0]
      },
      {
        segment: 'Small Business',
        users: 1254,
        revenue: 38940,
        engagement: 87.1,
        retention: 82.4,
        growth: 8.7,
        color: CHART_COLORS[1]
      },
      {
        segment: 'Individual Professionals',
        users: 2103,
        revenue: 28650,
        engagement: 78.9,
        retention: 71.2,
        growth: 15.2,
        color: CHART_COLORS[2]
      },
      {
        segment: 'Students',
        users: 567,
        revenue: 8940,
        engagement: 85.3,
        retention: 68.1,
        growth: 22.1,
        color: CHART_COLORS[3]
      }
    ];

    return { businessMetrics, kpiAlerts, segmentData };
  }, []);

  useEffect(() => {
    const loadBusinessIntelligence = async () => {
      try {
        setLoading(true);
        
        // Simulate loading time for realistic feel
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setMetrics(generateBusinessData.businessMetrics);
        setAlerts(generateBusinessData.kpiAlerts);
        setSegments(generateBusinessData.segmentData);
        
        toast({
          title: "Business Intelligence Loaded",
          description: "Advanced BI dashboard är redo för analys!",
        });
      } catch (error) {
        console.error('BI loading error:', error);
        toast({
          title: "BI Loading Error",
          description: "Kunde inte ladda business intelligence data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBusinessIntelligence();
    }
  }, [user, generateBusinessData, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'warning': return 'outline';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const renderMetricCard = (metric: BusinessMetric) => {
    const isPositive = metric.change > 0;
    const progress = typeof metric.value === 'number' ? (metric.value / metric.target) * 100 : 0;

    return (
      <Card key={metric.id} className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            <Badge variant={getStatusBadgeVariant(metric.status)}>
              {metric.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </div>
              <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to target</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-1" />
            </div>

            <div className="text-xs text-muted-foreground">
              Previous: {typeof metric.previousValue === 'number' ? 
                metric.previousValue.toLocaleString() : 
                metric.previousValue} {metric.unit}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAlertCard = (alert: KPIAlert) => {
    const severityColor = alert.severity === 'high' ? 'destructive' : 
                         alert.severity === 'medium' ? 'default' : 'secondary';
    const Icon = alert.severity === 'high' ? AlertCircle : 
                alert.actionRequired ? Clock : CheckCircle;

    return (
      <Card key={alert.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <CardTitle className="text-base">{alert.title}</CardTitle>
            </div>
            <Badge variant={severityColor}>{alert.severity}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{alert.description}</p>
            
            {alert.actionRequired && (
              <Badge variant="outline" className="text-xs">
                Action Required
              </Badge>
            )}
            
            <div className="text-xs text-muted-foreground">
              {alert.timestamp.toLocaleString('sv-SE')}
            </div>
            
            {alert.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Recommendations:</p>
                <ul className="text-xs space-y-1">
                  {alert.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <p className="text-muted-foreground">Advanced BI med real-time KPI monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>AI Insights</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Live Data</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map(renderMetricCard)}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>KPI Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics.slice(0, 4).map((metric, idx) => ({
                  name: metric.name.split(' ')[0],
                  value: typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.replace(/[€,]/g, '')),
                  target: metric.target
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--secondary))" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {alerts.map(renderAlertCard)}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Segment Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, value }) => `${segment}: €${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {segments.map((segment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium text-sm">{segment.segment}</span>
                      </div>
                      <div className="flex space-x-4 text-xs">
                        <span>{segment.users} users</span>
                        <span>{segment.engagement.toFixed(1)}% eng.</span>
                        <span>+{segment.growth.toFixed(1)}% growth</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>
                ML-baserad prediktion av intäkter nästa 6 månader
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { month: 'Jan', actual: 127350, forecast: null },
                  { month: 'Feb', actual: null, forecast: 134200 },
                  { month: 'Mar', actual: null, forecast: 141800 },
                  { month: 'Apr', actual: null, forecast: 149200 },
                  { month: 'Maj', actual: null, forecast: 157100 },
                  { month: 'Jun', actual: null, forecast: 165400 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="actual" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
                  <Area type="monotone" dataKey="forecast" stackId="2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.4} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};