import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { useNavigate } from 'react-router-dom';
import { PillarDashboard } from '@/components/FivePillars/PillarDashboard';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { ClientPathTimeline } from '@/components/ClientPath/ClientPathTimeline';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { CapacityBarometer } from '@/components/CapacityBarometer';
import { ModularPillarDashboard } from '@/components/FivePillars/ModularPillarDashboard';

interface ClientProfile {
  id: string;
  name: string;
  category: string;
  status: string;
  logic_state?: any;
  velocity_score?: number;
  hasOnboardingData?: boolean;
}

interface ClientStats {
  completedTasks: number;
  pendingTasks: number;
  totalPathEntries: number;
  lastAssessment: string | null;
}

export const ClientDashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    completedTasks: 0,
    pendingTasks: 0,
    totalPathEntries: 0,
    lastAssessment: null
  });
  const [lastAssessmentResult, setLastAssessmentResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClientProfile();
    }
  }, [user]);

  const loadClientProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Hitta klient som matchar användarens email
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        // Kontrollera om användaren är admin/coach - då ska de inte vara här
        if (hasRole('superadmin') || hasRole('admin') || hasRole('coach')) {
          navigate('/admin');
          return;
        }
        // Om vanlig användare utan klientprofil, redirecta till onboarding
        navigate('/onboarding');
        return;
      }

      // Check if onboarding is complete - improved logic using preferences
      const metadata = (clientData.preferences as any);
      const hasOnboardingData = !!(
        metadata?.onboardingCompleted || 
        (metadata?.generalInfo?.name && metadata?.publicRole?.primaryRole && metadata?.lifeMap?.location)
      );

      setClientProfile({ 
        id: clientData.id,
        name: `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || clientData.email || 'Unknown',
        category: 'general', // Default category
        status: clientData.status || 'active',
        logic_state: (clientData.preferences as any)?.logic_state,
        velocity_score: (clientData.preferences as any)?.velocity_score,
        hasOnboardingData 
      });

      // Ladda statistik
      await loadStats(clientData.id);

    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda klientprofil: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (clientId: string) => {
    try {
      // Hämta task-statistik
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('client_id', clientId);

      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'planned').length || 0;

      // Hämta path entries
      const { count: pathEntries } = await supabase
        .from('path_entries')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Hämta senaste assessment
      const { data: lastAssessment } = await supabase
        .from('path_entries')
        .select('created_at')
        .eq('client_id', clientId)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Hämta senaste AI-analys
      const { data: lastAnalysis } = await supabase
        .from('path_entries')
        .select('details')
        .eq('client_id', clientId)
        .eq('type', 'recommendation')
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        completedTasks,
        pendingTasks,
        totalPathEntries: pathEntries || 0,
        lastAssessment: lastAssessment?.created_at || null
      });

      setLastAssessmentResult(lastAnalysis?.details || null);

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getVelocityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getVelocityText = (score?: number) => {
    if (!score) return 'Ej bedömd';
    if (score >= 80) return 'Hög hastighet';
    if (score >= 60) return 'Medium hastighet';
    return 'Låg hastighet';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Laddar din profil...</div>
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen klientprofil</h3>
              <p className="text-muted-foreground">Kontakta din coach för att få en profil skapad.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Onboarding varning om data saknas - döljs när användaren fyllt i allmänna info */}
      {!clientProfile.hasOnboardingData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-800">Här är din översikt</h3>
                <p className="text-sm text-orange-700">Dina värden visas när du har fyllt i din allmänna information.</p>
              </div>
              <Button 
                onClick={() => navigate('/onboarding')}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
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
          <h1 className="text-3xl font-bold">Välkommen tillbaka, {clientProfile.name?.split(' ')[0] || profile?.first_name || 'Klient'}!</h1>
          <p className="text-muted-foreground">Din personliga utveckling och framsteg</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{clientProfile.category}</Badge>
          <Badge variant={clientProfile.status === 'active' ? 'default' : 'secondary'}>
            {clientProfile.status}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
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
            <div className="text-2xl font-bold">{clientProfile.velocity_score || 'N/A'}</div>
            <Badge className={getVelocityColor(clientProfile.velocity_score)} variant="secondary">
              {getVelocityText(clientProfile.velocity_score)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Kapacitetsbarometer - Efter stats-kort */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Din nuvarande kapacitet</h2>
          <CapacityBarometer clientId={clientProfile.id} />
        </div>
        
        {/* Placeholder för framtida komponenter */}
        <div className="space-y-4">
          {/* Här kan vi lägga till fler widgets senare */}
        </div>
      </div>

      {/* AI Recommendations */}
      {clientProfile.logic_state?.recommendation && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-rekommendationer från din coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-background/60 rounded-lg border">
              <p className="text-sm leading-relaxed">{clientProfile.logic_state.recommendation}</p>
            </div>
            
            {clientProfile.logic_state.velocity_rank && (
              <div className="mt-4 flex items-center gap-2">
                <span className="font-medium">Din velocity-klass:</span>
                <Badge variant="outline">
                  Klass {clientProfile.logic_state.velocity_rank}
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
          <TabsTrigger value="tasks">Mina Uppgifter</TabsTrigger>
          <TabsTrigger value="assessment">Självskattning</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        {/* Five Pillars Tab */}
        <TabsContent value="pillars" className="space-y-6">
          <ModularPillarDashboard 
            userId={clientProfile.id} 
            userName={clientProfile.name} 
            isCoachView={false}
          />
        </TabsContent>

        
        {/* Journey Tab */}
        <TabsContent value="journey" className="space-y-6">
          <ClientPathTimeline 
            clientId={clientProfile.id} 
            clientName={clientProfile.name}
            isCoachView={false}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <ClientTaskList clientId={clientProfile.id} clientName={clientProfile.name} />
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          <PillarDashboard userId={clientProfile.id} userName={clientProfile.name} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard clientId={clientProfile.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};