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
import { InsightAssessment } from '@/components/InsightAssessment/InsightAssessment';
import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { PathTimeline } from '@/components/ClientPath/PathTimeline';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';

interface ClientProfile {
  id: string;
  name: string;
  category: string;
  status: string;
  logic_state?: any;
  velocity_score?: number;
}

interface ClientStats {
  completedTasks: number;
  pendingTasks: number;
  totalPathEntries: number;
  lastAssessment: string | null;
}

export const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    completedTasks: 0,
    pendingTasks: 0,
    totalPathEntries: 0,
    lastAssessment: null
  });
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
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        // Om ingen klientprofil finns, redirecta till onboarding
        navigate('/onboarding');
        return;
      }

      // Kontrollera om onboarding är komplett
      if (!(clientData.profile_metadata as any)?.generalInfo?.name) {
        navigate('/onboarding');
        return;
      }

      setClientProfile(clientData);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Välkommen tillbaka, {profile?.first_name || 'Klient'}!</h1>
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
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Mina Uppgifter</TabsTrigger>
          <TabsTrigger value="assessment">Self Assessment</TabsTrigger>
          <TabsTrigger value="progress">Min Utveckling</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <ClientTaskList clientId={clientProfile.id} clientName={clientProfile.name} />
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Self Assessment
              </CardTitle>
              <p className="text-muted-foreground">
                Bedöm din nuvarande situation och få AI-baserade rekommendationer
              </p>
            </CardHeader>
            <CardContent>
              {stats.lastAssessment && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Senaste assessment: {new Date(stats.lastAssessment).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              )}
              <InsightAssessment clientId={clientProfile.id} clientName={clientProfile.name} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <PathTimeline clientId={clientProfile.id} clientName={clientProfile.name} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard clientId={clientProfile.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};