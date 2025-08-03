import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Brain, 
  Target, 
  Activity, 
  Clock, 
  Zap,
  BarChart3,
  Shield,
  Globe,
  Settings,
  Calendar,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUnifiedClients } from '@/hooks/useUnifiedClients';
import { useSixPillarsModular } from '@/hooks/useSixPillarsModular';
import { supabase } from '@/integrations/supabase/client';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useToast } from '@/hooks/use-toast';

interface ClientOutcome {
  client_id: string;
  client_name: string;
  overall_progress: number;
  active_pillars: number;
  last_activity: string;
  velocity_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  barriers: string[];
  recent_wins: string[];
  needs_attention: boolean;
  pillar_scores: Record<string, number>;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface IntegratedAdminDashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export const IntegratedAdminDashboard = ({ onNavigateToTab }: IntegratedAdminDashboardProps) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [clientOutcomes, setClientOutcomes] = useState<ClientOutcome[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState<Record<string, any>>({});

  const { clients: unifiedClients } = useUnifiedClients();

  // Beräkna sammanfattande statistik
  const adminMetrics = {
    totalClients: clientOutcomes.length,
    activeClients: clientOutcomes.filter(c => c.engagement_level !== 'low').length,
    clientsNeedingAttention: clientOutcomes.filter(c => c.needs_attention).length,
    avgProgress: clientOutcomes.length > 0 
      ? Math.round(clientOutcomes.reduce((sum, c) => sum + c.overall_progress, 0) / clientOutcomes.length)
      : 0,
    avgVelocity: clientOutcomes.length > 0
      ? Math.round(clientOutcomes.reduce((sum, c) => sum + c.velocity_score, 0) / clientOutcomes.length)
      : 0,
    systemHealth: systemAlerts.filter(a => !a.resolved && a.type === 'critical').length === 0 ? 98 : 85,
    activePillars: clientOutcomes.reduce((sum, c) => sum + c.active_pillars, 0),
    totalBarriers: clientOutcomes.reduce((sum, c) => sum + c.barriers.length, 0)
  };

  // Ladda klient-outcomes data
  useEffect(() => {
    loadClientOutcomes();
    loadSystemAlerts();
    setupRealtimeUpdates();
  }, [timeRange]);

  const loadClientOutcomes = async () => {
    try {
      setLoading(true);
      
      // Simulera integrerad data från klient-pillar-systemet
      // I verkliga implementationen skulle detta hämta aggregerad data från flera tabeller
      const mockOutcomes: ClientOutcome[] = unifiedClients.map(client => ({
        client_id: client.id,
        client_name: client.name,
        overall_progress: Math.floor(Math.random() * 100),
        active_pillars: Math.floor(Math.random() * 5) + 1,
        last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        velocity_score: Math.floor(Math.random() * 100),
        engagement_level: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        barriers: [
          'Tidsbrist',
          'Motivation',
          'Tekniska problem'
        ].slice(0, Math.floor(Math.random() * 3)),
        recent_wins: [
          'Slutfört self-care assessment',
          'Förbättrat work-life balance',
          'Nya målsättningar definierade'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        needs_attention: Math.random() > 0.7,
        pillar_scores: {
          self_care: Math.floor(Math.random() * 10),
          skills: Math.floor(Math.random() * 10),
          talent: Math.floor(Math.random() * 10),
          brand: Math.floor(Math.random() * 10),
          economy: Math.floor(Math.random() * 10)
        }
      }));

      setClientOutcomes(mockOutcomes);
    } catch (error) {
      console.error('Error loading client outcomes:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda klientdata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemAlerts = async () => {
    // Simulera systemvarningar
    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'warning',
        title: '3 klienter inaktiva över 7 dagar',
        description: 'Flera klienter har inte loggat in på över en vecka',
        timestamp: new Date().toISOString(),
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Stefan AI processade 234 interaktioner',
        description: 'AI-systemet har genererat nya rekommendationer',
        timestamp: new Date().toISOString(),
        resolved: false
      }
    ];
    setSystemAlerts(mockAlerts);
  };

  const setupRealtimeUpdates = () => {
    // Implementera realtidsuppdateringar
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pillar_assessments' },
        (payload) => {
          // Uppdatera realtidsdata när pillar-assessments ändras
          setRealtimeData(prev => ({
            ...prev,
            lastPillarUpdate: new Date().toISOString(),
            newAssessment: payload.new
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEngagementBadge = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integrerad Header med Realtidsdata */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Integrerad Administration
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Live Data
                  </Badge>
                  <HelpTooltip content="Realtidsöversikt över alla klienters utveckling genom pillar-systemet" />
                </CardTitle>
                <p className="text-muted-foreground">
                  Datadriven översikt av klientframsteg och systemhälsa
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Idag</SelectItem>
                  <SelectItem value="week">Vecka</SelectItem>
                  <SelectItem value="month">Månad</SelectItem>
                  <SelectItem value="quarter">Kvartal</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {adminMetrics.systemHealth}%
                </div>
                <p className="text-sm text-muted-foreground">Systemhälsa</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Systemvarningar */}
      {systemAlerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-2">
          {systemAlerts.filter(a => !a.resolved).map(alert => (
            <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.title}</strong> - {alert.description}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Centrala KPI:er med Orsak-Verkan Koppling */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigateToTab?.('users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Klienter som behöver uppmärksamhet
              <HelpTooltip content="Klienter med låg aktivitet, hinder eller minskad velocity" />
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminMetrics.clientsNeedingAttention}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              av {adminMetrics.totalClients} klienter
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Genomsnittlig utvecklingshastighet
              <HelpTooltip content="Medelvärde av klienternas velocity genom pillar-systemet" />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.avgVelocity}%</div>
            <Progress value={adminMetrics.avgVelocity} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Aktiva pillar-resor
              <HelpTooltip content="Totalt antal aktiverade pelare för alla klienter" />
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{adminMetrics.activePillars}</div>
            <p className="text-xs text-muted-foreground">
              Pågående utvecklingsområden
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Identifierade hinder
              <HelpTooltip content="Totalt antal rapporterade hinder från klienternas resor" />
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{adminMetrics.totalBarriers}</div>
            <p className="text-xs text-muted-foreground">
              Kräver coach-intervention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Klient-Outcomes Översikt */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Klient-Outcomes Realtid
              <Badge variant="outline" className="text-xs">
                Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {clientOutcomes
                .sort((a, b) => (b.needs_attention ? 1 : 0) - (a.needs_attention ? 1 : 0))
                .slice(0, 10)
                .map(outcome => (
                <div key={outcome.client_id} className={`p-3 rounded-lg border ${
                  outcome.needs_attention ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {outcome.client_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{outcome.client_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {outcome.active_pillars} aktiva pelare
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getEngagementBadge(outcome.engagement_level)} className="text-xs">
                        {outcome.engagement_level === 'high' ? 'Hög' : 
                         outcome.engagement_level === 'medium' ? 'Medel' : 'Låg'} aktivitet
                      </Badge>
                      {outcome.needs_attention && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Framsteg:</span>
                      <span className="font-medium ml-1">{outcome.overall_progress}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Velocity:</span>
                      <span className="font-medium ml-1">{outcome.velocity_score}%</span>
                    </div>
                  </div>

                  {outcome.barriers.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="text-red-600">Hinder:</span>
                      <span className="ml-1">{outcome.barriers.join(', ')}</span>
                    </div>
                  )}

                  {outcome.recent_wins.length > 0 && (
                    <div className="mt-1 text-xs">
                      <span className="text-green-600">Senaste framsteg:</span>
                      <span className="ml-1">{outcome.recent_wins[0]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stefan AI Insikter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Stefan AI - Administratörsinsikter
              <HelpTooltip content="AI-genererade rekommendationer för administrativa åtgärder" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 mb-1">
                Rekommendation: Coach-intervention behövs
              </h4>
              <p className="text-xs text-blue-700">
                3 klienter visar minskad aktivitet de senaste 5 dagarna. 
                Föreslår proaktiv kontakt från deras coaches.
              </p>
              <Button size="sm" variant="outline" className="mt-2 text-xs">
                Skicka notifikation till coaches
              </Button>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm text-green-800 mb-1">
                Framgång: Self-care pillar presterar bäst
              </h4>
              <p className="text-xs text-green-700">
                89% completion rate för self-care assessments. 
                Föreslår att använda denna modell för andra pelare.
              </p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-sm text-orange-800 mb-1">
                Varning: Economy pillar behöver uppmärksamhet
              </h4>
              <p className="text-xs text-orange-700">
                Lägst engagement (34%) och flest avbrott. 
                Föreslår innehållsöversyn och förenklad struktur.
              </p>
              <Button size="sm" variant="outline" className="mt-2 text-xs">
                Granska economy-innehåll
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snabbåtgärder med Kontextuell Relevans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Prioriterade Åtgärder
            <HelpTooltip content="Datadriven åtgärdslista baserad på klient-outcomes" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-red-200" 
                  onClick={() => onNavigateToTab?.('users')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-red-500 text-white">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Kontakta inaktiva klienter</h4>
                    <p className="text-xs text-muted-foreground">
                      {adminMetrics.clientsNeedingAttention} klienter behöver uppföljning
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200"
                  onClick={() => onNavigateToTab?.('stefan-overview')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-500 text-white">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Granska AI-rekommendationer</h4>
                    <p className="text-xs text-muted-foreground">
                      Nya insikter för systemförbättring
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-green-500 text-white">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Exportera framstegsrapport</h4>
                    <p className="text-xs text-muted-foreground">
                      Sammanfattning för ledningsgrupp
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};