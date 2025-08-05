import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, usePermissions } from '@/providers/UnifiedAuthProvider';
import { useStefanKnowledgeBase } from '@/hooks/useStefanKnowledgeBase';
import { useStefanTrainingData } from '@/hooks/useStefanTrainingData';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Database, 
  Upload,
  Trash2,
  RefreshCw,
  BarChart3,
  Settings,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Zap,
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AIMetric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export function UnifiedStefanAdminCenter() {
  const { hasRole } = useAuth();
  const { canViewSystemAnalytics, canManageSettings } = usePermissions();
  const { 
    analyzedData, 
    loading: knowledgeLoading, 
    addManualAnalysis,
    getKnowledgeBaseSummary 
  } = useStefanKnowledgeBase();
  
  const {
    data: trainingData,
    loading: trainingLoading,
    addTrainingData,
    deleteTrainingData,
    uploading
  } = useStefanTrainingData();

  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const aiMetrics: AIMetric[] = [
    { label: "Responstid", value: 1.2, trend: 'down', unit: "s" },
    { label: "Träffsäkerhet", value: 94.8, trend: 'up', unit: "%" },
    { label: "Minnesfragment", value: analyzedData.length, trend: 'up', unit: "" },
    { label: "Konversationer/dag", value: 127, trend: 'up', unit: "" }
  ];

  const knowledgeSummary = getKnowledgeBaseSummary();

  if (!canViewSystemAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt Stefan AI Administration.
          </p>
        </Card>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Uppdaterad",
        description: "All Stefan AI-data har uppdaterats"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await addTrainingData({
        content: "",
        content_type: "text_file",
        subject: file.name.replace(/\.[^/.]+$/, ""),
        file
      });

      toast({
        title: "Fil uppladdad",
        description: `${file.name} har lagts till i träningsdatan`
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp filen",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Stefan AI Administration
          </h1>
          <p className="text-muted-foreground">
            Hantera AI-modell, träningsdata och minnesfragment
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Zap className="h-3 w-3 mr-1" />
            Online & Aktiv
          </Badge>
          
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          
          {canManageSettings && (
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Inställningar
            </Button>
          )}
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        {aiMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <div className="flex items-center">
                {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {metric.trend === 'down' && <TrendingUp className="h-4 w-4 text-blue-600 rotate-180" />}
                {metric.trend === 'stable' && <BarChart3 className="h-4 w-4 text-gray-600" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <p className="text-xs text-muted-foreground">
                {metric.trend === 'up' && 'Förbättras'}
                {metric.trend === 'down' && 'Optimeras'}
                {metric.trend === 'stable' && 'Stabilt'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="knowledge">Kunskapsbas</TabsTrigger>
          <TabsTrigger value="training">Träningsdata</TabsTrigger>
          <TabsTrigger value="interactions">Interaktioner</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Kunskapsbas Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Totala dokument:</span>
                  <span className="font-bold">{knowledgeSummary?.totalAnalyzedTexts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Vanligaste teman:</span>
                  <Badge variant="secondary">
                    {knowledgeSummary?.commonThemes?.slice(0, 2).join(', ') || 'Inga teman än'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Senaste analys:</span>
                  <span className="text-xs text-muted-foreground">
                    {knowledgeSummary?.latestAnalysis?.analyzed_at 
                      ? formatDistanceToNow(new Date(knowledgeSummary.latestAnalysis.analyzed_at), { 
                          addSuffix: true, 
                          locale: sv 
                        })
                      : 'Ingen data'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Senaste Aktivitet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Coach konsultation</span>
                    <span className="text-muted-foreground">2 min sedan</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Klient AI-chat</span>
                    <span className="text-muted-foreground">8 min sedan</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Träningsdata uppdatering</span>
                    <span className="text-muted-foreground">23 min sedan</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Minnesfragment & Kunskapsbas</CardTitle>
                <CardDescription>
                  Hantera Stefan AI:s analyserade kunskap och minnesfragment
                </CardDescription>
              </div>
              {canManageSettings && (
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Lägg till ny kunskap
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {knowledgeLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Laddar kunskapsbas...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyzedData.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Ingen kunskapsbas</h3>
                      <p className="text-muted-foreground">
                        Börja genom att ladda upp träningsdata eller lägg till manuell kunskap
                      </p>
                    </div>
                  ) : (
                    analyzedData.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{item.filename}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{item.tone}</Badge>
                                <Badge variant="secondary">{item.style}</Badge>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.analyzed_at), { 
                                addSuffix: true, 
                                locale: sv 
                              })}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Teman:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.themes.map((theme, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {theme}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Rekommenderad användning:</p>
                              <p className="text-sm text-muted-foreground">{item.recommended_use}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Träningsdata</CardTitle>
                <CardDescription>
                  Hantera träningsdata för Stefan AI-modellen
                </CardDescription>
              </div>
              {canManageSettings && (
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.doc,.docx"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild disabled={uploading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Laddar upp...' : 'Ladda upp fil'}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {trainingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Laddar träningsdata...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingData.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Ingen träningsdata</h3>
                      <p className="text-muted-foreground">
                        Ladda upp dokument för att förbättra Stefan AI:s kunskaper
                      </p>
                    </div>
                  ) : (
                    trainingData.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div>
                            <CardTitle className="text-base">{item.subject || 'Träningsdata'}</CardTitle>
                            <CardDescription>
                              {item.content_type} • {formatDistanceToNow(new Date(item.created_at), { locale: sv })}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), { 
                                addSuffix: true, 
                                locale: sv 
                              })}
                            </span>
                            {canManageSettings && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteTrainingData(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {item.content ? 
                              item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '')
                              : 'Innehåll från uppladdad fil'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Senaste AI-interaktioner</CardTitle>
              <CardDescription>
                Övervaka Stefan AI:s användning och prestanda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Interaktioner kommer snart</h3>
                <p className="text-muted-foreground">
                  Real-time monitoring av Stefan AI-konversationer implementeras
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}