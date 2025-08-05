import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  RefreshCw,
  Eye,
  Database,
  Users,
  Newspaper,
  BarChart3,
  Shield,
  Info
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useClientData } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { IntelligenceDataCollector } from '@/components/Intelligence/IntelligenceDataCollector';
import { SocialWidget } from '@/components/SocialWidget';
import { SwedishNewsWidget } from '@/components/SwedishNewsWidget';
import { SentimentAnalysisWidget } from '@/components/SentimentAnalysisWidget';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ClientIntelligencePage() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [cacheData, setCacheData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getClientCacheData, getNewsMentions, getSocialMetrics } = useClientData();

  // Restrict access to clients only
  if (!hasRole('client')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Begränsad åtkomst</h3>
            <p className="text-muted-foreground mb-4">
              Denna sida är endast tillgänglig för klienter.
            </p>
            <Badge variant="outline" className="text-xs">
              Klientvy
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadClientIntelligenceData();
    
    // Real-time updates
    const channel = supabase
      .channel('client-intelligence-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_data_cache',
          filter: `user_id=eq.${user?.id}`
        },
        () => loadClientIntelligenceData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadClientIntelligenceData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast({
          title: "Fel",
          description: "Kunde inte ladda din profildata",
          variant: "destructive",
        });
        return;
      }

      setUserProfile(profileData);

      // Load intelligence cache data
      const cache = await getClientCacheData(user.id);
      setCacheData(cache);

    } catch (error) {
      console.error('Error in loadClientIntelligenceData:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataCollection = () => {
    if (!user?.id || !userProfile) return;

    // Call the data-collector edge function directly
    supabase.functions.invoke('data-collector', {
      body: { 
        client_id: user.id,
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
          description: "Din intelligence-data har uppdaterats"
        });
        // Refresh the page data
        loadClientIntelligenceData();
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar din intelligence-data...</div>
      </div>
    );
  }

  const displayName = userProfile ? 
    `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email || 'Du' 
    : 'Du';

  const newsItems = getNewsMentions(cacheData);
  const socialMetrics = getSocialMetrics(cacheData);
  const sentimentData = cacheData.filter(item => 
    item.data_type === 'ai_analysis' || item.data_type === 'sentiment_analysis'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Min Intelligence</h1>
                <p className="text-muted-foreground">
                  Ditt digitala fotavtryck och utvecklingsanalys
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Database className="h-3 w-3 mr-1" />
                Personlig analys
              </Badge>
              
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Eye className="h-3 w-3 mr-1" />
                Klientvy
              </Badge>

              <Button 
                onClick={loadClientIntelligenceData} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Uppdaterar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Uppdatera
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Privacy Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Detta är din personliga intelligence-vy. All data är privat och endast synlig för dig och dina tilldelade coaches.
          </AlertDescription>
        </Alert>

        {/* Data Collector */}
        <IntelligenceDataCollector 
          profile={{
            userId: user?.id || '',
            displayName: displayName,
            email: userProfile?.email || '',
            socialProfiles: [
              ...(userProfile?.instagram_handle ? [{ platform: 'instagram', handle: userProfile.instagram_handle }] : []),
              ...(userProfile?.youtube_handle ? [{ platform: 'youtube', handle: userProfile.youtube_handle }] : []),
              ...(userProfile?.tiktok_handle ? [{ platform: 'tiktok', handle: userProfile.tiktok_handle }] : []),
              ...(userProfile?.twitter_handle ? [{ platform: 'twitter', handle: userProfile.twitter_handle }] : []),
              ...(userProfile?.facebook_handle ? [{ platform: 'facebook', handle: userProfile.facebook_handle }] : []),
              ...(userProfile?.snapchat_handle ? [{ platform: 'snapchat', handle: userProfile.snapchat_handle }] : []),
            ]
          }}
          onDataCollected={loadClientIntelligenceData}
        />

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="social">Sociala Medier</TabsTrigger>
            <TabsTrigger value="news">Nyheter & Media</TabsTrigger>
            <TabsTrigger value="insights">AI Insikter</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Snabbstatistik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {cacheData.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Totala datapunkter</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {newsItems.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Nyhetsartiklar</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {socialMetrics.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Sociala plattformar</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {sentimentData.length}
                      </div>
                      <div className="text-sm text-muted-foreground">AI analyser</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Senaste aktivitet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cacheData.length > 0 ? (
                    <div className="space-y-3">
                      {cacheData.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 border rounded">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium capitalize">
                              {item.data_type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString('sv-SE')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ingen aktivitet än. Tryck på "Samla Live Data" för att börja.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <SocialWidget socialMetrics={socialMetrics} />
          </TabsContent>

          {/* News & Media Tab */}
          <TabsContent value="news" className="space-y-6">
            <SwedishNewsWidget 
              newsItems={newsItems} 
              clientName={displayName}
            />
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <SentimentAnalysisWidget 
              sentimentData={sentimentData} 
              onCollectData={handleDataCollection}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}