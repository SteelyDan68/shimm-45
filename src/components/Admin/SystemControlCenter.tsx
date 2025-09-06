import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Brain, 
  Database, 
  Bell, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  BarChart3,
  Settings
} from 'lucide-react';
import { systemIntegrationOrchestrator, SystemHealth, SystemMetrics } from '@/services/SystemIntegrationOrchestrator';
import { useToast } from '@/hooks/use-toast';

export const SystemControlCenter: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>(systemIntegrationOrchestrator.getSystemHealth());
  const [metrics, setMetrics] = useState<SystemMetrics>(systemIntegrationOrchestrator.getSystemMetrics());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(systemIntegrationOrchestrator.getSystemHealth());
      setMetrics(systemIntegrationOrchestrator.getSystemMetrics());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await systemIntegrationOrchestrator.optimizeSystem();
      toast({
        title: 'System Optimerat',
        description: 'Systemoptimering slutförd framgångsrikt.',
      });
    } catch (error) {
      toast({
        title: 'Optimering Misslyckades',
        description: 'Kunde inte optimera systemet.',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">SHIMMS Kontrollcenter</h1>
          <p className="text-muted-foreground">Systemövervakning och kontroll</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`${getStatusColor(health.overall)} text-white border-0`}
          >
            {getStatusIcon(health.overall)}
            <span className="ml-2 capitalize">{health.overall}</span>
          </Badge>
          <Button onClick={handleOptimize} disabled={isOptimizing}>
            <Zap className="h-4 w-4 mr-2" />
            {isOptimizing ? 'Optimerar...' : 'Optimera System'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="components">Komponenter</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Systemhälsa</CardTitle>
                {getStatusIcon(health.overall)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{health.overall}</div>
                <p className="text-xs text-muted-foreground">
                  Uppdaterad {new Date(health.lastUpdated).toLocaleTimeString('sv-SE')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktiva Användare</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Senaste 30 minuterna
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dagens Assessments</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dailyAssessments}</div>
                <p className="text-xs text-muted-foreground">
                  +12% från igår
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slutförda Uppgifter</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.tasksCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  Idag
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Systemlast</CardTitle>
                <CardDescription>Aktuell belastning på systemresurser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU</span>
                    <span>{Math.round(metrics.systemLoad * 100)}%</span>
                  </div>
                  <Progress value={metrics.systemLoad * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Minnesanvändning</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Nätverkstrafik</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prestanda Indikatorer</CardTitle>
                <CardDescription>Nyckeltal för systemet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Genomsnittlig svarstid</span>
                  <span className="text-sm font-medium">{health.performance.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Felfrekvens</span>
                  <span className="text-sm font-medium">{(health.performance.errorRate * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Användarnöjdhet</span>
                  <span className="text-sm font-medium">{health.performance.userSatisfaction}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Genomsnittlig engagemangstid</span>
                  <span className="text-sm font-medium">{metrics.avgEngagementTime} min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <CardTitle className="text-base">AI-tjänster</CardTitle>
                  <CardDescription>Stefan AI & Processorer</CardDescription>
                </div>
                <div className="ml-auto">
                  {getStatusIcon(health.components.ai.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant="outline">{health.components.ai.status}</Badge>
                  </div>
                  {health.components.ai.latency && (
                    <div className="flex justify-between text-sm">
                      <span>Latens</span>
                      <span>{health.components.ai.latency}ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <Database className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <CardTitle className="text-base">Databas</CardTitle>
                  <CardDescription>Supabase PostgreSQL</CardDescription>
                </div>
                <div className="ml-auto">
                  {getStatusIcon(health.components.database.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant="outline">{health.components.database.status}</Badge>
                  </div>
                  {health.components.database.latency && (
                    <div className="flex justify-between text-sm">
                      <span>Latens</span>
                      <span>{health.components.database.latency}ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <CardTitle className="text-base">Analytics Engine</CardTitle>
                  <CardDescription>Avancerad dataanalys</CardDescription>
                </div>
                <div className="ml-auto">
                  {getStatusIcon(health.components.analytics.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant="outline">{health.components.analytics.status}</Badge>
                  </div>
                  {health.components.analytics.processingTime && (
                    <div className="flex justify-between text-sm">
                      <span>Processeringstid</span>
                      <span>{health.components.analytics.processingTime}ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <CardTitle className="text-base">Notifikationer</CardTitle>
                  <CardDescription>Realtidsmeddelanden</CardDescription>
                </div>
                <div className="ml-auto">
                  {getStatusIcon(health.components.notifications.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant="outline">{health.components.notifications.status}</Badge>
                  </div>
                  {health.components.notifications.queueSize !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Kölängd</span>
                      <span>{health.components.notifications.queueSize}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Användare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <p className="text-sm text-muted-foreground">Aktiva senaste 30 min</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dailyAssessments}</div>
                <p className="text-sm text-muted-foreground">Genomförda idag</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uppgifter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.tasksCompleted}</div>
                <p className="text-sm text-muted-foreground">Slutförda idag</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Felfrekvens per kategori</CardTitle>
              <CardDescription>Antal fel senaste 24 timmarna</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.errorCounts).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Inga fel rapporterade</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(metrics.errorCounts).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Svarstider</CardTitle>
                <CardDescription>Genomsnittliga svarstider för olika tjänster</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API-anrop</span>
                    <span>{health.performance.avgResponseTime}ms</span>
                  </div>
                  <Progress value={Math.min(100, health.performance.avgResponseTime / 10)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Databasförfrågningar</span>
                    <span>{health.components.database.latency || 0}ms</span>
                  </div>
                  <Progress value={Math.min(100, (health.components.database.latency || 0) / 10)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>AI-processering</span>
                    <span>{health.components.ai.latency || 0}ms</span>
                  </div>
                  <Progress value={Math.min(100, (health.components.ai.latency || 0) / 50)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kvalitetsindikatorer</CardTitle>
                <CardDescription>Mått på systemkvalitet och användarnöjdhet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Systemtillgänglighet</span>
                    <span>99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Användarnöjdhet</span>
                    <span>{health.performance.userSatisfaction}/5.0</span>
                  </div>
                  <Progress value={(health.performance.userSatisfaction / 5) * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Felfrekvens</span>
                    <span>{(health.performance.errorRate * 100).toFixed(3)}%</span>
                  </div>
                  <Progress value={health.performance.errorRate * 100} className="h-2 bg-red-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Systemoptimering</CardTitle>
              <CardDescription>Verktyg för att optimera systemprestanda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Cache-rensning</h4>
                  <p className="text-sm text-muted-foreground">Rensa systemcache för förbättrad prestanda</p>
                </div>
                <Button variant="outline" onClick={handleOptimize} disabled={isOptimizing}>
                  <Settings className="h-4 w-4 mr-2" />
                  Rensa Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};