import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Brain, 
  CheckSquare,
  TrendingUp,
  MessageSquare,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PillarDashboard } from '@/components/FivePillars/PillarDashboard';
import { UserPillarDashboard } from '@/components/FivePillars/UserPillarDashboard';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { ClientPathTimeline } from '@/components/ClientPath/ClientPathTimeline';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { CapacityBarometer } from '@/components/CapacityBarometer';
import { useUserData } from '@/hooks/useUserData';

interface UserStats {
  completedTasks: number;
  pendingTasks: number;
  totalPathEntries: number;
  lastAssessment: string | null;
}

export const UserDashboard = () => {
  const { user, hasRole } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the enterprise-grade useUserData hook
  const { 
    profile, 
    loading: userDataLoading, 
    getDisplayName, 
    getClientId 
  } = useUserData(userId);

  const [stats, setStats] = useState<UserStats>({
    completedTasks: 0,
    pendingTasks: 0,
    totalPathEntries: 0,
    lastAssessment: null
  });
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if this is coach view
  const isCoachView = hasRole('coach') || hasRole('admin') || hasRole('superadmin');
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get client ID for backward compatibility with existing components
      const userClientId = await getClientId();
      setClientId(userClientId);

      if (userClientId) {
        await loadStats(userClientId);
      }

      // Check access permissions
      if (!isOwnProfile && !isCoachView) {
        toast({
          title: "Åtkomst nekad",
          description: "Du har inte behörighet att visa denna profil.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda användardata: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (clientId: string) => {
    try {
      // Fetch task statistics
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('client_id', clientId);

      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'planned').length || 0;

      // Fetch path entries
      const { count: pathEntries } = await supabase
        .from('path_entries')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Fetch latest assessment
      const { data: lastAssessment } = await supabase
        .from('path_entries')
        .select('created_at')
        .eq('client_id', clientId)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        completedTasks,
        pendingTasks,
        totalPathEntries: pathEntries || 0,
        lastAssessment: lastAssessment?.created_at || null
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getVelocityColor = (score?: number) => {
    if (!score) return 'bg-secondary text-secondary-foreground';
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getVelocityText = (score?: number) => {
    if (!score) return 'Ej bedömd';
    if (score >= 80) return 'Hög hastighet';
    if (score >= 60) return 'Medium hastighet';
    return 'Låg hastighet';
  };

  if (loading || userDataLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-pulse">Laddar användardata...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Användare ej funnen</h3>
              <p className="text-muted-foreground">Kunde inte hitta den begärda användarprofilen.</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Tillbaka till startsidan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = getDisplayName();
  const velocityScore = profile.velocity_score;

  // Check if onboarding is complete
  const hasOnboardingData = !!(
    profile.onboarding_completed || 
    (profile.first_name && profile.client_category && profile.location)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Onboarding reminder for incomplete profiles */}
      {!hasOnboardingData && isOwnProfile && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-warning-foreground">Komplettera din profil</h3>
                <p className="text-sm text-warning-foreground/80">Dina värden visas när du har fyllt i din allmänna information.</p>
              </div>
              <Button 
                onClick={() => navigate('/onboarding')}
                size="sm"
                variant="default"
              >
                Starta här! 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isOwnProfile 
              ? `Välkommen tillbaka, ${displayName.split(' ')[0]}!`
              : `${displayName}s profil`
            }
          </h1>
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "Din personliga utveckling och framsteg" 
              : "Användarens utveckling och framsteg"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{profile.client_category || 'Allmän'}</Badge>
          <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
            {profile.status || 'active'}
          </Badge>
          {isCoachView && !isOwnProfile && (
            <Badge variant="outline">Coach-vy</Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {clientId && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomförda Uppgifter</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">slutförda tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Väntande Uppgifter</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">att genomföra</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utvecklingssteg</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPathEntries}</div>
              <p className="text-xs text-muted-foreground">dokumenterade steg</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Velocity Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{velocityScore || 'N/A'}</div>
              <Badge className={getVelocityColor(velocityScore)} variant="secondary">
                {getVelocityText(velocityScore)}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Capacity Barometer */}
      {clientId && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {isOwnProfile ? "Din nuvarande kapacitet" : "Användarens kapacitet"}
            </h2>
            <CapacityBarometer clientId={clientId} />
          </div>
          
          <div className="space-y-4">
            {/* Future widgets can be added here */}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {profile.logic_state?.recommendation && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-rekommendationer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-background/60 rounded-lg border">
              <p className="text-sm leading-relaxed">{profile.logic_state.recommendation}</p>
            </div>
            
            {profile.logic_state.velocity_rank && (
              <div className="mt-4 flex items-center gap-2">
                <span className="font-medium">Velocity-klass:</span>
                <Badge variant="outline">
                  Klass {profile.logic_state.velocity_rank}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="pillars" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pillars">Five Pillars</TabsTrigger>
          <TabsTrigger value="journey">Min resa</TabsTrigger>
          <TabsTrigger value="tasks">Uppgifter</TabsTrigger>
          <TabsTrigger value="assessment">Självskattning</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        {/* Five Pillars Tab - Using enterprise-grade user-centric component */}
        <TabsContent value="pillars" className="space-y-6">
          {userId && (
            <UserPillarDashboard 
              userId={userId} 
              userName={displayName} 
              isCoachView={isCoachView && !isOwnProfile}
            />
          )}
        </TabsContent>

        {/* Journey Tab */}
        <TabsContent value="journey" className="space-y-6">
          {clientId && (
            <ClientPathTimeline 
              clientId={clientId} 
              clientName={displayName}
              isCoachView={isCoachView && !isOwnProfile}
            />
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {clientId && (
            <ClientTaskList 
              clientId={clientId} 
              clientName={displayName} 
            />
          )}
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          {userId && (
            <PillarDashboard 
              userId={userId} 
              userName={displayName} 
            />
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {clientId && (
            <AnalyticsDashboard clientId={clientId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};