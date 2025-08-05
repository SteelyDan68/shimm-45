import { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/providers/UnifiedAuthProvider';
import { useStefanKnowledgeBase } from '@/hooks/useStefanKnowledgeBase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  Activity,
  Zap,
  Users,
  Target,
  RefreshCw,
  Download
} from 'lucide-react';

interface AIMetric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  unit?: string;
}

interface StefanInteraction {
  id: string;
  user: string;
  timestamp: Date;
  type: 'question' | 'coaching' | 'analysis';
  status: 'success' | 'warning' | 'error';
  topic: string;
}

export function StefanControlCenter() {
  const { hasRole } = useAuth();
  const { canViewSystemAnalytics, canManageSettings } = usePermissions();
  const { analyzedData, loading } = useStefanKnowledgeBase();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const aiMetrics: AIMetric[] = [
    { label: "Responstid", value: 1.2, trend: 'down', unit: "s" },
    { label: "Träffsäkerhet", value: 94, trend: 'up', unit: "%" },
    { label: "Användarbelåtenhet", value: 4.7, trend: 'up', unit: "/5" },
    { label: "Aktiva sessioner", value: 47, trend: 'up' },
  ];

  const recentInteractions: StefanInteraction[] = [
    {
      id: '1',
      user: 'Emma Andersson',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'coaching',
      status: 'success',
      topic: 'Stress management'
    },
    {
      id: '2',
      user: 'Johan Karlsson',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      type: 'analysis',
      status: 'success',
      topic: 'Career planning'
    },
    {
      id: '3',
      user: 'Maria Lindberg',
      timestamp: new Date(Date.now() - 18 * 60 * 1000),
      type: 'question',
      status: 'warning',
      topic: 'Technical issue'
    }
  ];

  const systemStatus = {
    overall: 98,
    aiModel: 99,
    knowledgeBase: 96,
    responseTime: 95,
    lastTraining: "2024-01-15",
    totalMemories: analyzedData?.length || 0
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (!canViewSystemAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt AI-kontrollcentret.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Control Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Stefan AI Control Center
          </h1>
          <p className="text-muted-foreground">
            Övervakning, konfiguration och optimering av Stefan AI
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          {canManageSettings && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Inställningar
            </Button>
          )}
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <TrendingUp className={`h-4 w-4 ${
                metric.trend === 'up' ? 'text-green-500 rotate-0' : 
                metric.trend === 'down' ? 'text-red-500 rotate-180' : 'text-muted-foreground rotate-90'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <Badge 
                variant={metric.trend === 'up' ? "default" : metric.trend === 'down' ? "destructive" : "secondary"}
                className="mt-1"
              >
                {metric.trend === 'up' ? 'Förbättras' : metric.trend === 'down' ? 'Försämras' : 'Stabilt'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stefan AI Systemstatus
          </CardTitle>
          <CardDescription>
            Realtidsstatus för AI-komponenter och prestanda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Övergripande AI-hälsa</span>
              <div className="flex items-center gap-2">
                <Progress value={systemStatus.overall} className="w-24" />
                <Badge variant={systemStatus.overall > 95 ? "default" : "secondary"}>
                  {systemStatus.overall}%
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{systemStatus.aiModel}%</div>
                <div className="text-sm text-muted-foreground">AI-modell</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{systemStatus.knowledgeBase}%</div>
                <div className="text-sm text-muted-foreground">Kunskapsbas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{systemStatus.responseTime}%</div>
                <div className="text-sm text-muted-foreground">Responstid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{systemStatus.totalMemories}</div>
                <div className="text-sm text-muted-foreground">Minnen</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Control Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="interactions">Interaktioner</TabsTrigger>
          <TabsTrigger value="knowledge">Kunskapsbas</TabsTrigger>
          <TabsTrigger value="training">Träning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Senaste aktivitet</CardTitle>
                <CardDescription>Stefans senaste interaktioner med användare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInteractions.map((interaction) => (
                    <div key={interaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{interaction.user}</div>
                          <div className="text-sm text-muted-foreground">{interaction.topic}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          interaction.status === 'success' ? "default" :
                          interaction.status === 'warning' ? "secondary" : "destructive"
                        }>
                          {interaction.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {interaction.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-prestanda över tid</CardTitle>
                <CardDescription>Trend för Stefan AI:s effektivitet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  Prestandadiagram skulle renderas här
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad interaktionsanalys</CardTitle>
              <CardDescription>Djupgående analys av Stefan AI:s användarinteraktioner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Interaktionsanalys kommer att implementeras här
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kunskapsbashantering</CardTitle>
              <CardDescription>Hantera Stefans kunskapsbas och minnen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{systemStatus.totalMemories}</div>
                    <div className="text-sm text-muted-foreground">Totala minnen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{systemStatus.lastTraining}</div>
                    <div className="text-sm text-muted-foreground">Senaste träning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">2.4 GB</div>
                    <div className="text-sm text-muted-foreground">Kunskapsbasstorlek</div>
                  </div>
                </div>

                <Separator />

                {canManageSettings && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Lägg till kunskap</h4>
                    <Textarea 
                      placeholder="Ange ny information som Stefan ska lära sig..."
                      className="min-h-[100px]"
                    />
                    <Button>
                      <Database className="h-4 w-4 mr-2" />
                      Lägg till i kunskapsbas
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-träning och optimering</CardTitle>
              <CardDescription>Träna och optimera Stefan AI:s prestanda</CardDescription>
            </CardHeader>
            <CardContent>
              {canManageSettings ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Starta träning
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportera modell
                    </Button>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    Träningsgränssnitt kommer att implementeras här
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {hasRole('superadmin') 
                    ? "🚨 SUPERADMIN GOD MODE: Du ska ha full åtkomst här - kontakta utvecklare"
                    : "Du har inte behörighet att hantera AI-träning"
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