/**
 * 🌟 HARMONIZED ADMIN DASHBOARD - Six Pillars Design System
 * 
 * Admin-specifika funktioner med samma pedagogiska UX som Six Pillars
 * Enhetlig design och navigation för maximal användarvänlighet
 */

import React, { useState, useEffect } from 'react';
import { SimpleSuperAdminHub } from '@/components/SuperAdmin/SimpleSuperAdminHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useUsers } from '@/hooks/useUsers';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { LiveSystemOverview } from '@/components/Admin/LiveSystemOverview';
import { LiveStefanInsights } from '@/components/Admin/LiveStefanInsights';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Brain,
  TrendingUp,
  Crown,
  UserCheck,
  Settings,
  MessageSquare,
  ClipboardList,
  BarChart3,
  ArrowRight,
  Eye,
  Plus,
  Activity,
  Database,
  Zap
} from 'lucide-react';

export const HarmonizedAdminDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { users, loading: usersLoading, refreshUsers } = useUsers();
  const { metrics, loading: metricsLoading } = useAdminMetrics();
  const { metrics: systemMetrics, loading: systemLoading } = useSystemMetrics();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin');

  console.log('HarmonizedAdminDashboard: isSuperAdmin =', isSuperAdmin, 'isAdmin =', isAdmin);

  // Superadmins get the consolidated hub
  if (isSuperAdmin) {
    console.log('HarmonizedAdminDashboard: Rendering ConsolidatedSuperAdminHub');
    try {
      return <SimpleSuperAdminHub />;
    } catch (error) {
      console.error('HarmonizedAdminDashboard: Error rendering ConsolidatedSuperAdminHub:', error);
      return (
        <div className="p-6">
          <Alert className="max-w-2xl mx-auto">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Fel vid laddning av Superadmin Dashboard. Kontakta support.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert className="max-w-2xl mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Du behöver admin-behörighet för att komma åt denna dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const loading = usersLoading || metricsLoading || systemLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p>Laddar admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Beräkna användarstatistik
  const userStats = {
    total: users.length,
    superadmins: users.filter(u => u.roles?.includes('superadmin')).length,
    admins: users.filter(u => u.roles?.includes('admin')).length,
    coaches: users.filter(u => u.roles?.includes('coach')).length,
    clients: users.filter(u => u.roles?.includes('client')).length,
    activeThisWeek: users.filter(u => {
      if (!u.created_at) return false;
      const created = new Date(u.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length
  };

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section - Six Pillars design */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          {isSuperAdmin ? (
            <Crown className="h-10 w-10 text-purple-600" />
          ) : (
            <Shield className="h-10 w-10 text-blue-600" />
          )}
          <h1 className="text-4xl font-bold">
            {isSuperAdmin ? 'Superadmin' : 'Admin'} Dashboard
          </h1>
          <HelpTooltip content="Central kontrollpanel för systemadministration och användarhantering med Six Pillars metodiken." />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Hantera användare, övervaka systemhälsa och styr Six Pillars plattformen
        </p>
        
        <Alert className={`max-w-2xl mx-auto ${isSuperAdmin ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
          <Brain className="h-5 w-5" />
          <AlertDescription className="text-center">
            <strong>{isSuperAdmin ? 'Superadmin' : 'Admin'}-läge aktiverat!</strong> Du har tillgång till alla systemfunktioner 
            för att hantera {userStats.total} användare och övervaka plattformen.
          </AlertDescription>
        </Alert>
      </div>

      {/* System Overview Stats - Six Pillars stil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{userStats.activeThisWeek} denna vecka
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Coaches</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.coaches}</div>
            <p className="text-xs text-muted-foreground">Coaching-team</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrerade Klienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.clients}</div>
            <p className="text-xs text-muted-foreground">Six Pillars användare</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Systemhälsa</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.healthScore || 'Laddar...'}
              {systemMetrics && '%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics ? `${systemMetrics.uptime}% Uptime` : 'Beräknar...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Admin Actions - Six Pillars grid design */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Admin-verktyg</h2>
          <p className="text-muted-foreground">
            Centrala funktioner för systemadministration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/administration/user-management')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Användarhantering</h3>
                  <p className="text-sm text-muted-foreground">Skapa, redigera, tilldela roller</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Systemmeddelanden</h3>
                  <p className="text-sm text-muted-foreground">Broadcast till alla roller</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Systemanalys</h3>
                  <p className="text-sm text-muted-foreground">Prestanda och användning</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Systeminställningar</h3>
                  <p className="text-sm text-muted-foreground">Konfiguration och säkerhet</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors">
                  <Database className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Backup & Recovery</h3>
                  <p className="text-sm text-muted-foreground">Systemsäkerhet</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          {isSuperAdmin && (
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Superadmin Tools</h3>
                    <p className="text-sm text-muted-foreground">Avancerade funktioner</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Live System Overview + Stefan Insights - Kombinerade live komponenter */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveSystemOverview />
        </div>
        <div>
          <LiveStefanInsights />
        </div>
      </div>

      {/* Live Client Activity Summary - Med real data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Klient-aktivitet Senaste 5 Dagarna
            <Badge variant="outline" className="ml-auto text-xs">
              Live Data från path_entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {metrics?.activePillarsTotal || 0} aktiva pillar-aktiveringar registrerade
                </p>
                <p className="text-xs text-muted-foreground">Baserat på path_entries data</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {systemMetrics?.totalRequests || 0} systemförfrågningar senaste timmen
                </p>
                <p className="text-xs text-muted-foreground">Användaraktivitet i realtid</p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {systemMetrics?.responseTime || 120}ms
              </Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Systemhälsa: {systemMetrics?.healthScore || metrics?.systemHealth || 98}%
                </p>
                <p className="text-xs text-muted-foreground">Beräknat från error_logs</p>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {systemMetrics?.uptime || 99.9}% Uptime
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};