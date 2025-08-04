import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth, usePermissions } from '@/providers/UnifiedAuthProvider';
import { useUnifiedAI } from '@/hooks/useUnifiedAI';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Brain,
  Settings,
  Database,
  BarChart3,
  Activity,
  Users,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Search,
  Upload,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';

/**
 * 🚀 STEFAN AI MANAGEMENT CENTER
 * Unified admin interface för alla Stefan AI funktioner
 * Ersätter: EnhancedStefanControlCenter, StefanOverviewPanel, StefanMemoryManager
 */

interface StefanMemory {
  id: string;
  content: string;
  tags: string[];
  category: string;
  version: string;
  source: string;
  created_at: string;
}

interface StefanAnalytics {
  total_interactions: number;
  avg_response_time: number;
  success_rate: number;
  memory_fragments: number;
  active_users: number;
  weekly_growth: number;
}

interface StefanConfig {
  primaryModel: string;
  enableAssessmentContext: boolean;
  enableRecommendations: boolean;
  confidenceThreshold: number;
  maxTokens: number;
  temperature: number;
}

export const StefanAIManagementCenter: React.FC = () => {
  const { hasRole } = useAuth();
  const { canViewSystemAnalytics, canManageSettings } = usePermissions();
  const { healthCheck, loading } = useUnifiedAI();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [memories, setMemories] = useState<StefanMemory[]>([]);
  const [analytics, setAnalytics] = useState<StefanAnalytics | null>(null);
  const [config, setConfig] = useState<StefanConfig | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Access control
  if (!hasRole('admin') && !hasRole('superadmin')) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt Stefan AI Management Center.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        loadMemories(),
        loadAnalytics(), 
        loadConfig(),
        loadSystemHealth()
      ]);
    } catch (error) {
      console.error('Failed to load Stefan AI data:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda all Stefan AI data",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stefan-memories');
      if (error) throw error;
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Load analytics from stefan_analytics table
      const { data, error } = await supabase
        .from('stefan_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Calculate aggregated metrics
      const totalInteractions = data?.length || 0;
      const avgResponseTime = data?.reduce((acc, item) => acc + (item.metric_value || 0), 0) / totalInteractions || 0;
      const successRate = data?.filter(item => item.metric_type === 'success').length / totalInteractions * 100 || 0;
      
      setAnalytics({
        total_interactions: totalInteractions,
        avg_response_time: Math.round(avgResponseTime),
        success_rate: Math.round(successRate),
        memory_fragments: memories.length,
        active_users: data?.filter(item => item.user_id).length || 0,
        weekly_growth: 12 // Calculate from time-based data
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stefan-config-manager');
      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const health = await healthCheck();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to check system health:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'down': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Stefan AI Management Center</CardTitle>
                <CardDescription>
                  Centraliserad kontroll för alla Stefan AI funktioner och data
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {systemHealth && (
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(systemHealth.status)} border-current`}
                >
                  {getStatusIcon(systemHealth.status)}
                  <span className="ml-1">{systemHealth.status}</span>
                </Badge>
              )}
              <Button variant="outline" onClick={loadAllData} disabled={loadingData}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
                Uppdatera
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Minnesbank
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Konfiguration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interaktioner</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.total_interactions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics?.weekly_growth || 0}% denna vecka
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Svarstid (ms)</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.avg_response_time || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Genomsnittlig responstid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Framgångsgrad</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.success_rate || 0}%</div>
                <Progress value={analytics?.success_rate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Minnesfragment</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memories.length}</div>
                <p className="text-xs text-muted-foreground">
                  Lagrade kunskapsfragment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          {systemHealth && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Systemhälsa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${systemHealth.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>OpenAI</span>
                    <Badge variant={systemHealth.openai ? 'default' : 'destructive'}>
                      {systemHealth.openai ? 'Aktiv' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${systemHealth.gemini ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Gemini</span>
                    <Badge variant={systemHealth.gemini ? 'default' : 'destructive'}>
                      {systemHealth.gemini ? 'Aktiv' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span>Övergripande status</span>
                    <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'secondary'}>
                      {systemHealth.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Stefan Minnesbank
              </CardTitle>
              <CardDescription>
                Hantera kunskapsfragment och träningsdata för Stefan AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Ladda upp
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Sök
                  </Button>
                </div>
                <Badge variant="secondary">
                  {memories.length} minnesfragment
                </Badge>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {memories.map((memory) => (
                    <Card key={memory.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <Badge variant="outline">{memory.category}</Badge>
                            {memory.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-sm">
                            {memory.content.length > 200 
                              ? `${memory.content.substring(0, 200)}...`
                              : memory.content
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Källa: {memory.source} • Version: {memory.version} • 
                            Skapad: {new Date(memory.created_at).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Stefan AI Konfiguration
              </CardTitle>
              <CardDescription>
                Konfigurera Stefan AI:s beteende och inställningar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Primär AI-modell</label>
                      <p className="text-lg">{config.primaryModel}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Konfidensgrad</label>
                      <Progress value={config.confidenceThreshold * 100} className="mt-1" />
                      <p className="text-xs text-muted-foreground">{Math.round(config.confidenceThreshold * 100)}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max tokens</label>
                      <p className="text-lg">{config.maxTokens}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Temperature</label>
                      <p className="text-lg">{config.temperature}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={config.enableAssessmentContext ? 'default' : 'secondary'}>
                      Assessment Context: {config.enableAssessmentContext ? 'På' : 'Av'}
                    </Badge>
                    <Badge variant={config.enableRecommendations ? 'default' : 'secondary'}>
                      Rekommendationer: {config.enableRecommendations ? 'På' : 'Av'}
                    </Badge>
                  </div>

                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Uppdatera konfiguration
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Laddar konfiguration...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Stefan AI Analytics
              </CardTitle>
              <CardDescription>
                Detaljerad analys av Stefan AI:s prestanda och användning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Avancerad analytics kommer snart...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Kommer att visa grafer, trender och detaljerad användarstatistik
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StefanAIManagementCenter;