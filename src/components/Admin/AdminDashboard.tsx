import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
import { 
  Users, 
  Shield, 
  Bot, 
  Database,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Activity,
  BarChart3,
  UserCheck,
  UserPlus,
  MessageSquare,
  Brain
} from 'lucide-react';
import StefanMemoryManager from './StefanMemoryManager';

interface AdminDashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export const AdminDashboard = ({ onNavigateToTab }: AdminDashboardProps) => {
  const { user, hasRole } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Mock data - replace with real data hooks
  const adminStats = {
    totalUsers: 156,
    activeClients: 89,
    pendingInvitations: 12,
    systemHealth: 98,
    automationTasks: 45,
    dataCollectionStatus: 'active',
    lastBackup: '2024-01-28 03:00',
    criticalAlerts: 2,
    recentActivity: 'High'
  };

  const quickActions = [
    {
      title: 'Skapa ny användare',
      description: 'Lägg till en ny användare i systemet',
      icon: UserPlus,
      action: () => onNavigateToTab?.('users'),
      color: 'bg-blue-500'
    },
    {
      title: 'Systemhälsa',
      description: 'Kontrollera systemstatus och prestanda',
      icon: Activity,
      action: () => onNavigateToTab?.('health'),
      color: 'bg-green-500'
    },
    {
      title: 'GDPR-hantering',
      description: 'Hantera datarättigheter och export',
      icon: Shield,
      action: () => onNavigateToTab?.('gdpr'),
      color: 'bg-purple-500'
    },
    {
      title: 'Stefan AI-data',
      description: 'Hantera träningsdata för AI-modeller',
      icon: Bot,
      action: () => onNavigateToTab?.('stefan-data'),
      color: 'bg-orange-500'
    },
    {
      title: 'Stefan Minnesbank',
      description: 'Hantera AI-minnesfragment med embeddings',
      icon: Brain,
      action: () => onNavigateToTab?.('stefan-memory'),
      color: 'bg-pink-500'
    }
  ];

  const getHealthColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (percentage: number) => {
    if (percentage >= 95) return 'default';
    if (percentage >= 80) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Välkommen till Administrationscentret
                  <HelpTooltip content={helpTexts.administration.userRoles} />
                </CardTitle>
                <p className="text-muted-foreground">
                  Hantera användare, system och data från en centraliserad vy
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthColor(adminStats.systemHealth)}`}>
                {adminStats.systemHealth}%
              </div>
              <p className="text-sm text-muted-foreground">Systemhälsa</p>
              <Badge variant={getHealthBadge(adminStats.systemHealth)} className="mt-1">
                {adminStats.systemHealth >= 95 ? 'Excellent' : 
                 adminStats.systemHealth >= 80 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Totala användare
              <HelpTooltip content="Totalt antal registrerade användare i systemet, inklusive alla roller" />
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12 sedan förra månaden
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Aktiva klienter
              <HelpTooltip content="Antal klienter som har varit aktiva de senaste 30 dagarna" />
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              89% aktivitetsgrad
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Väntande inbjudningar
              <HelpTooltip content="Inbjudningar som skickats men inte accepterats än" />
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.pendingInvitations}</div>
            <p className="text-xs text-muted-foreground">
              Väntar på svar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Kritiska varningar
              <HelpTooltip content="Systemvarningar som kräver omedelbar uppmärksamhet" />
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminStats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Kräver åtgärd
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Systemstatus
              <HelpTooltip content="Realtidsöversikt över systemets hälsa och prestanda" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Systemhälsa</span>
                <span className="font-medium">{adminStats.systemHealth}%</span>
              </div>
              <Progress value={adminStats.systemHealth} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Databasanslutning</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">API-status</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Automatisering</span>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Senaste aktivitet
              <HelpTooltip content="Översikt över nylig systemaktivitet och användarengagemang" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Ny användare registrerad</span>
                </div>
                <span className="text-xs text-muted-foreground">2 min sedan</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Automatisk backup slutförd</span>
                </div>
                <span className="text-xs text-muted-foreground">1 tim sedan</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">AI-analys genererad</span>
                </div>
                <span className="text-xs text-muted-foreground">3 tim sedan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Snabbåtgärder
            <HelpTooltip content="Vanligaste administrativa uppgifter för snabb åtkomst" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${action.color} text-white`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Datainsikter
            <HelpTooltip content="Viktiga trender och mätvärden för systemövervakning" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-muted-foreground">Användaraktivitet</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">45</div>
              <div className="text-sm text-muted-foreground">Automatiseringar aktiva</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">99.8%</div>
              <div className="text-sm text-muted-foreground">Systemupptid</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};