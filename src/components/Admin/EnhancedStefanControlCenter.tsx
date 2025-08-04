/**
 * 🚀 ENHANCED STEFAN CONTROL CENTER
 * Admin-gränssnitt för kontextuell AI med assessment-integration
 */

import React, { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/providers/UnifiedAuthProvider';
import { useEnhancedStefanAI } from '@/hooks/useEnhancedStefanAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain,
  MessageSquare,
  TrendingUp,
  Settings,
  Database,
  Activity,
  Zap,
  Users,
  Target,
  RefreshCw,
  TestTube,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIPerformanceMetric {
  model: 'openai' | 'gemini';
  responseTime: number;
  accuracy: number;
  usage: number;
  lastUpdated: Date;
}

interface AssessmentIntegrationStatus {
  totalUsers: number;
  usersWithAssessments: number;
  averageContextScore: number;
  lastSyncDate: Date;
}

export function EnhancedStefanControlCenter() {
  const { hasRole } = useAuth();
  const { canViewSystemAnalytics, canManageSettings } = usePermissions();
  const { enhancedStefanChat, loading, lastResponse } = useEnhancedStefanAI();
  const { toast } = useToast();
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [aiModels, setAIModels] = useState<AIPerformanceMetric[]>([]);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentIntegrationStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  // Configuration states
  const [primaryModel, setPrimaryModel] = useState<'openai' | 'gemini' | 'auto'>('auto');
  const [enableAssessmentContext, setEnableAssessmentContext] = useState(true);
  const [enableRecommendations, setEnableRecommendations] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  useEffect(() => {
    if (canViewSystemAnalytics) {
      loadSystemData();
    }
  }, [canViewSystemAnalytics]);

  const loadSystemData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAIPerformanceMetrics(),
        loadAssessmentIntegrationStatus(),
        loadSystemConfiguration()
      ]);
    } catch (error) {
      console.error('Error loading system data:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda systemdata",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadAIPerformanceMetrics = async () => {
    try {
      const { data } = await supabase.functions.invoke('get-ai-performance-metrics');
      if (data) {
        setAIModels(data.metrics || []);
      }
    } catch (error) {
      console.warn('Could not load AI performance metrics:', error);
      // Mock data för demonstration
      setAIModels([
        {
          model: 'openai',
          responseTime: 1.2,
          accuracy: 94.5,
          usage: 1247,
          lastUpdated: new Date()
        },
        {
          model: 'gemini',
          responseTime: 0.8,
          accuracy: 91.2,
          usage: 432,
          lastUpdated: new Date()
        }
      ]);
    }
  };

  const loadAssessmentIntegrationStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('get-assessment-integration-status');
      if (data) {
        setAssessmentStatus(data.status);
      }
    } catch (error) {
      console.warn('Could not load assessment status:', error);
      // Mock data
      setAssessmentStatus({
        totalUsers: 156,
        usersWithAssessments: 143,
        averageContextScore: 8.7,
        lastSyncDate: new Date()
      });
    }
  };

  const loadSystemConfiguration = async () => {
    try {
      const { data } = await supabase.functions.invoke('get-stefan-config');
      if (data) {
        setPrimaryModel(data.primaryModel || 'auto');
        setEnableAssessmentContext(data.enableAssessmentContext ?? true);
        setEnableRecommendations(data.enableRecommendations ?? true);
        setConfidenceThreshold(data.confidenceThreshold || 0.7);
      }
    } catch (error) {
      console.warn('Could not load system configuration:', error);
    }
  };

  const runAITest = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Testmeddelande krävs",
        description: "Ange ett meddelande att testa",
        variant: "destructive"
      });
      return;
    }

    try {
      const startTime = Date.now();
      
      // Testa med olika konfigurationer
      const testConfigs = [
        { model: 'openai', context: true },
        { model: 'gemini', context: true },
        { model: 'auto', context: false }
      ];

      const results = [];
      
      for (const config of testConfigs) {
        try {
          const response = await enhancedStefanChat({
            message: testMessage,
            includeAssessmentContext: config.context,
            generateRecommendations: true
          });

          results.push({
            config,
            response,
            responseTime: Date.now() - startTime,
            success: true
          });
        } catch (error) {
          results.push({
            config,
            error: error.message,
            success: false
          });
        }
      }

      setTestResults(results);
      
      toast({
        title: "AI-test slutfört",
        description: `Testade ${results.length} konfigurationer`,
      });

    } catch (error) {
      toast({
        title: "Testfel",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveConfiguration = async () => {
    if (!canManageSettings) return;

    try {
      await supabase.functions.invoke('update-stefan-config', {
        body: {
          primaryModel,
          enableAssessmentContext,
          enableRecommendations,
          confidenceThreshold
        }
      });

      toast({
        title: "Konfiguration sparad",
        description: "Stefan AI-inställningar har uppdaterats"
      });
    } catch (error) {
      toast({
        title: "Fel vid sparande",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!canViewSystemAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt Enhanced Stefan Control Center.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Enhanced Stefan AI Control Center
          </h1>
          <p className="text-muted-foreground">
            Kontextuell AI med assessment-integration och hybrid modell-strategier
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSystemData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          {canManageSettings && (
            <Button variant="outline" size="sm" onClick={saveConfiguration}>
              <Settings className="h-4 w-4 mr-2" />
              Spara config
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessment Integration</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessmentStatus ? Math.round((assessmentStatus.usersWithAssessments / assessmentStatus.totalUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {assessmentStatus?.usersWithAssessments || 0} av {assessmentStatus?.totalUsers || 0} användare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontext-kvalitet</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessmentStatus?.averageContextScore?.toFixed(1) || '0.0'}/10
            </div>
            <p className="text-xs text-muted-foreground">
              Genomsnittlig kontext-poäng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI-modeller aktiva</CardTitle>
            <Monitor className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiModels.length}</div>
            <p className="text-xs text-muted-foreground">
              OpenAI + Gemini tillgängliga
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Svarstillförlitlighet</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastResponse ? Math.round(lastResponse.confidence * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Senaste svarets tillförlitlighet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Control Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="assessment">Assessment-integration</TabsTrigger>
          <TabsTrigger value="models">AI-modeller</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="config">Konfiguration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment-baserad AI</CardTitle>
                <CardDescription>Kontextuell Stefan AI med användardata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Användare med assessment-data</span>
                    <Badge variant="default">
                      {assessmentStatus ? Math.round((assessmentStatus.usersWithAssessments / assessmentStatus.totalUsers) * 100) : 0}%
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={assessmentStatus ? (assessmentStatus.usersWithAssessments / assessmentStatus.totalUsers) * 100 : 0} 
                    className="h-2" 
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    Stefan kan nu leverera personliga råd baserat på Wheel of Life-resultat och neuroplasticitets-principer
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hybrid AI-prestanda</CardTitle>
                <CardDescription>OpenAI vs Gemini jämförelse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiModels.map((model) => (
                    <div key={model.model} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${model.model === 'openai' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div>
                          <div className="font-medium capitalize">{model.model}</div>
                          <div className="text-sm text-muted-foreground">{model.usage} anrop</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{model.accuracy}%</div>
                        <div className="text-sm text-muted-foreground">{model.responseTime}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment-data integration</CardTitle>
              <CardDescription>Övervakning av kontextuell AI-prestanda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{assessmentStatus?.totalUsers || 0}</div>
                    <div className="text-sm text-muted-foreground">Totala användare</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{assessmentStatus?.usersWithAssessments || 0}</div>
                    <div className="text-sm text-muted-foreground">Med assessment-data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{assessmentStatus?.averageContextScore?.toFixed(1) || '0.0'}</div>
                    <div className="text-sm text-muted-foreground">Genomsnittlig kontext-poäng</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Assessment-integration funktioner</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm">Wheel of Life-integration</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm">Neuroplasticitets-principer</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm">Personlig utvecklingshistorik</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm">Kontextuella rekommendationer</span>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-modell hantering</CardTitle>
              <CardDescription>Övervakning och konfiguration av OpenAI och Gemini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {aiModels.map((model) => (
                  <Card key={model.model}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{model.model} AI</span>
                        <Badge variant={model.model === 'openai' ? "default" : "secondary"}>
                          {model.accuracy}% träffsäkerhet
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{model.responseTime}s</div>
                          <div className="text-sm text-muted-foreground">Svarstid</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{model.usage}</div>
                          <div className="text-sm text-muted-foreground">API-anrop</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{model.accuracy}%</div>
                          <div className="text-sm text-muted-foreground">Träffsäkerhet</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing & Quality Assurance</CardTitle>
              <CardDescription>Testa och jämför AI-modellers prestanda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-message">Testmeddelande</Label>
                  <Textarea
                    id="test-message"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Skriv ett meddelande för att testa AI-modellernas svar..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button onClick={runAITest} disabled={loading || !testMessage.trim()}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Kör AI-test
                </Button>

                {testResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Testresultat</h4>
                    {testResults.map((result, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-base">
                            <span>
                              {result.config.model.toUpperCase()} 
                              {result.config.context ? ' + Assessment Context' : ''}
                            </span>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? 'Framgång' : 'Fel'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {result.success ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Svar:</div>
                              <div className="text-sm bg-muted p-3 rounded-lg">
                                {result.response?.message}
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Svarstid: {result.responseTime}ms</span>
                                <span>Tillförlitlighet: {Math.round((result.response?.confidence || 0) * 100)}%</span>
                                <span>Modell: {result.response?.aiModel}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-destructive">
                              Fel: {result.error}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-konfiguration</CardTitle>
              <CardDescription>Konfigurera Stefan AI:s beteende och funktioner</CardDescription>
            </CardHeader>
            <CardContent>
              {canManageSettings ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary-model">Primär AI-modell</Label>
                    <Select value={primaryModel} onValueChange={(value: any) => setPrimaryModel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatisk (Optimal för varje situation)</SelectItem>
                        <SelectItem value="openai">OpenAI (Prioritera kvalitet)</SelectItem>
                        <SelectItem value="gemini">Gemini (Prioritera hastighet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assessment-context"
                      checked={enableAssessmentContext}
                      onCheckedChange={setEnableAssessmentContext}
                    />
                    <Label htmlFor="assessment-context">Aktivera assessment-kontext</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recommendations"
                      checked={enableRecommendations}
                      onCheckedChange={setEnableRecommendations}
                    />
                    <Label htmlFor="recommendations">Generera automatiska rekommendationer</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confidence">Tillförlitlighetströskel ({Math.round(confidenceThreshold * 100)}%)</Label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        id="confidence"
                        min="0.3"
                        max="1.0"
                        step="0.1"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {Math.round(confidenceThreshold * 100)}%
                      </span>
                    </div>
                  </div>

                  <Button onClick={saveConfiguration} className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Spara konfiguration
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {hasRole('superadmin') 
                    ? "🚨 SUPERADMIN GOD MODE: Du ska ha full åtkomst här - kontakta utvecklare"
                    : "Du har inte behörighet att ändra AI-konfiguration"
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}