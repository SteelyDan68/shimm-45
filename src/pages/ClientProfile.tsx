import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  RefreshCw,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useClientLogic } from '@/hooks/useClientLogic';
import { useClientData } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { SocialWidget } from '@/components/SocialWidget';
import { SwedishNewsWidget } from '@/components/SwedishNewsWidget';
import { SentimentAnalysisWidget } from '@/components/SentimentAnalysisWidget';
import { DataCollectorWidget } from '@/components/DataCollectorWidget';
import { ClientPathTimeline } from '@/components/ClientPath/ClientPathTimeline';
import { InsightAssessment } from '@/components/InsightAssessment/InsightAssessment';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { TaskScheduler } from '@/components/TaskScheduler/TaskScheduler';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { ModularPillarDashboard } from '@/components/FivePillars/ModularPillarDashboard';

interface Client {
  id: string;
  name: string;
  category: string;
  email?: string;
  status: string;
  logic_state?: any;
}

export const ClientProfile = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [cacheData, setCacheData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { processClientLogic, isProcessing } = useClientLogic();
  const { getClientCacheData, getNewsMentions, getSocialMetrics } = useClientData();
  
  // Filter cache data by type
  const newsItems = getNewsMentions(cacheData);
  const socialMetrics = getSocialMetrics(cacheData);
  const sentimentData = cacheData?.filter(item => {
    return item.data_type === 'ai_analysis' && item.metadata?.original_data_type === 'sentiment_analysis';
  }) || [];

  useEffect(() => {
    if (clientId && user) {
      loadClientData();
      
      // Set up real-time updates for cache data
      const channel = supabase
        .channel('client-cache-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'client_data_cache',
            filter: `client_id=eq.${clientId}`
          },
          (payload) => {
            
            // Reload data when new cache items are added
            loadClientData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [clientId, user]);

  const loadClientData = async () => {
    if (!clientId || !user) return;
    
    setLoading(true);
    try {
      // Load client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error('Error loading client:', clientError);
        toast({
          title: "Fel",
          description: "Kunde inte ladda klientdata",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setClient(clientData);

      // Load cache data
      const cache = await getClientCacheData(clientId);
      setCacheData(cache);

    } catch (error) {
      console.error('Error in loadClientData:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!clientId) return;
    
    const result = await processClientLogic(clientId);
    if (result) {
      loadClientData();
    }
  };

  const collectData = async () => {
    await loadClientData();
  };


  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'B': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'C': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'encouraging': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'strategic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'urgent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar klientprofil...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Klient hittades inte</div>
      </div>
    );
  }

  const logicState = client.logic_state;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{client.category}</Badge>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleRunAnalysis} 
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyserar...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Kör analys
              </>
            )}
          </Button>
          
          <InsightAssessment clientId={clientId!} clientName={client.name} />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="pillars">Five Pillars</TabsTrigger>
          <TabsTrigger value="data">Data & Insights</TabsTrigger>
          <TabsTrigger value="tasks">Uppgifter</TabsTrigger>
          <TabsTrigger value="development">Utveckling</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Logic State Card */}
          {logicState && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-analys & rekommendationer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Velocity Rank:</span>
                    <Badge className={getRankColor(logicState.velocity_rank)}>
                      Klass {logicState.velocity_rank}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Ton:</span>
                    <Badge className={getToneColor(logicState.tone)}>
                      {logicState.tone}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 bg-background/60 rounded-lg border">
                  <p className="text-sm leading-relaxed">{logicState.recommendation}</p>
                </div>
                
                {logicState.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-background/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {logicState.metrics.followerGrowth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Följartillväxt</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {logicState.metrics.engagementRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {logicState.metrics.postFrequency}
                      </div>
                      <div className="text-xs text-muted-foreground">Inlägg/vecka</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {logicState.metrics.recentActivity}
                      </div>
                      <div className="text-xs text-muted-foreground">Aktivitetspoäng</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Datasammanfattning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{cacheData.length}</div>
                  <div className="text-sm text-muted-foreground">Totalt datapunkter</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{newsItems.length}</div>
                  <div className="text-sm text-muted-foreground">Omnämnanden</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {cacheData.filter(d => d.data_type === 'social_metrics').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sociala metrics</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {cacheData.filter(d => d.data_type === 'ai_analysis').length}
                  </div>
                  <div className="text-sm text-muted-foreground">AI-analyser</div>
                </div>
              </div>
              
              {cacheData.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Senaste uppdatering: {new Date(cacheData[0]?.created_at).toLocaleString('sv-SE')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Five Pillars Tab */}
        <TabsContent value="pillars" className="space-y-6">
          <ModularPillarDashboard 
            clientId={clientId!} 
            clientName={client.name} 
            isCoachView={true}
          />
        </TabsContent>

        {/* Data & Insights Tab */}
        <TabsContent value="data" className="space-y-6">
          {/* Live Data Collection */}
          <DataCollectorWidget 
            clientId={clientId} 
            clientName={client.name}
            onDataCollected={loadClientData}
          />
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Swedish News */}
            <SwedishNewsWidget newsItems={newsItems} clientName={client.name} />
            
            {/* Sentiment Analysis */}
            <SentimentAnalysisWidget sentimentData={sentimentData} onCollectData={collectData} />
          </div>

          {/* Social Media Widget - Full Width */}
          <SocialWidget socialMetrics={socialMetrics} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Client Tasks */}
          <ClientTaskList clientId={clientId!} clientName={client.name} />

          {/* Task Scheduler for Coaches */}
          <TaskScheduler clientId={clientId!} clientName={client.name} />
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          {/* Client Path Timeline */}
          <ClientPathTimeline clientId={clientId!} clientName={client.name} isCoachView={true} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard clientId={clientId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};