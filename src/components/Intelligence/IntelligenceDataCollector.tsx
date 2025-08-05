import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Globe, 
  Users, 
  Newspaper,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Play,
  RefreshCw,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IntelligenceDataCollectorProps {
  profile: {
    userId: string;
    displayName: string;
    email: string;
    socialProfiles: Array<{
      platform: string;
      handle?: string;
      verified?: boolean;
      followers?: number;
      following?: number;
      posts?: number;
      engagement?: number;
      url?: string;
    }>;
  };
  onDataCollected?: () => void;
}

interface CollectionStatus {
  stage: string;
  progress: number;
  currentTask: string;
  errors: string[];
  results: {
    news: number;
    social: number;
    web: number;
  };
}

export function IntelligenceDataCollector({ 
  profile, 
  onDataCollected 
}: IntelligenceDataCollectorProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const updateProgress = (stage: string, progress: number, task: string) => {
    setStatus(prev => ({
      ...prev,
      stage,
      progress,
      currentTask: task,
      errors: prev?.errors || [],
      results: prev?.results || { news: 0, social: 0, web: 0 }
    }));
  };

  const handleDataCollection = async () => {
    if (!profile.userId) {
      toast({
        title: "Fel",
        description: "Inget användar-ID hittades",
        variant: "destructive",
      });
      return;
    }

    setIsCollecting(true);
    setStatus({
      stage: 'Initierar',
      progress: 0,
      currentTask: 'Förbereder datainsamling...',
      errors: [],
      results: { news: 0, social: 0, web: 0 }
    });

    try {
      // Stage 1: Validate Profile and Handles
      updateProgress('validation', 10, 'Validerar social media handles...');
      
      if (profile.socialProfiles.filter(p => p.handle).length === 0) {
        console.error('Social handles check failed:', {
          socialProfiles: profile.socialProfiles,
          filteredProfiles: profile.socialProfiles.filter(p => p.handle),
          profileUserId: profile.userId,
          profileDisplayName: profile.displayName
        });
        throw new Error('Inga social media handles konfigurerade');
      }

      // Stage 2: Call Data Collector Function
      updateProgress('collection', 30, 'Anropar data-collector edge function...');
      
      
      
      const { data, error } = await supabase.functions.invoke('data-collector', {
        body: { 
          client_id: profile.userId,
          timestamp: new Date().toISOString(),
          force_refresh: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function fel: ${error.message}`);
      }

      updateProgress('processing', 60, 'Bearbetar insamlad data...');

      if (!data) {
        throw new Error('Ingen data returnerad från edge function');
      }

      if (!data.success) {
        throw new Error(data.error || 'Datainsamling misslyckades');
      }

      const result = data.result;
      
      // Stage 3: Process Results
      updateProgress('finalizing', 90, 'Slutför dataprocessering...');
      
      const totalNews = result?.collected_data?.news?.length || 0;
      const totalSocial = result?.collected_data?.social_metrics?.length || 0;
      const totalWeb = result?.collected_data?.web_scraping?.length || 0;
      
      setStatus(prev => ({
        ...prev!,
        results: {
          news: totalNews,
          social: totalSocial,
          web: totalWeb
        }
      }));

      updateProgress('complete', 100, 'Datainsamling klar!');
      
      setLastResult(result);

      toast({
        title: "Datainsamling lyckades!",
        description: `${totalNews + totalSocial + totalWeb} datapunkter insamlade för ${profile.displayName}`,
      });

      // Trigger refresh
      setTimeout(() => {
        onDataCollected?.();
      }, 1000);

    } catch (error: any) {
      console.error('Data collection error:', error);
      
      setStatus(prev => ({
        ...prev!,
        errors: [...(prev?.errors || []), error.message]
      }));

      toast({
        title: "Datainsamling misslyckades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const handleRefreshData = async () => {
    await handleDataCollection();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Intelligence Data Collector
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Enhanced v2.0
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleDataCollection}
              disabled={isCollecting}
              className="flex items-center gap-2"
            >
              {isCollecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Samlar...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Samla Live Data
                </>
              )}
            </Button>
            
            {lastResult && (
              <Button 
                variant="outline"
                onClick={handleRefreshData}
                disabled={isCollecting}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Profile Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Konfiguerad för: {profile.displayName}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profile.socialProfiles.filter(p => p.handle).map((social, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {getPlatformIcon(social.platform)}
                <span className="capitalize">{social.platform}</span>
                {social.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          {profile.socialProfiles.filter(p => p.handle).length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Inga social media handles konfigurerade. Gå till profilen och lägg till handles.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Collection Progress */}
        {isCollecting && status && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{status.stage}</span>
              <span className="text-sm text-muted-foreground">{status.progress}%</span>
            </div>
            
            <Progress value={status.progress} className="w-full" />
            
            <div className="text-sm text-muted-foreground">
              {status.currentTask}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded">
                <Newspaper className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="text-sm font-medium">{status.results.news}</div>
                <div className="text-xs text-muted-foreground">Nyheter</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <Users className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="text-sm font-medium">{status.results.social}</div>
                <div className="text-xs text-muted-foreground">Social</div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <Globe className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                <div className="text-sm font-medium">{status.results.web}</div>
                <div className="text-xs text-muted-foreground">Web</div>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {status?.errors && status.errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {status.errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {lastResult && !isCollecting && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Datainsamling klar</p>
                <p className="text-sm text-green-700">
                  {(lastResult.collected_data?.news?.length || 0) + 
                   (lastResult.collected_data?.social_metrics?.length || 0) + 
                   (lastResult.collected_data?.web_scraping?.length || 0)} datapunkter insamlade
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <Clock className="h-3 w-3 mr-1" />
                Nyss
              </Badge>
            </div>

            {/* Quick Results Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lastResult.collected_data.news?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Newspaper className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Nyheter</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {lastResult.collected_data.news.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Artiklar hittade
                    </div>
                  </CardContent>
                </Card>
              )}

              {lastResult.collected_data.social_metrics?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Social</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {lastResult.collected_data.social_metrics.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Plattformar analyserade
                    </div>
                  </CardContent>
                </Card>
              )}

              {lastResult.collected_data.web_scraping?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Web</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {lastResult.collected_data.web_scraping.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sidor analyserade
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Default State */}
        {!isCollecting && !lastResult && (
          <div className="text-center py-8">
            <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Redo för intelligens-analys</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analysera {profile.displayName}s digitala fotavtryck i realtid
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 border rounded">
                <Newspaper className="h-4 w-4 mx-auto mb-2 text-blue-500" />
                <div className="font-medium">News Intelligence</div>
                <div className="text-muted-foreground">Google Search API</div>
              </div>
              <div className="p-3 border rounded">
                <Users className="h-4 w-4 mx-auto mb-2 text-green-500" />
                <div className="font-medium">Social Analytics</div>
                <div className="text-muted-foreground">RapidAPI + Social Blade</div>
              </div>
              <div className="p-3 border rounded">
                <Globe className="h-4 w-4 mx-auto mb-2 text-purple-500" />
                <div className="font-medium">Web Intelligence</div>
                <div className="text-muted-foreground">Firecrawl API</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}