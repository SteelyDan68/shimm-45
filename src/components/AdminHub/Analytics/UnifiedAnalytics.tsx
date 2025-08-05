import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Target,
  Brain,
  Activity,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
}

export function UnifiedAnalytics() {
  const { canViewSystemAnalytics, canViewAllClients } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const metrics: MetricCard[] = [
    {
      title: "Aktiva användare",
      value: 247,
      change: "+12%",
      trend: 'up',
      icon: Users
    },
    {
      title: "Genomsnittlig session",
      value: "24 min",
      change: "+8%",
      trend: 'up',
      icon: Clock
    },
    {
      title: "Målavslut",
      value: "78%",
      change: "+15%",
      trend: 'up',
      icon: Target
    },
    {
      title: "AI-interaktioner",
      value: 1834,
      change: "+23%",
      trend: 'up',
      icon: Brain
    }
  ];

  const systemHealth = {
    overall: 98,
    api: 99,
    database: 97,
    ai: 95,
    lastUpdate: "2 minuter sedan"
  };

  const clientProgress = [
    { name: "Aktiva", value: 156, color: "hsl(var(--chart-1))" },
    { name: "Pausade", value: 23, color: "hsl(var(--chart-2))" },
    { name: "Avslutade", value: 45, color: "hsl(var(--chart-3))" },
    { name: "Nya", value: 12, color: "hsl(var(--chart-4))" }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (!canViewSystemAnalytics && !canViewAllClients) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt systemanalys.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insikter</h1>
          <p className="text-muted-foreground">
            Omfattande översikt över systemprestanda och användaraktivitet
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 timmar</SelectItem>
              <SelectItem value="7d">7 dagar</SelectItem>
              <SelectItem value="30d">30 dagar</SelectItem>
              <SelectItem value="90d">90 dagar</SelectItem>
            </SelectContent>
          </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Uppdaterar...' : 'Uppdatera'}
            </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${
                  metric.trend === 'up' ? 'text-green-500' : 
                  metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                }`} />
                <p className="text-xs text-muted-foreground">
                  {metric.change} från förra perioden
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Systemhälsa
          </CardTitle>
          <CardDescription>
            Realtidsstatus för alla systemkomponenter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Övergripande hälsa</span>
              <div className="flex items-center gap-2">
                <Progress value={systemHealth.overall} className="w-24" />
                <Badge variant={systemHealth.overall > 95 ? "default" : "secondary"}>
                  {systemHealth.overall}%
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API</span>
                <Badge variant={systemHealth.api > 95 ? "default" : "destructive"}>
                  {systemHealth.api}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Databas</span>
                <Badge variant={systemHealth.database > 95 ? "default" : "destructive"}>
                  {systemHealth.database}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI-tjänster</span>
                <Badge variant={systemHealth.ai > 95 ? "default" : "destructive"}>
                  {systemHealth.ai}%
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Senast uppdaterad: {systemHealth.lastUpdate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="users">Användare</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
          <TabsTrigger value="ai">AI-analys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Klientframsteg</CardTitle>
                <CardDescription>Distribution av klientstatus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientProgress.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitetstrender</CardTitle>
                <CardDescription>Användaraktivitet över tid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  Diagram skulle renderas här
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Användaranalys</CardTitle>
              <CardDescription>Detaljerad användarstatistik och beteende</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Användaranalys kommer att implementeras här
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prestandaanalys</CardTitle>
              <CardDescription>Systemprestandametrik och optimeringsinsikter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Prestandaanalys kommer att implementeras här
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-analys</CardTitle>
              <CardDescription>Stefan AI-prestanda och användarinteraktioner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                AI-analys kommer att implementeras här
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}