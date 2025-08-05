import { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/providers/UnifiedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Brain, 
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  BarChart3,
  UserCheck,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HelpTooltip } from '@/components/HelpTooltip';

interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    needsAttention: number;
    newThisWeek: number;
  };
  coaches: {
    total: number;
    averageClientLoad: number;
    topPerformer: string;
  };
  system: {
    health: number;
    aiRecommendations: number;
    completedTasks: number;
    upcomingDeadlines: number;
  };
  insights: {
    clientSatisfaction: number;
    coachEffectiveness: number;
    systemUtilization: number;
  };
}

export function UnifiedDashboard() {
  const { user, profile, roles, hasRole } = useAuth();
  const { canViewSystemAnalytics } = usePermissions();
  const isAdmin = hasRole('admin');
  const isSuperAdmin = hasRole('superadmin');
  const isCoach = hasRole('coach');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    users: { total: 0, active: 0, needsAttention: 0, newThisWeek: 0 },
    coaches: { total: 0, averageClientLoad: 0, topPerformer: '' },
    system: { health: 0, aiRecommendations: 0, completedTasks: 0, upcomingDeadlines: 0 },
    insights: { clientSatisfaction: 0, coachEffectiveness: 0, systemUtilization: 0 }
  });

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    setLoading(true);
    try {
      // Real data would be loaded here
      const metrics: DashboardMetrics = {
        users: {
          total: 0,
          active: 0,
          needsAttention: 0,
          newThisWeek: 3
        },
        coaches: {
          total: 8,
          averageClientLoad: 5.9,
          topPerformer: 'Anna Andersson'
        },
        system: {
          health: 98,
          aiRecommendations: 23,
          completedTasks: 156,
          upcomingDeadlines: 12
        },
        insights: {
          clientSatisfaction: 4.7,
          coachEffectiveness: 89,
          systemUtilization: 78
        }
      };
      
      setMetrics(metrics);
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedGreeting = () => {
    if (isSuperAdmin) return "Superadmin Kontrollcenter";
    if (isAdmin) return "Admin Dashboard";
    if (isCoach) return "Coach Översikt";
    return "Dashboard";
  };

  const getRoleBasedDescription = () => {
    if (isSuperAdmin) return "Fullständig systemkontroll och övervakning";
    if (isAdmin) return "Användarhantering och systemadministration";
    if (isCoach) return "Klientöversikt och coaching-verktyg";
    return "Systemöversikt";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Välkommen, {profile?.first_name || user?.email?.split('@')[0]}!
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {getRoleBasedGreeting()}
                  </Badge>
                  <HelpTooltip content="Din centrala administrativa kontrollpanel med realtidsdata" />
                </CardTitle>
                <p className="text-muted-foreground">
                  {getRoleBasedDescription()}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.system.health}%
              </div>
              <p className="text-sm text-muted-foreground">Systemhälsa</p>
              <Badge variant={metrics.system.health > 95 ? "default" : "destructive"}>
                {metrics.system.health > 95 ? "Excellent" : "Needs Attention"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* User Metrics */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-hub/users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Användare som behöver uppmärksamhet
              <HelpTooltip content="Användare med problem, inaktivitet eller som behöver coach-intervention" />
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.users.needsAttention}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              av {metrics.users.total} användare
            </div>
            <Progress value={(metrics.users.needsAttention / metrics.users.total) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Coach Performance */}
        {(isAdmin || isSuperAdmin) && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Genomsnittlig coach-belastning
                <HelpTooltip content="Medelvärde av antal klienter per coach för optimal arbetsbelastning" />
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.coaches.averageClientLoad.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                klienter per coach
              </div>
              <div className="text-xs text-green-600 mt-1">
                ⭐ Bäst: {metrics.coaches.topPerformer}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-hub/ai')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Nya AI-rekommendationer
              <HelpTooltip content="Stefan AI har genererat nya insikter och handlingsförslag" />
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.system.aiRecommendations}</div>
            <div className="text-xs text-muted-foreground">
              väntande genomgång
            </div>
            <Badge variant="outline" className="mt-1 text-xs">
              +5 sedan igår
            </Badge>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Kommande deadlines
              <HelpTooltip content="Uppgifter och mål med deadlines inom 3 dagar" />
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.system.upcomingDeadlines}</div>
            <div className="text-xs text-muted-foreground">
              inom 3 dagar
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Kräver uppmärksamhet
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Klientnöjdhet
              <HelpTooltip content="Genomsnittligt betyg från klientfeedback och utvärderingar" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics.insights.clientSatisfaction}/5
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Baserat på 89 utvärderingar denna månad
            </p>
            <Progress value={metrics.insights.clientSatisfaction * 20} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* Coach Effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Coach-effektivitet
              <HelpTooltip content="Genomsnittlig måluppfyllelse för alla coaches baserat på klientframsteg" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.insights.coachEffectiveness}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Måluppfyllelse senaste kvartalet
            </p>
            <Progress value={metrics.insights.coachEffectiveness} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* System Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Systemanvändning
              <HelpTooltip content="Hur aktivt systemet används av alla användare" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {metrics.insights.systemUtilization}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Aktiva användare denna vecka
            </p>
            <Progress value={metrics.insights.systemUtilization} className="h-2 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Snabbåtgärder
            <HelpTooltip content="De vanligaste administrativa uppgifterna för snabb åtkomst" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin-hub/users')}
              className="justify-start gap-2"
            >
              <Users className="h-4 w-4" />
              Hantera användare
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin-hub/analytics')}
              className="justify-start gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Visa analytics
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin-hub/ai')}
              className="justify-start gap-2"
            >
              <Brain className="h-4 w-4" />
              Stefan AI Center
            </Button>
            
            {(isAdmin || isSuperAdmin) && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin-hub/system')}
                className="justify-start gap-2"
              >
                <Activity className="h-4 w-4" />
                Systemhälsa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Senaste aktivitet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>3 nya användare registrerade idag</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>12 uppgifter slutförda denna vecka</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Stefan AI genererade 8 nya rekommendationer</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>2 coaches behöver fler klienter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Viktiga trender
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Användaraktivitet</span>
              <Badge variant="outline" className="text-green-600">+12% denna vecka</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Måluppfyllelse</span>
              <Badge variant="outline" className="text-blue-600">+8% denna månad</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>AI-rekommendationer</span>
              <Badge variant="outline" className="text-purple-600">+15% implementerade</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Systemanvändning</span>
              <Badge variant="outline" className="text-indigo-600">Stabil trend</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}