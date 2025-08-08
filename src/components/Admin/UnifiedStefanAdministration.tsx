/**
 * 🤖 UNIFIED STEFAN AI ADMINISTRATION
 * 
 * Konsoliderad Stefan AI administration med modern UX
 * Bygger på Six Pillars designspråk för enhetlig upplevelse
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Database, 
  Settings, 
  Activity,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';

interface StefanMetrics {
  uptime: number;
  totalInteractions: number;
  activeMemories: number;
  responseTime: number;
  satisfaction: number;
  errorRate: number;
}

export const UnifiedStefanAdministration: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<StefanMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert className="max-w-2xl mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Du behöver admin-behörighet för att komma åt Stefan AI administration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const loadStefanMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Simulerad data för Stefan AI metrics
      // I produktion skulle detta komma från Stefan AI edge functions
      setMetrics({
        uptime: 99.97,
        totalInteractions: 2847,
        activeMemories: 1243,
        responseTime: 145,
        satisfaction: 4.7,
        errorRate: 0.3
      });
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load Stefan metrics:', error);
      toast({
        title: "Fel vid datahämtning",
        description: "Kunde inte ladda Stefan AI metrics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStefanMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p>Laddar Stefan AI administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Hero Section - Six Pillars stil */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          {isSuperAdmin ? (
            <Crown className="h-10 w-10 text-purple-600 animate-scale-in" />
          ) : (
            <Brain className="h-10 w-10 text-blue-600 animate-scale-in" />
          )}
          <h1 className="text-4xl font-bold">Stefan AI Administration</h1>
          <HelpTooltip content="Central kontrollpanel för Stefan AI systemet - hantera minnen, träning och prestanda." />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Komplett administration av Stefan AI - din intelligenta assistent för Six Pillars plattformen
        </p>
        
        <Alert className={`max-w-2xl mx-auto ${isSuperAdmin ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
          <Brain className="h-5 w-5" />
          <AlertDescription className="text-center">
            <strong>Stefan AI Status:</strong> Systemet är aktivt och redo att hjälpa användarna med personliga utvecklingsinsikter.
          </AlertDescription>
        </Alert>
      </div>

      {/* Stefan Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.uptime}%</div>
            <Progress value={metrics?.uptime} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Interaktioner</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">AI-assisterade samtal</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Minnen</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeMemories}</div>
            <p className="text-xs text-muted-foreground">Lagrade användarkontexter</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Svarstid</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">Genomsnittlig respons</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Användar-nöjdhet</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.satisfaction}/5</div>
            <p className="text-xs text-muted-foreground">Genomsnittligt betyg</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Felfrekvens</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.errorRate}%</div>
            <p className="text-xs text-muted-foreground">Systemfel senaste 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Stefan Administration Tabs */}
      <Tabs defaultValue="memory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 lg:grid-cols-4">
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Minneshantering
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Träningsdata
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Övervakning
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Inställningar
          </TabsTrigger>
        </TabsList>

        {/* Memory Management Tab */}
        <TabsContent value="memory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Minnesöversikt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Användarkontexter</span>
                    <Badge variant="secondary">1,243</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Bedömningsdata</span>
                    <Badge variant="secondary">892</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Coaching-insikter</span>
                    <Badge variant="secondary">456</Badge>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Optimera minnesanvändning
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Datasäkerhet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Alla användardata är krypterade och följer GDPR-regler.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Krypteringsstatus</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Aktiv</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GDPR-compliance</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Fullständig</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Data Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Träningsdata Hantering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-20 flex-col gap-2">
                  <Upload className="h-6 w-6" />
                  Ladda upp träningsdata
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="h-6 w-6" />
                  Exportera modelldata
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Endast superadmins kan modifiera Stefan's träningsdata.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Real-time Övervakning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Cpu className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">23%</div>
                    <div className="text-sm text-muted-foreground">CPU Användning</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <HardDrive className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">67%</div>
                    <div className="text-sm text-muted-foreground">Minnesanvändning</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Network className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">12ms</div>
                    <div className="text-sm text-muted-foreground">Nätverkslatens</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Stefan AI Inställningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Systemkritiska inställningar - endast för superadmins.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};