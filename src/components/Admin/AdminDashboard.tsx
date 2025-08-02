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
  Brain,
  Zap,
  FileText,
  Globe,
  Lock
} from 'lucide-react';
import StefanMemoryManager from './StefanMemoryManager';

interface AdminDashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export const AdminDashboard = ({ onNavigateToTab }: AdminDashboardProps) => {
  const { user, hasRole } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  console.warn('AdminDashboard är deprecated. Använd IntegratedAdminDashboard istället.');

  // Mock data - replace with real data hooks
  const adminStats = {
    totalUsers: 156,
    activeClients: 89,
    pendingInvitations: 12,
    systemHealth: 98,
    weeklyGrowth: 8.2,
    stefanInteractions: 234,
    activePillars: 5,
    lastBackup: '2024-01-28 03:00',
    criticalAlerts: 1,
    activeAutomations: 12
  };

  const quickActions = [
    {
      title: 'Skapa användare',
      description: 'Lägg till nya användare och tilldela roller',
      icon: UserPlus,
      action: () => onNavigateToTab?.('users'),
      color: 'bg-blue-500',
      priority: 'high'
    },
    {
      title: 'Stefan AI-hantering',
      description: 'Konfigurera och övervaka AI-systemet',
      icon: Brain,
      action: () => onNavigateToTab?.('stefan-overview'),
      color: 'bg-purple-500',
      priority: 'high'
    },
    {
      title: 'Användarbehörigheter',
      description: 'Hantera roller och åtkomstbehörigheter',
      icon: Shield,
      action: () => onNavigateToTab?.('permissions'),
      color: 'bg-green-500',
      priority: 'medium'
    },
    {
      title: 'Systemövervakning',
      description: 'Kontrollera prestanda och drift',
      icon: Activity,
      action: () => onNavigateToTab?.('health'),
      color: 'bg-red-500',
      priority: 'medium'
    },
    {
      title: 'GDPR & Integritet',
      description: 'Hantera användardata och rättigheter',
      icon: Lock,
      action: () => onNavigateToTab?.('gdpr'),
      color: 'bg-orange-500',
      priority: 'low'
    },
    {
      title: 'Automatisering',
      description: 'Konfigurera automatiska processer',
      icon: Zap,
      action: () => onNavigateToTab?.('automation'),
      color: 'bg-indigo-500',
      priority: 'low'
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

  const getPriorityActions = (priority: string) => {
    return quickActions.filter(action => action.priority === priority);
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
                  Systemadministration
                  <HelpTooltip content="Övergripande kontroll över systemet, användare och Stefan AI-funktionalitet" />
                </CardTitle>
                <p className="text-muted-foreground">
                  Centraliserad kontroll över plattformens alla funktioner
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthColor(adminStats.systemHealth)}`}>
                {adminStats.systemHealth}%
              </div>
              <p className="text-sm text-muted-foreground">Systemhälsa</p>
              <Badge variant={getHealthBadge(adminStats.systemHealth)} className="mt-1">
                {adminStats.systemHealth >= 95 ? 'Utmärkt' : 
                 adminStats.systemHealth >= 80 ? 'Bra' : 'Behöver åtgärd'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Totala användare
              <HelpTooltip content="Alla registrerade användare inklusive coaches, klienter och administratörer" />
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{adminStats.weeklyGrowth}% denna vecka
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Stefan AI-interaktioner
              <HelpTooltip content="Antal AI-interaktioner och analyser den senaste veckan" />
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.stefanInteractions}</div>
            <p className="text-xs text-muted-foreground">
              AI-sessioner denna vecka
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Aktiva automationer
              <HelpTooltip content="Antal pågående automatiserade processer i systemet" />
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.activeAutomations}</div>
            <p className="text-xs text-muted-foreground">
              Automatiska processer
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Systemvarningar
              <HelpTooltip content="Aktiva systemvarningar som kräver uppmärksamhet" />
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

      {/* Priority Actions - Reorganized */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Prioriterade åtgärder
              <HelpTooltip content="De viktigaste administrativa funktionerna för daglig drift" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getPriorityActions('high').map((action, index) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Systemöversikt
              <HelpTooltip content="Realtidsöversikt över systemets prestanda och status" />
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
                <span className="text-sm">Stefan AI-status</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Automatiseringar</span>
                <Badge variant="outline" className="text-xs">
                  {adminStats.activeAutomations} aktiva
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            Ytterligare funktioner
            <HelpTooltip content="Mindre frekventa administrativa funktioner" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...getPriorityActions('medium'), ...getPriorityActions('low')].map((action, index) => (
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

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Senaste systemaktivitet
            <HelpTooltip content="De senaste viktiga händelserna i systemet" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <span className="text-sm">3 nya användare registrerade</span>
              </div>
              <span className="text-xs text-muted-foreground">2 tim sedan</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-green-600" />
                <span className="text-sm">Stefan AI-minnesbank uppdaterad</span>
              </div>
              <span className="text-xs text-muted-foreground">4 tim sedan</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Automatisk systemunderhåll slutfört</span>
              </div>
              <span className="text-xs text-muted-foreground">6 tim sedan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};