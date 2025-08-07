import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';

interface PredictiveModel {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'clustering' | 'forecasting';
  accuracy: number;
  confidence: number;
  lastTrained: Date;
  dataPoints: number;
  status: 'active' | 'training' | 'needs_update';
  description: string;
}

interface Prediction {
  id: string;
  title: string;
  description: string;
  category: 'user_behavior' | 'business_outcome' | 'risk_assessment' | 'optimization';
  probability: number;
  confidence: number;
  timeHorizon: string;
  impact: 'high' | 'medium' | 'low';
  dataSource: string[];
  recommendations: string[];
  evidenceStrength: number;
  modelUsed: string;
}

interface RiskAssessment {
  riskType: string;
  probability: number;
  impact: number;
  riskScore: number;
  mitigation: string[];
  timeline: string;
  confidence: number;
}

interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  userCount: number;
  conversionRate: number;
  avgValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))', 
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444'
];

export const PredictiveInsightsEngine: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedModel, setSelectedModel] = useState('all');
  const [timeHorizon, setTimeHorizon] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [patterns, setPatterns] = useState<UserBehaviorPattern[]>([]);

  // Generate advanced predictive analytics data
  const generatePredictiveData = useMemo(() => {
    const predictiveModels: PredictiveModel[] = [
      {
        id: '1',
        name: 'User Churn Predictor',
        type: 'classification',
        accuracy: 94.2,
        confidence: 89.7,
        lastTrained: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dataPoints: 15429,
        status: 'active',
        description: 'Förutspår sannolikhet för user churn inom 30 dagar baserat på engagement patterns'
      },
      {
        id: '2',
        name: 'Revenue Forecasting Model',
        type: 'regression',
        accuracy: 91.8,
        confidence: 87.3,
        lastTrained: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dataPoints: 8934,
        status: 'active',
        description: 'Prognostiserar månadsintäkter baserat på user behavior och marknadsdata'
      },
      {
        id: '3',
        name: 'Optimal Coaching Time',
        type: 'clustering',
        accuracy: 88.4,
        confidence: 85.1,
        lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dataPoints: 12847,
        status: 'training',
        description: 'Identifierar optimala tider för coaching sessions per användarsegment'
      },
      {
        id: '4',
        name: 'Goal Achievement Predictor',
        type: 'classification',
        accuracy: 89.7,
        confidence: 92.1,
        lastTrained: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        dataPoints: 9847,
        status: 'active',
        description: 'Förutspår sannolikhet för måluppfyllelse baserat på användaraktivitet'
      }
    ];

    const predictionsData: Prediction[] = [
      {
        id: '1',
        title: 'Hög churn-risk för Enterprise segment',
        description: 'AI-modellen förutspår 34% ökning av churn inom Enterprise kunder nästa månad baserat på minskad session frequency och engagement scores.',
        category: 'risk_assessment',
        probability: 78.3,
        confidence: 91.2,
        timeHorizon: '30 dagar',
        impact: 'high',
        dataSource: ['user_sessions', 'engagement_metrics', 'subscription_data'],
        recommendations: [
          'Implementera proaktiv enterprise support outreach',
          'Analysera Enterprise-specifika pain points',
          'Erbjud personaliserade coaching packages för Enterprise kunder',
          'Skapa dedicated Enterprise success manager program'
        ],
        evidenceStrength: 8.7,
        modelUsed: 'User Churn Predictor'
      },
      {
        id: '2',
        title: 'Optimal expansion opportunity',
        description: 'Segment "Young Professionals" visar 89% sannolikhet för upselling till premium plans inom 14 dagar om targeted campaigns lanseras.',
        category: 'business_outcome',
        probability: 89.1,
        confidence: 87.4,
        timeHorizon: '14 dagar',
        impact: 'high',
        dataSource: ['usage_patterns', 'feature_adoption', 'payment_history'],
        recommendations: [
          'Lansera targeted premium features kampanj',
          'Erbjud limited-time premium trial',
          'Personalisera messaging baserat på most-used features',
          'Implementera progressive feature unlocking'
        ],
        evidenceStrength: 9.2,
        modelUsed: 'Revenue Forecasting Model'
      },
      {
        id: '3',
        title: 'Peak performance timing identified',
        description: 'Users som har coaching sessions mellan 14:00-16:00 på tisdagar har 67% högre goal completion rate.',
        category: 'optimization',
        probability: 92.7,
        confidence: 94.8,
        timeHorizon: 'Omedelbart',
        impact: 'medium',
        dataSource: ['session_timing', 'completion_rates', 'user_feedback'],
        recommendations: [
          'Föreslå tisdag 14:00-16:00 som optimal session time',
          'Implementera smart scheduling AI',
          'Skapa calendar integration för optimal timing',
          'A/B testa session duration på peak times'
        ],
        evidenceStrength: 9.5,
        modelUsed: 'Optimal Coaching Time'
      },
      {
        id: '4',
        title: 'User engagement pattern shift',
        description: 'Mobile app usage ökar med 43% medan desktop usage minskar. Predicerar behov av enhanced mobile features.',
        category: 'user_behavior',
        probability: 85.6,
        confidence: 88.9,
        timeHorizon: '60 dagar',
        impact: 'medium',
        dataSource: ['device_usage', 'session_data', 'feature_clicks'],
        recommendations: [
          'Prioritera mobile-first feature development',
          'Optimera mobile coaching experience',
          'Implementera mobile-specific notifications',
          'Utveckla mobile offline capabilities'
        ],
        evidenceStrength: 8.3,
        modelUsed: 'User Churn Predictor'
      }
    ];

    const riskAssessments: RiskAssessment[] = [
      {
        riskType: 'Customer Churn',
        probability: 23.4,
        impact: 8.7,
        riskScore: 7.2,
        mitigation: [
          'Proaktiv customer success outreach',
          'Personalized retention campaigns',
          'Enhanced onboarding process'
        ],
        timeline: '30 days',
        confidence: 91.2
      },
      {
        riskType: 'Revenue Decline',
        probability: 15.7,
        impact: 9.2,
        riskScore: 6.8,
        mitigation: [
          'Diversify revenue streams',
          'Implement upselling strategies',
          'Optimize pricing model'
        ],
        timeline: '90 days',
        confidence: 87.3
      },
      {
        riskType: 'Coach Capacity Strain',
        probability: 67.8,
        impact: 6.4,
        riskScore: 8.1,
        mitigation: [
          'Hire additional coaches',
          'Implement AI-assisted coaching',
          'Optimize coach scheduling'
        ],
        timeline: '45 days',
        confidence: 94.7
      }
    ];

    const behaviorPatterns: UserBehaviorPattern[] = [
      {
        pattern: 'Morning Session Preference',
        frequency: 67.3,
        userCount: 1847,
        conversionRate: 78.9,
        avgValue: 127.50,
        trend: 'increasing'
      },
      {
        pattern: 'Mobile-First Usage',
        frequency: 89.1,
        userCount: 2456,
        conversionRate: 82.3,
        avgValue: 95.80,
        trend: 'increasing'
      },
      {
        pattern: 'Weekend Coaching',
        frequency: 34.7,
        userCount: 945,
        conversionRate: 91.2,
        avgValue: 185.20,
        trend: 'stable'
      },
      {
        pattern: 'Quick Session Preference',
        frequency: 56.8,
        userCount: 1567,
        conversionRate: 73.4,
        avgValue: 89.40,
        trend: 'decreasing'
      }
    ];

    return { predictiveModels, predictionsData, riskAssessments, behaviorPatterns };
  }, []);

  useEffect(() => {
    const loadPredictiveAnalytics = async () => {
      try {
        setLoading(true);
        
        // Simulate model training and data processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setModels(generatePredictiveData.predictiveModels);
        setPredictions(generatePredictiveData.predictionsData);
        setRisks(generatePredictiveData.riskAssessments);
        setPatterns(generatePredictiveData.behaviorPatterns);
        
        toast({
          title: "Predictive Models Loaded",
          description: "AI-powered predictive insights redo för analys!",
        });
      } catch (error) {
        console.error('Predictive analytics loading error:', error);
        toast({
          title: "Predictive Analytics Error",
          description: "Kunde inte ladda predictive models",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPredictiveAnalytics();
    }
  }, [user, generatePredictiveData, toast]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'training': return Clock;
      case 'needs_update': return AlertTriangle;
      default: return Activity;
    }
  };

  const renderModelCard = (model: PredictiveModel) => {
    const StatusIcon = getStatusIcon(model.status);
    const statusColor = model.status === 'active' ? 'text-green-600' : 
                       model.status === 'training' ? 'text-yellow-600' : 'text-red-600';

    return (
      <Card key={model.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{model.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
              <Badge variant="outline">{model.type}</Badge>
            </div>
          </div>
          <CardDescription className="text-sm">{model.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <div className="font-semibold">{model.accuracy.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <div className="font-semibold">{model.confidence.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Model Performance</span>
                <span>{model.accuracy.toFixed(1)}%</span>
              </div>
              <Progress value={model.accuracy} className="h-1" />
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Last trained: {model.lastTrained.toLocaleDateString('sv-SE')}</div>
              <div>Data points: {model.dataPoints.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPredictionCard = (prediction: Prediction) => {
    return (
      <Card key={prediction.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{prediction.title}</CardTitle>
            </div>
            <Badge variant={getImpactColor(prediction.impact)}>{prediction.impact} impact</Badge>
          </div>
          <CardDescription className="text-sm mt-2">{prediction.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Probability:</span>
                <div className="font-semibold">{prediction.probability.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <div className="font-semibold">{prediction.confidence.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Prediction Strength</span>
                <span>{prediction.probability.toFixed(1)}%</span>
              </div>
              <Progress value={prediction.probability} className="h-2" />
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Time Horizon: {prediction.timeHorizon}</div>
              <div>Model: {prediction.modelUsed}</div>
              <div>Evidence Strength: {prediction.evidenceStrength.toFixed(1)}/10</div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium">Key Recommendations:</p>
              <ul className="text-xs space-y-1">
                {prediction.recommendations.slice(0, 2).map((rec, idx) => (
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

  const renderRiskMatrix = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={risks}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="probability" 
            name="Probability" 
            unit="%" 
            domain={[0, 100]}
          />
          <YAxis 
            type="number" 
            dataKey="impact" 
            name="Impact" 
            unit="/10" 
            domain={[0, 10]}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{data.riskType}</p>
                    <p className="text-sm">Probability: {data.probability}%</p>
                    <p className="text-sm">Impact: {data.impact}/10</p>
                    <p className="text-sm">Risk Score: {data.riskScore}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter dataKey="riskScore" fill="hsl(var(--primary))" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Training AI models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Predictive Insights</h1>
          <p className="text-muted-foreground">AI-powered predictions och risk assessment</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeHorizon} onValueChange={setTimeHorizon}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dagar</SelectItem>
              <SelectItem value="30d">30 dagar</SelectItem>
              <SelectItem value="90d">90 dagar</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>ML Powered</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="risks">Risk Matrix</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {predictions.map(renderPredictionCard)}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {models.map(renderModelCard)}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={models}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
                  <Bar dataKey="confidence" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Matrix</CardTitle>
              <CardDescription>
                Visualisering av sannolikhet vs impact för identifierade risker
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRiskMatrix()}
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            {risks.map((risk, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{risk.riskType}</CardTitle>
                  <Badge variant="outline">Risk Score: {risk.riskScore.toFixed(1)}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Probability:</span>
                        <span className="font-medium">{risk.probability.toFixed(1)}%</span>
                      </div>
                      <Progress value={risk.probability} className="h-1" />
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Timeline: {risk.timeline}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Mitigation:</p>
                      <ul className="text-xs space-y-1">
                        {risk.mitigation.slice(0, 2).map((mit, midx) => (
                          <li key={midx} className="flex items-start space-x-1">
                            <span className="text-primary">•</span>
                            <span>{mit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Behavior Pattern Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={patterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pattern" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={patterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pattern" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversionRate" stroke="hsl(var(--primary))" />
                    <Line type="monotone" dataKey="avgValue" stroke="hsl(var(--secondary))" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};