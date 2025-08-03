import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings,
  Shield,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Bell,
  Mail,
  Key,
  Lock,
  Monitor
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  lastCheck: Date;
  responseTime: number;
}

interface ComplianceItem {
  id: string;
  category: 'gdpr' | 'security' | 'backup' | 'audit';
  title: string;
  status: 'compliant' | 'warning' | 'violation';
  lastCheck: Date;
  description: string;
}

export function SystemAdministrationCenter() {
  const { canManageSettings, canViewSystemAnalytics } = usePermissions();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock system status data
  const systemStatus: SystemStatus[] = [
    {
      service: 'Applikationsserver',
      status: 'operational',
      uptime: 99.8,
      lastCheck: new Date(Date.now() - 2 * 60 * 1000),
      responseTime: 145
    },
    {
      service: 'Databas',
      status: 'operational',
      uptime: 99.9,
      lastCheck: new Date(Date.now() - 1 * 60 * 1000),
      responseTime: 23
    },
    {
      service: 'AI-tjänster',
      status: 'degraded',
      uptime: 98.2,
      lastCheck: new Date(Date.now() - 3 * 60 * 1000),
      responseTime: 1200
    },
    {
      service: 'E-posttjänster',
      status: 'operational',
      uptime: 99.5,
      lastCheck: new Date(Date.now() - 1 * 60 * 1000),
      responseTime: 89
    }
  ];

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      category: 'gdpr',
      title: 'GDPR-kompatibilitet',
      status: 'compliant',
      lastCheck: new Date(Date.now() - 24 * 60 * 60 * 1000),
      description: 'Alla GDPR-krav uppfyllda'
    },
    {
      id: '2',
      category: 'security',
      title: 'Säkerhetspatchar',
      status: 'warning',
      lastCheck: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      description: '2 säkerhetsuppdateringar väntar'
    },
    {
      id: '3',
      category: 'backup',
      title: 'Säkerhetskopiering',
      status: 'compliant',
      lastCheck: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Automatisk backup körs enligt schema'
    },
    {
      id: '4',
      category: 'audit',
      title: 'Granskningsloggar',
      status: 'compliant',
      lastCheck: new Date(Date.now() - 1 * 60 * 60 * 1000),
      description: 'Alla aktiviteter loggas korrekt'
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (!canManageSettings && !canViewSystemAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Åtkomst nekad</h3>
          <p className="text-muted-foreground">
            Du har inte behörighet att komma åt systemadministration.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Admin Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Systemadministration
          </h1>
          <p className="text-muted-foreground">
            Systemhälsa, säkerhet och efterlevnadshantering
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
              <Download className="h-4 w-4 mr-2" />
              Systemrapport
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {systemStatus.some(s => s.status !== 'operational') && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Systemvarning</AlertTitle>
          <AlertDescription className="text-amber-700">
            En eller flera tjänster har degraderad prestanda. Kontrollera systemstatus för detaljer.
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStatus.map((status, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{status.service}</CardTitle>
              <div className="flex items-center gap-1">
                {status.status === 'operational' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : status.status === 'degraded' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.uptime}%</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Svarstid</span>
                  <span>{status.responseTime}ms</span>
                </div>
                <Badge 
                  variant={
                    status.status === 'operational' ? "default" :
                    status.status === 'degraded' ? "secondary" : "destructive"
                  }
                  className="w-full justify-center"
                >
                  {status.status === 'operational' ? 'Operativ' :
                   status.status === 'degraded' ? 'Degraderad' : 'Nere'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Administration Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="compliance">Efterlevnad</TabsTrigger>
          <TabsTrigger value="security">Säkerhet</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="monitoring">Övervakning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Systemresurser</CardTitle>
                <CardDescription>Aktuell resursanvändning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU-användning</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Minnesanvändning</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Diskanvändning</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nätverkstrafik</span>
                    <span>12%</span>
                  </div>
                  <Progress value={12} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Senaste aktivitet</CardTitle>
                <CardDescription>Systemhändelser de senaste 24 timmarna</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '14:30', event: 'Automatisk säkerhetskopiering slutförd', type: 'success' },
                    { time: '12:15', event: 'AI-tjänster restart (planerat underhåll)', type: 'warning' },
                    { time: '09:45', event: 'Säkerhetsuppdatering installerad', type: 'success' },
                    { time: '08:20', event: 'Daglig hälsokontroll slutförd', type: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-12 text-muted-foreground">{activity.time}</div>
                      <div className="flex-1">{activity.event}</div>
                      <Badge variant={activity.type === 'success' ? 'default' : 'secondary'}>
                        {activity.type === 'success' ? 'OK' : 'INFO'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Efterlevnadsstatus
              </CardTitle>
              <CardDescription>
                Övervakning av regelefterlevnad och compliance-krav
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {item.category === 'gdpr' && <FileText className="h-4 w-4" />}
                        {item.category === 'security' && <Shield className="h-4 w-4" />}
                        {item.category === 'backup' && <Database className="h-4 w-4" />}
                        {item.category === 'audit' && <Monitor className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Senast kontrollerad: {item.lastCheck.toLocaleString('sv-SE')}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      item.status === 'compliant' ? 'default' :
                      item.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {item.status === 'compliant' ? 'Efterlever' :
                       item.status === 'warning' ? 'Varning' : 'Brott'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Säkerhetsinställningar</CardTitle>
                <CardDescription>Konfigurera säkerhetsparametrar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {canManageSettings ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Tvåfaktorsautentisering</label>
                        <p className="text-xs text-muted-foreground">Kräv 2FA för alla administratörer</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Lösenordskomplexitet</label>
                        <p className="text-xs text-muted-foreground">Aktivera strikta lösenordskrav</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Session timeout</label>
                        <p className="text-xs text-muted-foreground">Automatisk utloggning efter inaktivitet</p>
                      </div>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15m</SelectItem>
                          <SelectItem value="30">30m</SelectItem>
                          <SelectItem value="60">1h</SelectItem>
                          <SelectItem value="120">2h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Du har inte behörighet att ändra säkerhetsinställningar
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Säkerhetsloggar</CardTitle>
                <CardDescription>Senaste säkerhetshändelser</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '15:22', event: 'Administratör borje.sandhill@gmail.com inloggad', type: 'info' },
                    { time: '14:15', event: 'Misslyckad inloggning från okänd IP', type: 'warning' },
                    { time: '13:30', event: 'Lösenord ändrat för användare emma.coach@example.com', type: 'info' },
                    { time: '12:45', event: 'Säkerhetspatch installerad', type: 'success' }
                  ].map((log, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-12 text-muted-foreground">{log.time}</div>
                      <div className="flex-1">{log.event}</div>
                      <Badge variant={
                        log.type === 'success' ? 'default' :
                        log.type === 'warning' ? 'secondary' : 'outline'
                      }>
                        {log.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Säkerhetskopior</CardTitle>
                <CardDescription>Hantera automatiska säkerhetskopior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Senaste backup</span>
                    <span>Idag 14:30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Backup-storlek</span>
                    <span>2.4 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lagringstid</span>
                    <span>30 dagar</span>
                  </div>
                </div>
                
                <Separator />
                
                {canManageSettings && (
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Skapa manuell backup
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Återställ från backup
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup-historik</CardTitle>
                <CardDescription>Senaste säkerhetskopieringar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: 'Idag 14:30', size: '2.4 GB', status: 'success' },
                    { date: 'Igår 14:30', size: '2.3 GB', status: 'success' },
                    { date: '2024-01-15 14:30', size: '2.4 GB', status: 'success' },
                    { date: '2024-01-14 14:30', size: '2.3 GB', status: 'failed' }
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{backup.date}</div>
                        <div className="text-xs text-muted-foreground">{backup.size}</div>
                      </div>
                      <Badge variant={backup.status === 'success' ? 'default' : 'destructive'}>
                        {backup.status === 'success' ? 'Lyckad' : 'Misslyckad'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Systemövervakning</CardTitle>
              <CardDescription>Konfigurera varningar och övervakningsparametrar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManageSettings ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">E-postaviseringar</label>
                        <p className="text-xs text-muted-foreground">Skicka aviseringar vid systemfel</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mottagare för aviseringar</label>
                      <Input 
                        placeholder="admin@example.com, support@example.com"
                        defaultValue="borje.sandhill@gmail.com"
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CPU-varningsgräns (%)</label>
                      <Input type="number" defaultValue="80" min="1" max="100" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minneströskel (%)</label>
                      <Input type="number" defaultValue="85" min="1" max="100" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Svarstid varning (ms)</label>
                      <Input type="number" defaultValue="2000" min="100" />
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    Spara övervakningsinställningar
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Du har inte behörighet att ändra övervakningsinställningar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}