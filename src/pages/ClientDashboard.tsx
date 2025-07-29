import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  Calendar,
  Users,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { generateMockData } from '@/utils/mockDataGenerator';
import { useToast } from '@/hooks/use-toast';
import { useClientLogic } from '@/hooks/useClientLogic';
import { useClientData } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { NewsWidget } from '@/components/NewsWidget';
import { SocialWidget } from '@/components/SocialWidget';

interface Client {
  id: string;
  name: string;
  category: string;
  email?: string;
  status: string;
  logic_state?: any;
}

export const ClientDashboard = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [cacheData, setCacheData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { processClientLogic, isProcessing } = useClientLogic();
  const { getClientCacheData, getNewsMentions, getSocialMetrics } = useClientData();

  useEffect(() => {
    if (clientId && user) {
      loadClientData();
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
      // Reload client data to get updated logic_state
      loadClientData();
    }
  };

  const handleGenerateMockData = async () => {
    if (!clientId) return;
    
    try {
      await generateMockData(clientId);
      toast({
        title: "Testdata genererad",
        description: "Mock-data har lagts till för att testa dashboard",
      });
      loadClientData(); // Reload to show new data
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte generera testdata",
        variant: "destructive",
      });
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'encouraging': return 'bg-blue-100 text-blue-800';
      case 'strategic': return 'bg-purple-100 text-purple-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">Laddar dashboard...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">Klient hittades inte</div>
        </div>
      </div>
    );
  }

  const newsItems = getNewsMentions(cacheData);
  const socialMetrics = getSocialMetrics(cacheData);
  const logicState = client.logic_state;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka
            </Button>
            <Separator orientation="vertical" className="h-6" />
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
              {cacheData.length === 0 && (
                <Button 
                  variant="outline"
                  onClick={handleGenerateMockData}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Lägg till testdata
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
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

          {/* Data Widgets Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <NewsWidget newsItems={newsItems} />
            <SocialWidget socialMetrics={socialMetrics} />
          </div>

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
        </div>
      </main>
    </div>
  );
};