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
import { useNavigate, useLocation } from 'react-router-dom';

import { ClientTaskList } from '@/components/ClientTasks/ClientTaskList';
import { ClientPathTimeline } from '@/components/ClientPath/ClientPathTimeline';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { CapacityBarometer } from '@/components/CapacityBarometer';
import { ModularPillarDashboard } from '@/components/SixPillars/ModularPillarDashboard';
import { EnhancedDashboard } from '@/components/Dashboard/EnhancedDashboard';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
import { PillarJourneyOrchestrator } from '@/components/PillarJourney/PillarJourneyOrchestrator';
import { ClientJourneyOrchestrator } from '@/components/ClientJourney/ClientJourneyOrchestrator';
import { ProgressFeedbackCard } from '@/components/UserJourney/ProgressFeedbackCard';
import { IntelligentPillarSuggestions } from '@/components/UserJourney/IntelligentPillarSuggestions';

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
  const location = useLocation();
  
  // Extract activate pillar from navigation state
  const activatePillar = location.state?.activatePillar;
  
  // Get initial tab from URL params
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'enhanced';
  
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

      // Load extended profile
      const extendedData = await getExtendedProfile();
      setExtendedProfile(extendedData);

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
        hasOnboardingData: true
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
      {/* POST-ASSESSMENT PROGRESS FEEDBACK */}
      <ProgressFeedbackCard className="mb-6" />

      {/* REVOLUTIONERANDE KLIENTRESA-ORCHESTRATOR */}
      <div className="mb-6">
        <ClientJourneyOrchestrator userId={profile?.id || ''} userName={clientProfile.name} />
      </div>

      {/* Header - Simplified for 16-year-olds */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Hej {clientProfile.name?.split(' ')[0] || profile?.first_name || 'kille/tjej'}! 👋</h1>
        <p className="text-muted-foreground">Här kan du se hur du utvecklas och vad du kan göra härnäst</p>
      </div>

      {/* Stats Cards - Simple and fun for 16-year-olds */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-success">{stats.completedTasks}</div>
            <p className="text-sm text-muted-foreground">Klara grejer</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-primary">{stats.pendingTasks}</div>
            <p className="text-sm text-muted-foreground">Att göra</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-lg font-bold text-primary">{getVelocityText(clientProfile.velocity_score)}</div>
            <p className="text-sm text-muted-foreground">Din nivå</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Simplified for 16-year-olds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎯 Vad vill du göra?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => navigate('/edit-profile')}
            >
              <User className="h-6 w-6" />
              <span className="text-sm">Min profil</span>
            </Button>
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => navigate('/tasks')}
            >
              <CheckSquare className="h-6 w-6" />
              <span className="text-sm">Mina uppgifter</span>
            </Button>
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Chatta</span>
            </Button>
          </div>
        </CardContent>
      </Card>

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
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="enhanced">🏠 Hem</TabsTrigger>
          <TabsTrigger value="suggestions">💡 Stefans Tips</TabsTrigger>
          <TabsTrigger value="pillars">🎯 Sex Områden</TabsTrigger>
          <TabsTrigger value="journey">🛤️ Min Resa</TabsTrigger>
          <TabsTrigger value="tasks">✅ Att Göra</TabsTrigger>
          <TabsTrigger value="analytics">📊 Mina Stats</TabsTrigger>
        </TabsList>

        {/* Enhanced Dashboard - Main Overview */}
        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedDashboard 
            userId={clientProfile.id} 
            userName={clientProfile.name} 
          />
        </TabsContent>

        {/* Intelligent Pillar Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <IntelligentPillarSuggestions 
            onPillarSelected={(pillarKey) => {
              // Efter att användaren väljer en pillar, navigera till pillars fliken
              navigate(`/client-dashboard?tab=pillars&active=${pillarKey}`);
            }}
          />
        </TabsContent>

        {/* Six Pillars Tab */}
        <TabsContent value="pillars" className="space-y-6">
          <ModularPillarDashboard 
            userId={clientProfile.id} 
            userName={clientProfile.name} 
            isCoachView={false}
            initialActivatePillar={activatePillar}
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