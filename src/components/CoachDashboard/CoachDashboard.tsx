import { useState } from 'react';
import { ClientCard } from './ClientCard';
import { DashboardFilters } from './DashboardFilters';
import { useCoachDashboard } from '@/hooks/useCoachDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Users, Plus, Brain, Target, TrendingUp, CheckSquare, MessageSquare, Calendar, Activity } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { EnhancedCoachInsights } from './EnhancedCoachInsights';
import { ClientOverview } from './ClientOverview';
import { AIRecommendationsPanel } from './AIRecommendationsPanel';
import { ProgressMetrics } from './ProgressMetrics';

export function CoachDashboard() {
  const {
    clients,
    coachStats,
    loading,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    refreshData,
    totalClients,
    filteredCount
  } = useCoachDashboard();

  const { navigateTo, quickActions } = useNavigation();
  const { user, profile } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Coach Welcome Header */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Välkommen, {profile?.first_name || 'Coach'}!
                  <HelpTooltip content="Din centrala vy för att hantera alla klienter och deras utveckling" />
                </CardTitle>
                <p className="text-muted-foreground">
                  Här är en översikt av dina klienter och deras aktuella status
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {coachStats.totalActiveClients}
              </div>
              <p className="text-sm text-muted-foreground">Aktiva klienter</p>
              <Badge variant="outline" className="mt-1">
                {coachStats.highPriorityClients} behöver uppmärksamhet
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Coach Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Genomsnittlig framsteg
              <HelpTooltip content="Medelvärde av alla dina klienters utvecklingsframsteg" />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachStats.avgClientProgress}%</div>
            <Progress value={coachStats.avgClientProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Stefan AI-rekommendationer
              <HelpTooltip content="Antal AI-genererade insikter och förslag för dina klienter" />
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachStats.stefanRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              Nya AI-insikter tillgängliga
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Slutförda uppgifter
              <HelpTooltip content="Antal uppgifter som dina klienter har slutfört den här veckan" />
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              denna vecka
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Kommande deadlines
              <HelpTooltip content="Antal uppgifter och mål med deadlines inom de närmaste dagarna" />
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{coachStats.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              inom 3 dagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Coaches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Snabbåtgärder
            <HelpTooltip content="De vanligaste coach-funktionerna för snabb åtkomst" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateTo(action.url)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary text-primary-foreground">
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

      {/* Enhanced AI Coach Insights */}
      <EnhancedCoachInsights />

      {/* New Dashboard Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientOverview />
        <ProgressMetrics />
      </div>
      
      <AIRecommendationsPanel />

      {/* Client Filters and List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Dina klienter
            <HelpTooltip content="Filtrerade lista över klienter som behöver din uppmärksamhet" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalClients={totalClients}
            filteredCount={filteredCount}
            loading={loading}
            onRefresh={refreshData}
          />
        </CardContent>
      </Card>

      {/* Client Grid */}
      {!loading && filteredCount === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalClients === 0 
                  ? 'Alla klienter mår bra! 🎉' 
                  : 'Inga klienter matchar filtret'
                }
              </h3>
              <p className="text-muted-foreground">
                {totalClients === 0 
                  ? 'Inga av dina klienter behöver uppmärksamhet just nu.'
                  : 'Prova att ändra filter eller sortering för att se andra klienter.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && totalClients > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Klientöversikt
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{totalClients}</div>
                <div className="text-sm text-muted-foreground">Behöver uppmärksamhet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {clients.filter(c => c.issues.some(i => i.severity === 'high')).length}
                </div>
                <div className="text-sm text-muted-foreground">Hög prioritet</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {clients.filter(c => c.issues.some(i => i.type === 'new_barriers')).length}
                </div>
                <div className="text-sm text-muted-foreground">Nya hinder</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {clients.filter(c => c.issues.some(i => i.type === 'inactive')).length}
                </div>
                <div className="text-sm text-muted-foreground">Inaktiva</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}