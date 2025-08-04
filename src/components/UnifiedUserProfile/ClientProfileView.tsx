import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, TrendingUp } from 'lucide-react';
import { useClientLogic } from '@/hooks/useClientLogic';
import { useClientData } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModularPillarDashboard } from '@/components/SixPillars/ModularPillarDashboard';
import { CalendarModule } from '@/components/Calendar/CalendarModule';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { SocialWidget } from '@/components/SocialWidget';
import { SwedishNewsWidget } from '@/components/SwedishNewsWidget';
import { SentimentAnalysisWidget } from '@/components/SentimentAnalysisWidget';

import { ClientPathTimeline } from '@/components/ClientPath/ClientPathTimeline';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';

interface ClientProfileViewProps {
  userId: string;
  profile: any;
  extendedProfile: any;
  defaultTab?: string | null;
  defaultPillar?: string | null;
}

/**
 * CLIENT PROFILE VIEW
 * Specialized view for when user is viewed in client context
 * Uses ONLY user_id - Single Source of Truth principle
 */
export const ClientProfileView = ({ 
  userId, 
  profile, 
  extendedProfile, 
  defaultTab, 
  defaultPillar 
}: ClientProfileViewProps) => {
  const [cacheData, setCacheData] = useState<any[]>([]);
  const [logicState, setLogicState] = useState<any>(null);
  const { toast } = useToast();
  
  const { processClientLogic, isProcessing } = useClientLogic();
  const { getClientCacheData, getNewsMentions, getSocialMetrics } = useClientData();
  
  // Filter cache data by type
  const newsItems = getNewsMentions(cacheData);
  const socialMetrics = getSocialMetrics(cacheData);
  const sentimentData = cacheData?.filter(item => {
    return item.data_type === 'ai_analysis' && item.metadata?.original_data_type === 'sentiment_analysis';
  }) || [];

  useEffect(() => {
    loadClientData();
  }, [userId]);

  const loadClientData = async () => {
    try {
      // Load cache data using user_id (Single Source of Truth)
      const cache = await getClientCacheData(userId);
      setCacheData(cache);
      
      // Extract logic state from profile metadata
      const logicStateData = (profile.preferences as any)?.logic_state;
      setLogicState(logicStateData);
      
    } catch (error) {
      console.error('Error loading client data:', error);
    }
  };

  const handleRunAnalysis = async () => {
    const result = await processClientLogic(userId);
    if (result) {
      loadClientData();
    }
  };

  const getUserName = () => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email || 'Namnlös användare';
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

  return (
    <Tabs defaultValue={defaultTab || "overview"} className="space-y-6">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="overview">Översikt</TabsTrigger>
        <TabsTrigger value="calendar">Kalender</TabsTrigger>
        <TabsTrigger value="pillars">Six Pillars</TabsTrigger>
        <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-analys & rekommendationer
                  <HelpTooltip content={helpTexts.clientProfile.aiInsights} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Velocity Rank:</span>
                  <Badge className={getRankColor(logicState.velocity_rank)}>
                    Klass {logicState.velocity_rank}
                  </Badge>
                  <HelpTooltip content={helpTexts.clientProfile.velocityScore} />
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
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="text-2xl font-bold text-primary">
                        {logicState.metrics.followerGrowth.toFixed(1)}%
                      </div>
                      <HelpTooltip content={helpTexts.analytics.growthRate} />
                    </div>
                    <div className="text-xs text-muted-foreground">Följartillväxt</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="text-2xl font-bold text-primary">
                        {logicState.metrics.engagementRate.toFixed(1)}%
                      </div>
                      <HelpTooltip content={helpTexts.analytics.engagementRate} />
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
              <HelpTooltip content={helpTexts.clientProfile.dataCollection} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-2xl font-bold">{cacheData.length}</div>
                  <HelpTooltip content="Totalt antal insamlade datapunkter från alla källor" />
                </div>
                <div className="text-sm text-muted-foreground">Totalt datapunkter</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-2xl font-bold">{newsItems.length}</div>
                  <HelpTooltip content="Antal gånger användaren omnämnts i svenska nyhetsmedier" />
                </div>
                <div className="text-sm text-muted-foreground">Omnämnanden</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-2xl font-bold">
                    {cacheData.filter(d => d.data_type === 'social_metrics').length}
                  </div>
                  <HelpTooltip content="Antal insamlade sociala medier-statistik från olika plattformar" />
                </div>
                <div className="text-sm text-muted-foreground">Sociala metrics</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-2xl font-bold">
                    {cacheData.filter(d => d.data_type === 'ai_analysis').length}
                  </div>
                  <HelpTooltip content={helpTexts.analytics.aiInsightsGenerated} />
                </div>
                <div className="text-xs text-muted-foreground">AI-analyser</div>
              </div>
            </div>
            
            {cacheData.length > 0 && (
              <div className="mt-4 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <span>Senaste uppdatering: {new Date(cacheData[0]?.created_at).toLocaleString('sv-SE')}</span>
                <HelpTooltip content={helpTexts.clientProfile.lastUpdate} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Calendar Tab */}
      <TabsContent value="calendar" className="space-y-6">
        <CalendarModule 
          clientId={userId} 
          clientName={getUserName()} 
          isCoachView={true}
          showNotifications={true}
        />
      </TabsContent>

      {/* Six Pillars Tab */}
      <TabsContent value="pillars" className="space-y-6">
        <ModularPillarDashboard 
          userId={userId} 
          userName={getUserName()} 
          isCoachView={true}
        />
      </TabsContent>

      {/* Intelligence Tab */}
      <TabsContent value="intelligence" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SwedishNewsWidget 
            newsItems={newsItems} 
            clientName={getUserName()} 
          />
          <SocialWidget 
            socialMetrics={socialMetrics} 
          />
          <SentimentAnalysisWidget 
            sentimentData={sentimentData} 
            onCollectData={() => {
              console.log('🔥 Starting Data Collection for user:', userId);
              
              // Call the data-collector edge function directly
              supabase.functions.invoke('data-collector', {
                body: { 
                  client_id: userId,
                  timestamp: new Date().toISOString(),
                  force_refresh: true
                }
              }).then(({ data, error }) => {
                if (error) {
                  console.error('Data collector error:', error);
                  toast({
                    title: "Datainsamling misslyckades",
                    description: error.message,
                    variant: "destructive"
                  });
                } else {
                  console.log('Data collection success:', data);
                  toast({
                    title: "Datainsamling lyckades",
                    description: "Intelligence-data har uppdaterats"
                  });
                  // Refresh the page data
                  loadClientData();
                }
              });
            }}
          />
        </div>
      </TabsContent>

      {/* Data & Insights Tab */}
      <TabsContent value="data" className="space-y-6">
        <ClientPathTimeline clientId={userId} clientName={getUserName()} />
      </TabsContent>

      {/* Tasks Tab */}
      <TabsContent value="tasks" className="space-y-6">
        <ClientTaskList clientId={userId} />
      </TabsContent>

      {/* Development Tab */}
      <TabsContent value="development" className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Utvecklingsverktyg och progressmätning kommer här</p>
        </div>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsDashboard />
      </TabsContent>
    </Tabs>
  );
};