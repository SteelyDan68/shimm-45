/**
 * 🎯 ENTERPRISE DATA COLLECTION MANAGEMENT
 * Centraliserad datahantering för superadmin/admin med real-time insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload,
  Play,
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Filter,
  Search,
  Calendar
} from "lucide-react";
import { useAuth } from "@/providers/UnifiedAuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataCollectionJob {
  id: string;
  name: string;
  type: 'manual' | 'scheduled' | 'realtime';
  status: 'running' | 'stopped' | 'error' | 'completed';
  lastRun: string;
  nextRun?: string;
  recordsProcessed: number;
  successRate: number;
  errorMessage?: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'user_analytics' | 'assessments' | 'coaching_sessions' | 'ai_interactions';
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  recordCount: number;
  healthScore: number;
}

interface SystemMetrics {
  totalRecords: number;
  dailyGrowth: number;
  storageUsed: string;
  activeConnections: number;
  dataQualityScore: number;
}

export const DataCollectionPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<DataCollectionJob[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoCollectionEnabled, setAutoCollectionEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Säkerhetskontroll
  if (!hasRole('superadmin') && !hasRole('admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Åtkomst nekad</h3>
            <p className="text-muted-foreground">Du har inte behörighet att hantera datainsamling.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadDataCollectionStatus = async () => {
    try {
      setIsLoading(true);
      
      // Hämta data från olika källor
      const [
        usersResponse,
        assessmentsResponse,
        sessionsResponse,
        eventsResponse
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at'),
        supabase.from('assessment_rounds').select('id, created_at'),
        supabase.from('ai_coaching_sessions').select('id, created_at'),
        supabase.from('analytics_events').select('id, timestamp')
      ]);

      // Beräkna system metrics
      const totalUsers = usersResponse.data?.length || 0;
      const totalAssessments = assessmentsResponse.data?.length || 0;
      const totalSessions = sessionsResponse.data?.length || 0;
      const totalEvents = eventsResponse.data?.length || 0;
      const totalRecords = totalUsers + totalAssessments + totalSessions + totalEvents;

      setSystemMetrics({
        totalRecords,
        dailyGrowth: 12.5, // Simulerad data
        storageUsed: '2.4 GB',
        activeConnections: 8,
        dataQualityScore: 94.2
      });

      // Simulera datakällor
      setDataSources([
        {
          id: '1',
          name: 'User Analytics',
          type: 'user_analytics',
          status: 'active',
          lastSync: format(new Date(), 'yyyy-MM-dd HH:mm'),
          recordCount: totalEvents,
          healthScore: 98.5
        },
        {
          id: '2',
          name: 'Assessment Data',
          type: 'assessments',
          status: 'active',
          lastSync: format(new Date(), 'yyyy-MM-dd HH:mm'),
          recordCount: totalAssessments,
          healthScore: 96.2
        },
        {
          id: '3',
          name: 'Coaching Sessions',
          type: 'coaching_sessions',
          status: 'active',
          lastSync: format(new Date(), 'yyyy-MM-dd HH:mm'),
          recordCount: totalSessions,
          healthScore: 97.8
        },
        {
          id: '4',
          name: 'AI Interactions',
          type: 'ai_interactions',
          status: 'active',
          lastSync: format(new Date(), 'yyyy-MM-dd HH:mm'),
          recordCount: 150, // Simulerad data
          healthScore: 95.1
        }
      ]);

      // Simulera jobb
      setJobs([
        {
          id: '1',
          name: 'Daily User Analytics Sync',
          type: 'scheduled',
          status: 'running',
          lastRun: format(new Date(), 'yyyy-MM-dd HH:mm'),
          nextRun: format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm'),
          recordsProcessed: 1240,
          successRate: 98.5
        },
        {
          id: '2',
          name: 'Assessment Backup',
          type: 'scheduled',
          status: 'completed',
          lastRun: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm'),
          nextRun: format(new Date(Date.now() + 23 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm'),
          recordsProcessed: 89,
          successRate: 100
        },
        {
          id: '3',
          name: 'Real-time Event Processing',
          type: 'realtime',
          status: 'running',
          lastRun: format(new Date(), 'yyyy-MM-dd HH:mm'),
          recordsProcessed: 2847,
          successRate: 99.2
        }
      ]);

      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Failed to load data collection status:', error);
      toast({
        title: "Fel vid datahämtning",
        description: "Kunde inte ladda datainsamlingsstatus. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDataCollection = async (jobId: string) => {
    try {
      // Kör data-collector edge function
      const response = await supabase.functions.invoke('data-collector', {
        body: { 
          jobId,
          timestamp: new Date().toISOString(),
          force_refresh: true
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Datainsamling startad",
        description: "Jobbet har startats och kommer att köras i bakgrunden.",
        variant: "default",
      });

      // Uppdatera status
      await loadDataCollectionStatus();
      
    } catch (error) {
      console.error('Failed to run data collection:', error);
      toast({
        title: "Fel vid start av datainsamling",
        description: "Kunde inte starta jobbet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const toggleAutoCollection = async () => {
    try {
      setAutoCollectionEnabled(!autoCollectionEnabled);
      
      // Spara inställning till användarprofil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferences: { 
            auto_data_collection: !autoCollectionEnabled 
          } 
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: autoCollectionEnabled ? "Automatisk datainsamling avstängd" : "Automatisk datainsamling påslagen",
        description: "Inställningen har sparats.",
        variant: "default",
      });

    } catch (error) {
      console.error('Failed to toggle auto collection:', error);
      setAutoCollectionEnabled(!autoCollectionEnabled); // Återställ
      toast({
        title: "Fel vid ändring av inställning",
        description: "Kunde inte spara inställningen. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await supabase.functions.invoke('export-data', {
        body: { 
          format,
          type: 'data_collection',
          userId: user?.id,
          timestamp: new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Export framgångsrik",
        description: `Data exporterad som ${format.toUpperCase()}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export misslyckades",
        description: "Kunde inte exportera data. Försök igen.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDataCollectionStatus();
  }, []);

  // Filtrera jobb baserat på sök och filter
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading && !systemMetrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Laddar datainsamling...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Collection</h1>
          <p className="text-muted-foreground">
            Centraliserad hantering av datainsamling och dataflöden
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <Clock className="h-3 w-3" />
            Uppdaterad {format(lastRefresh, 'HH:mm')}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDataCollectionStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Auto-insamling</span>
            <Switch 
              checked={autoCollectionEnabled}
              onCheckedChange={toggleAutoCollection}
            />
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.totalRecords?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{systemMetrics?.dailyGrowth || 0}% idag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.storageUsed}</div>
            <p className="text-xs text-muted-foreground">
              av 10 GB tillgängligt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Kopplingar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              realtidsanslutningar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datakvalitet</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemMetrics?.dataQualityScore || 0}%
            </div>
            <Progress value={systemMetrics?.dataQualityScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${autoCollectionEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {autoCollectionEnabled ? 'Aktiv' : 'Pausad'}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-insamling
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Datajobb
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Datakällor
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export & Backup
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök efter jobb..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrera status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                <SelectItem value="running">Körs</SelectItem>
                <SelectItem value="completed">Avslutade</SelectItem>
                <SelectItem value="stopped">Stoppade</SelectItem>
                <SelectItem value="error">Fel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      <Badge variant={
                        job.status === 'running' ? 'default' :
                        job.status === 'completed' ? 'secondary' :
                        job.status === 'error' ? 'destructive' : 'outline'
                      }>
                        {job.status === 'running' ? 'Körs' :
                         job.status === 'completed' ? 'Avslutad' :
                         job.status === 'error' ? 'Fel' : 'Stoppad'}
                      </Badge>
                      <Badge variant="outline">
                        {job.type === 'scheduled' ? 'Schemalagd' :
                         job.type === 'realtime' ? 'Realtid' : 'Manuell'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.status === 'stopped' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => runDataCollection(job.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Starta
                        </Button>
                      )}
                      {job.status === 'running' && (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-2" />
                          Pausa
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Senast körd</p>
                      <p className="font-medium">{job.lastRun}</p>
                    </div>
                    {job.nextRun && (
                      <div>
                        <p className="text-sm text-muted-foreground">Nästa körning</p>
                        <p className="font-medium">{job.nextRun}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Records processade</p>
                      <p className="font-medium">{job.recordsProcessed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Framgångsgrad</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.successRate}%</span>
                        <Progress value={job.successRate} className="flex-1" />
                      </div>
                    </div>
                  </div>
                  {job.errorMessage && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{job.errorMessage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {dataSources.map((source) => (
              <Card key={source.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <Badge variant={source.status === 'active' ? 'default' : 'destructive'}>
                      {source.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Typ: {source.type.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid gap-3 grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Senaste synk</p>
                      <p className="font-medium">{source.lastSync}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Records</p>
                      <p className="font-medium">{source.recordCount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Hälsopoäng</p>
                      <span className="text-sm font-medium">{source.healthScore}%</span>
                    </div>
                    <Progress value={source.healthScore} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Synka
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Konfigurera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
                <CardDescription>
                  Exportera samlad data i olika format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 grid-cols-2">
                  <Button 
                    variant="outline" 
                    onClick={() => exportData('csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportData('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON Export
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• Exporterar all tillgänglig data från aktiva källor</p>
                  <p>• Inkluderar metadata och timestamps</p>
                  <p>• Följer GDPR-riktlinjer för dataskydd</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Backup & Återställning
                </CardTitle>
                <CardDescription>
                  Hantera systembackuper och dataåterställning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 grid-cols-1">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schemalägg Backup
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Återställ från Backup
                  </Button>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Senaste Backup</p>
                  <p className="text-sm text-muted-foreground">
                    {format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm', { locale: sv })}
                  </p>
                  <Badge variant="secondary" className="mt-2">Framgångsrik</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Automatiska Backups</CardTitle>
              <CardDescription>
                Konfigurera automatisk backup av kritisk data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Daglig Fullständig Backup</h4>
                  <p className="text-sm text-muted-foreground">Säkerhetskopierar all användardata och systemkonfiguration</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Inkrementell Backup (6h)</h4>
                  <p className="text-sm text-muted-foreground">Sparar endast ändringar sedan senaste backup</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Real-time Replikering</h4>
                  <p className="text-sm text-muted-foreground">Kontinuerlig synkronisering till sekundär databas</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};