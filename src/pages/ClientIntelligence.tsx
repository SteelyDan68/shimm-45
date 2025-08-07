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
  Info,
  Activity,
  Globe,
  Zap
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useIntelligenceData } from '@/hooks/useIntelligenceData';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ClientIntelligencePage() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const {
    data,
    loading,
    error,
    fetchIntelligenceData,
    triggerDataCollection,
    getNewsData,
    getSocialMetrics,
    getWebResults,
    getAIAnalyses,
    getStats
  } = useIntelligenceData();

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
  }, [user?.id]);

  const loadClientIntelligenceData = async () => {
    if (!user?.id) return;
    
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

    } catch (error) {
      console.error('Error in loadClientIntelligenceData:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel inträffade",
        variant: "destructive",
      });
    }
  };

  const handleDataCollection = async () => {
    if (!user?.id) return;
    
    const success = await triggerDataCollection(user.id, true);
    if (success) {
      await loadClientIntelligenceData();
    }
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

  const newsItems = getNewsData();
  const socialMetrics = getSocialMetrics();
  const webResults = getWebResults();
  const aiAnalyses = getAIAnalyses();
  const stats = getStats();

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
                onClick={() => fetchIntelligenceData()} 
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
              
              <Button 
                onClick={handleDataCollection}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="sm"
              >
                {loading ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin mr-2" />
                    Samlar...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Samla Live Data
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

        {/* Intelligence Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Live Intelligence Dashboard
              <Badge variant="outline" className="bg-green-50 text-green-700">
                v3.0 Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_data_points}
                </div>
                <div className="text-sm text-muted-foreground">Totala datapunkter</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.news_articles}
                </div>
                <div className="text-sm text-muted-foreground">Nyhetsartiklar</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.social_platforms}
                </div>
                <div className="text-sm text-muted-foreground">Sociala plattformar</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.ai_analyses}
                </div>
                <div className="text-sm text-muted-foreground">AI analyser</div>
              </div>
            </div>
            
            {userProfile && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-2">Konfigurerade sociala medier:</div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.instagram_handle && (
                    <Badge variant="secondary">Instagram: @{userProfile.instagram_handle}</Badge>
                  )}
                  {userProfile.youtube_handle && (
                    <Badge variant="secondary">YouTube: @{userProfile.youtube_handle}</Badge>
                  )}
                  {userProfile.tiktok_handle && (
                    <Badge variant="secondary">TikTok: @{userProfile.tiktok_handle}</Badge>
                  )}
                  {userProfile.twitter_handle && (
                    <Badge variant="secondary">Twitter: @{userProfile.twitter_handle}</Badge>
                  )}
                  {userProfile.facebook_handle && (
                    <Badge variant="secondary">Facebook: @{userProfile.facebook_handle}</Badge>
                  )}
                  {!userProfile.instagram_handle && !userProfile.youtube_handle && 
                   !userProfile.tiktok_handle && !userProfile.twitter_handle && 
                   !userProfile.facebook_handle && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Inga social media handles konfigurerade
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="news">Nyheter</TabsTrigger>
            <TabsTrigger value="social">Sociala Medier</TabsTrigger>
            <TabsTrigger value="web">Webbnärvaro</TabsTrigger>
            <TabsTrigger value="insights">AI Insikter</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Live Statistik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.total_data_points}
                      </div>
                      <div className="text-sm text-muted-foreground">Totala datapunkter</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.news_articles}
                      </div>
                      <div className="text-sm text-muted-foreground">Nyhetsartiklar</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.social_platforms}
                      </div>
                      <div className="text-sm text-muted-foreground">Sociala plattformar</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.ai_analyses}
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
                    Senaste insamling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.length > 0 ? (
                    <div className="space-y-3">
                      {data.slice(0, 5).map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium capitalize">
                              {item.data_type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString('sv-SE')}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Ingen data insamlad än.
                      </p>
                      <Button onClick={handleDataCollection} size="sm">
                        <Zap className="h-4 w-4 mr-2" />
                        Starta datainsamling
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Nyheter & Mediebevakining
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {newsItems.length} artiklar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {newsItems.length > 0 ? (
                  <div className="space-y-4">
                    {newsItems.map((news, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-lg mb-2">
                          <a href={news.link} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:text-blue-800">
                            {news.title}
                          </a>
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">{news.snippet}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>📰 {news.displayLink}</span>
                          <span>📅 {new Date(news.collected_at).toLocaleDateString('sv-SE')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Inga nyhetsartiklar hittade</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ingen mediebevakining hittad för {displayName} än.
                    </p>
                    <Button onClick={handleDataCollection} variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Sök efter nyheter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sociala Medier Analytics
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {socialMetrics.length} plattformar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {socialMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {socialMetrics.map((social, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <h3 className="font-semibold capitalize">{social.platform}</h3>
                          <Badge variant="secondary">@{social.handle}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">Följare</div>
                            <div className="font-bold text-lg">{social.metrics.followers?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Följer</div>
                            <div className="font-bold text-lg">{social.metrics.following?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Inlägg</div>
                            <div className="font-bold text-lg">{social.metrics.posts?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Engagement</div>
                            <div className="font-bold text-lg">{social.metrics.engagement_rate?.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Uppdaterad: {new Date(social.collected_at).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Inga sociala medier analyserade</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Lägg till social media handles i din profil och kör datainsamling.
                    </p>
                    <Button onClick={handleDataCollection} variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Analysera sociala medier
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Web Presence Tab */}
          <TabsContent value="web" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Webbnärvaro & Sökresultat
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    {webResults.length} resultat
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {webResults.length > 0 ? (
                  <div className="space-y-4">
                    {webResults.map((web, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-lg mb-2">
                          <a href={web.link} target="_blank" rel="noopener noreferrer" 
                             className="text-purple-600 hover:text-purple-800">
                            {web.title}
                          </a>
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">{web.snippet}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>🌐 {web.displayLink}</span>
                          <span>📅 {new Date(web.collected_at).toLocaleDateString('sv-SE')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Ingen webbnärvaro hittad</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Inga sökresultat för {displayName} hittades än.
                    </p>
                    <Button onClick={handleDataCollection} variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Sök webbnärvaro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Genererade Insikter
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    {aiAnalyses.length} analyser
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAnalyses.length > 0 ? (
                  <div className="space-y-6">
                    {aiAnalyses.map((analysis, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
                        <div className="flex items-center gap-2 mb-4">
                          <Brain className="h-5 w-5 text-orange-600" />
                          <h3 className="font-semibold capitalize">
                            {analysis.analysis_type.replace('_', ' ')}
                          </h3>
                          <Badge variant="secondary">
                            Tillförlitlighet: {(analysis.confidence_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm">
                            {analysis.content}
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Genererad: {new Date(analysis.generated_at).toLocaleDateString('sv-SE')} | 
                          Källor: {analysis.data_sources.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Inga AI-analyser genererade</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Samla data först för att generera AI-insikter.
                    </p>
                    <Button onClick={handleDataCollection} variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Generera AI-analys
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}