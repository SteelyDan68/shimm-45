import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useUnifiedDataLayer } from '@/hooks/useUnifiedDataLayer';

/**
 * REAL UNIFIED DASHBOARD
 * Ersätter ALL mockdata med riktiga databas-metrics
 * Använder useUnifiedDataLayer för att hämta faktisk systemdata
 */
export function RealUnifiedDashboard() {
  const { user, profile, roles, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const isSuperAdmin = hasRole('superadmin');
  const isCoach = hasRole('coach');
  const navigate = useNavigate();

  // REAL DATA från unified data layer
  const {
    metrics,
    realtimeData,
    loading,
    error,
    refreshAllData,
    isHealthy,
    hasIssues,
    totalActiveUsers,
    canViewMetrics
  } = useUnifiedDataLayer();

  const getRoleBasedGreeting = () => {
    if (isSuperAdmin) return "Superadmin Kontrollcenter";
    if (isAdmin) return "Admin Dashboard"; 
    if (isCoach) return "Coach Översikt";
    return "Dashboard";
  };

  const getRoleBasedDescription = () => {
    if (isSuperAdmin) return "Fullständig systemkontroll med riktiga data";
    if (isAdmin) return "Användarhantering baserat på faktisk systemdata";
    if (isCoach) return "Klientöversikt med verkliga framstegsmätningar";
    return "Systemöversikt";
  };

  if (!canViewMetrics) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Du har inte behörighet att visa admin-metriker.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Laddar riktiga systemdata...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hämtar metrics från databas-tabeller
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Fel vid laddning av systemdata: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={refreshAllData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Försök igen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* REAL DATA HEADER */}
      <Card className={`${isHealthy ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-green-200' : 'bg-gradient-to-r from-orange-50 via-yellow-50 to-red-50 border-orange-200'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Välkommen, {profile?.first_name || user?.email?.split('@')[0]}!
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {getRoleBasedGreeting()}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    RIKTIGA DATA
                  </Badge>
                  <HelpTooltip content="Dashboard med faktiska systemmetriker från databasen - ingen mockdata!" />
                </CardTitle>
                <p className="text-muted-foreground">
                  {getRoleBasedDescription()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Senast uppdaterad: {realtimeData.lastUpdate ? new Date(realtimeData.lastUpdate).toLocaleString('sv-SE') : 'Nu'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshAllData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Uppdatera
              </Button>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${isHealthy ? 'text-green-600' : 'text-orange-600'}`}>
                  {metrics.systemHealthScore}%
                </div>
                <p className="text-sm text-muted-foreground">Systemhälsa</p>
                <Badge variant={isHealthy ? "default" : "destructive"}>
                  {isHealthy ? "Excellent" : "Needs Attention"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SYSTEM ISSUES ALERT */}
      {hasIssues && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Systemvarningar detekterade:</strong>
            {metrics.overdueTasks > 0 && ` ${metrics.overdueTasks} försenade uppgifter,`}
            {metrics.pendingAssessments > 10 && ` ${metrics.pendingAssessments} väntande bedömningar`}
          </AlertDescription>
        </Alert>
      )}

      {/* REAL METRICS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* REAL USER DATA */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-hub/users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Totala användare (RIKTIGT)
              <HelpTooltip content="Faktiskt antal användare från profiles-tabellen" />
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.totalUsers}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              {metrics.activeUsers} aktiva senaste veckan
            </div>
            <Progress value={(metrics.activeUsers / Math.max(metrics.totalUsers, 1)) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* REAL COACH DATA */}
        {(isAdmin || isSuperAdmin) && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                Coaches & Arbetsbelastning
                <HelpTooltip content="Från coach_client_assignments tabellen" />
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCoaches}</div>
              <div className="text-xs text-muted-foreground">
                ⌀ {metrics.averageClientLoad.toFixed(1)} klienter per coach
              </div>
              {metrics.topPerformingCoach && (
                <div className="text-xs text-green-600 mt-1">
                  ⭐ Bäst: {metrics.topPerformingCoach}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* REAL AI RECOMMENDATIONS */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin-hub/ai')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              AI-rekommendationer
              <HelpTooltip content="Från ai_coaching_recommendations tabellen" />
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.aiRecommendations}</div>
            <div className="text-xs text-muted-foreground">
              väntande implementering
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {metrics.activeCoachingSessions} aktiva sessioner
            </div>
          </CardContent>
        </Card>

        {/* REAL TASK DATA */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Uppgifter & Deadlines
              <HelpTooltip content="Från tasks och calendar_events tabellerna" />
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.pendingTasks}</div>
            <div className="text-xs text-muted-foreground">
              pågående uppgifter
            </div>
            <div className="text-xs text-red-600 mt-1">
              {metrics.overdueTasks} försenade
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REAL INSIGHTS ROW */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ASSESSMENT METRICS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Bedömningsaktivitet
              <HelpTooltip content="Riktiga metrics från assessment_states och assessment_rounds" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics.pendingAssessments}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pågående bedömningar
            </p>
            <div className="text-xs text-green-600 mt-2">
              {metrics.completedAssessmentsThisWeek} avslutade denna vecka
            </div>
            <Progress value={(metrics.completedAssessmentsThisWeek / Math.max(metrics.pendingAssessments + metrics.completedAssessmentsThisWeek, 1)) * 100} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* TASK COMPLETION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Uppgiftsgenomförande
              <HelpTooltip content="Verklig statistik från tasks-tabellen" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.completedTasksThisWeek}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Avslutade uppgifter denna vecka
            </p>
            <Progress value={(metrics.completedTasksThisWeek / Math.max(metrics.pendingTasks + metrics.completedTasksThisWeek, 1)) * 100} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* SYSTEM ACTIVITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Live Aktivitet
              <HelpTooltip content="Real-time data från user_journey_tracking" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {totalActiveUsers}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Aktiva användare totalt
            </p>
            <div className="text-xs text-purple-600 mt-2">
              {metrics.upcomingEvents} kommande events
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REAL-TIME STATUS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Live Systemstatus
            <Badge variant="outline" className="text-xs">
              Realtid
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.totalUsers}</div>
              <div className="text-sm text-green-700">Registrerade användare</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</div>
              <div className="text-sm text-blue-700">Aktiva denna vecka</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics.aiRecommendations}</div>
              <div className="text-sm text-purple-700">AI-rekommendationer</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{metrics.systemHealthScore}%</div>
              <div className="text-sm text-orange-700">Systemhälsa</div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-center text-muted-foreground">
            🔴 Live data • Senast uppdaterad: {new Date(realtimeData.lastUpdate).toLocaleTimeString('sv-SE')}
          </div>
        </CardContent>
      </Card>

      {/* DEBUG INFO FÖR DEVELOPMENT */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">🔧 Development Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}