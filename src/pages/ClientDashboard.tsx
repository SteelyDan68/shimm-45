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
  Activity,
  AlertCircle
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
import { EnhancedDashboard } from '@/components/Dashboard/EnhancedDashboard';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
import { ProfileCompletionGate } from '@/components/Profile/ProfileCompletionGate';
import { useExtendedProfile } from '@/hooks/useExtendedProfile';
import type { ExtendedProfileData } from '@/types/extendedProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { getExtendedProfile } = useExtendedProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfileData | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    completedTasks: 0,
    pendingTasks: 0,
    totalPathEntries: 0,
    lastAssessment: null
  });
  const [lastAssessmentResult, setLastAssessmentResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasCompletedAssessments, setHasCompletedAssessments] = useState(false);

  useEffect(() => {
    if (user) {
      loadClientProfile();
    }
  }, [user]);

  const loadClientProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Redirect non-clients to appropriate dashboards
      if ((hasRole('superadmin') || hasRole('admin') || hasRole('coach')) && !hasRole('client')) {
        if (hasRole('coach')) {
          navigate('/coach');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      // Load extended profile to check completion
      const extendedData = await getExtendedProfile();
      setExtendedProfile(extendedData);
      
      // Check profile completion
      const isComplete = checkProfileCompletion(extendedData);
      setProfileComplete(isComplete);

      // Get basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        // Create basic profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name,
            last_name: user.user_metadata?.last_name,
          });
        
        if (insertError) throw insertError;
        
        // Reload after creation
        await loadClientProfile();
        return;
      }

      setClientProfile({ 
        id: profileData.id,
        name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email || 'Unknown',
        category: 'general',
        status: profileData.status || 'active',
        logic_state: profileData.logic_state,
        velocity_score: profileData.velocity_score || 50,
        hasOnboardingData: isComplete
      });

      // Check if user has completed any assessments
      const { data: assessments } = await supabase
        .from('pillar_assessments')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      setHasCompletedAssessments((assessments?.length || 0) > 0);

      // Load statistics
      await loadStats(profileData.id);

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

  const checkProfileCompletion = (data: ExtendedProfileData | null) => {
    if (!data) return false;
    
    const requiredFields = [
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.date_of_birth,
      data.primary_role,
      data.location || data.address?.city
    ];

    // Check if at least one social platform is provided
    const hasSocialPlatform = !!(
      data.instagram_handle ||
      data.youtube_handle ||
      data.tiktok_handle ||
      data.facebook_handle ||
      data.twitter_handle ||
      data.snapchat_handle
    );

    const allRequiredFieldsComplete = requiredFields.every(field => field && field.trim() !== '');
    
    return allRequiredFieldsComplete && hasSocialPlatform;
  };

  const loadStats = async (clientId: string) => {
    try {
      // Hämta task-statistik
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', clientId);

      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'planned').length || 0;

      // Hämta path entries
      const { count: pathEntries } = await supabase
        .from('path_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', clientId);

      // Hämta senaste assessment
      const { data: lastAssessment } = await supabase
        .from('path_entries')
        .select('created_at')
        .eq('user_id', clientId)
        .eq('type', 'assessment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Hämta senaste AI-analys
      const { data: lastAnalysis } = await supabase
        .from('path_entries')
        .select('details')
        .eq('user_id', clientId)
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
      {/* Profile completion gate */}
      {!profileComplete && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Komplettera din profil</strong> - Du måste fylla i alla grunduppgifter och minst en social plattform innan du kan göra assessments.
              </span>
              <Button 
                onClick={() => navigate(`/user/${user?.id}`)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 ml-4"
              >
                Komplettera nu
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Assessment reminder for users with complete profiles */}
      {profileComplete && !hasCompletedAssessments && (
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Genomför dina självskattningar</strong> - Gör dina fem pillar-assessments för att aktivera det automatiska systemet och få personliga rekommendationer.
              </span>
              <Button 
                onClick={() => navigate('/tasks')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 ml-4"
              >
                Starta assessments
              </Button>
            </div>
          </AlertDescription>
        </Alert>
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
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Genomförda Uppgifter
              <HelpTooltip content={helpTexts.dashboard.completedTasks} />
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">slutförda tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Väntande Uppgifter
              <HelpTooltip content={helpTexts.dashboard.pendingTasks} />
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">att genomföra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Utvecklingssteg
              <HelpTooltip content={helpTexts.dashboard.pathEntries} />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPathEntries}</div>
            <p className="text-xs text-muted-foreground">dokumenterade steg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Velocity Score
              <HelpTooltip content={helpTexts.dashboard.velocityScore} />
            </CardTitle>
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

      {/* Kapacitetsbarometer och Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Din nuvarande kapacitet
            <HelpTooltip content={helpTexts.dashboard.capacityBarometer} />
          </h2>
          <CapacityBarometer clientId={clientProfile.id} />
        </div>
        
        {/* Quick Actions för klienter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Snabbåtgärder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate(`/user/${user?.id}`)}
              >
                <User className="h-4 w-4 mr-2" />
                Uppdatera min profil
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/tasks')}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Se mina uppgifter
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Kontakta min coach
              </Button>
            </div>
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
      <Tabs defaultValue="enhanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="enhanced">Översikt</TabsTrigger>
          <TabsTrigger value="pillars">Five Pillars</TabsTrigger>
          <TabsTrigger value="journey">Min resa</TabsTrigger>
          <TabsTrigger value="tasks">Mina Uppgifter</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        {/* Enhanced Dashboard - Main Overview */}
        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedDashboard 
            userId={clientProfile.id} 
            userName={clientProfile.name} 
          />
        </TabsContent>

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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard 
            clientId={clientProfile.id} 
            onBack={() => window.history.back()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};