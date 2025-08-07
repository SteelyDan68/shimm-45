import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Brain, 
  Database,
  Plus,
  Eye,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useUnifiedClients } from '@/hooks/useUnifiedClients';

import { 
  EnhancedTooltip, 
  InfoTooltip, 
  HelpTooltip, 
  ActionTooltip,
  FeatureTooltip 
} from '@/components/ui/enhanced-tooltip';

interface Client {
  id: string;
  name: string;
  category: string;
  status: string;
  logic_state?: any;
  created_at: string;
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  recentAnalyses: number;
  dataPoints: number;
}

export const Dashboard = () => {
  const { user, hasRole, profile, roles, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { clients: unifiedClients, loading: clientsLoading } = useUnifiedClients();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    recentAnalyses: 0,
    dataPoints: 0
  });
  const [loading, setLoading] = useState(true);
  
  
  // Map unified clients to dashboard format
  const clients = unifiedClients.map(client => ({
    id: client.id,
    name: client.name,
    category: client.category,
    status: client.status,
    logic_state: client.logic_state,
    created_at: client.created_at
  }));

  useEffect(() => {
    if (user) {
      console.log('🔥 Dashboard: Current user roles:', roles);
      
      // FIXED: Wait for roles to be loaded before redirecting
      if (roles.length > 0) {
        // Redirect clients to their own dashboard
        if (hasRole('client') && !hasRole('admin') && !hasRole('superadmin') && !hasRole('coach')) {
          console.log('🔥 Dashboard: Redirecting client to client dashboard');
          navigate('/client-dashboard', { replace: true });
          return;
        }
        // Redirect coaches to their coach dashboard
        if (hasRole('coach') && !hasRole('admin') && !hasRole('superadmin')) {
          console.log('🔥 Dashboard: Redirecting coach to coach dashboard');
          navigate('/coach', { replace: true });
          return;
        }
      }
      
      loadDashboardData();
    }
  }, [user, hasRole, navigate, unifiedClients, clientsLoading, roles]);

  const checkClientOnboardingStatus = async () => {
    try {
      const { data: clientData } = await supabase
        .from('profiles')
        .select('preferences') // Use preferences instead of profile_metadata
        .eq('email', user!.email)
        .maybeSingle();

      if ((clientData?.preferences as any)?.generalInfo?.name) {
        // Onboarding är klar, gå till client dashboard
        navigate('/client-dashboard');
      } else {
        // Behöver göra onboarding
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      navigate('/client-dashboard');
    }
  };

  const loadDashboardData = async () => {
    if (!user || clientsLoading) return;
    
    setLoading(true);
    try {
      // Calculate stats from unified clients with safe fallbacks
      const totalClients = unifiedClients?.length || 0;
      const activeClients = unifiedClients?.filter(c => c?.status === 'active').length || 0;
      const recentAnalyses = unifiedClients?.filter(c => 
        c?.logic_state && 
        typeof c.logic_state === 'object' && 
        !Array.isArray(c.logic_state) &&
        'last_updated' in c.logic_state
      ).length || 0;

      // Get total data points from path_entries table with safety checks
      let dataPoints = 0;
      try {
        const userIds = unifiedClients?.map(c => c?.id).filter(Boolean) || [];
        if (userIds.length > 0) {
          const { count } = await supabase
            .from('path_entries')
            .select('*', { count: 'exact', head: true })
            .in('user_id', userIds);
          dataPoints = count || 0;
        }
      } catch (dataError) {
        console.warn('Failed to get data points count:', dataError);
        dataPoints = 0;
      }

      setStats({
        totalClients,
        activeClients,
        recentAnalyses,
        dataPoints
      });

    } catch (error: any) {
      console.error('Dashboard data loading error:', error);
      // Set default stats instead of throwing error
      setStats({
        totalClients: 0,
        activeClients: 0,
        recentAnalyses: 0,
        dataPoints: 0
      });
      
      toast({
        title: "Fel",
        description: "Kunde inte hämta uppgifter. Standardvärden visas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'influencer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'creator': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'brand': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'prospect': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">
              Välkommen tillbaka, {profile?.first_name || 'Admin'}!
            </h1>
            <InfoTooltip 
              content="Huvuddashboard för administratörer med systemöversikt och användarstatistik"
            />
          </div>
          <p className="text-muted-foreground">
            Administrativ översikt av systemet och alla användare
            {hasRole('superadmin') && ' - Superadmin behörigheter'}
            {hasRole('admin') && !hasRole('superadmin') && ' - Admin behörigheter'}
          </p>
        </div>
        <ActionTooltip
          content="Öppna administrationsverktyg för att hantera användare och systeminställningar"
          action="Klicka"
          variant="feature"
        >
          <Button onClick={() => navigate('/administration')} className="hover-scale">
            <Plus className="h-4 w-4 mr-2" />
            Hantera användare
          </Button>
        </ActionTooltip>
      </div>


      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Totalt Klienter</CardTitle>
              <EnhancedTooltip 
                content="Visar det totala antalet registrerade klienter i systemet"
                variant="info"
                size="sm"
              />
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">registrerade klienter</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Aktiva Klienter</CardTitle>
              <EnhancedTooltip 
                content="Antal klienter med aktiv status som arbetar tillsammans med dig"
                variant="success"
                size="sm"
              />
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className="text-xs text-muted-foreground">aktiva klienter</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">AI Analyser</CardTitle>
              <EnhancedTooltip 
                content="Antal genomförda AI-analyser och rekommendationer för dina klienter"
                variant="feature"
                size="sm"
              />
            </div>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAnalyses}</div>
            <p className="text-xs text-muted-foreground">genomförda analyser</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Datapunkter</CardTitle>
              <EnhancedTooltip 
                content="Totalt antal insamlade datapunkter från alla källor för alla dina klienter"
                variant="info"
                size="sm"
              />
            </div>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataPoints}</div>
            <p className="text-xs text-muted-foreground">insamlade datapunkter</p>
          </CardContent>
        </Card>
      </div>


      {/* Recent Clients */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Senaste Klienter
            <EnhancedTooltip 
              content="Visar de 6 senast registrerade klienterna med grundläggande information och snabbåtgärder"
              variant="info"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Inga klienter än</h3>
              <p>Lägg till din första klient för att komma igång.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.slice(0, 6).map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {client.name}
                      </CardTitle>
                      <ActionTooltip
                        content="Öppna användarens fullständiga profil med all information och verktyg"
                        action="Klicka"
                        variant="info"
                      >
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/user/${client.id}?context=client`)}
                          className="hover-scale opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </ActionTooltip>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getCategoryColor(client.category)}>
                        {client.category}
                      </Badge>
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      Skapad: {new Date(client.created_at).toLocaleDateString('sv-SE')}
                    </div>
                    {client.logic_state?.velocity_rank && (
                      <div className="mt-2">
                        <Badge variant="outline">
                          Velocity: {client.logic_state.velocity_rank}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {clients.length > 6 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/users')}
              >
                Visa alla användare ({clients.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};