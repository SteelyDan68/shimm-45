import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Brain,
  Target,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealUserDataProps {
  userId: string;
  profile: any;
}

interface UserMetrics {
  total_assessments: number;
  completed_tasks: number;
  stefan_interactions: number;
  journey_progress: number;
  active_pillars: number;
  last_activity: string;
  engagement_score: number;
}

/**
 * 🎯 REAL USER DATA COMPONENT
 * Ersätter mockdata med riktiga användarmetrics från databasen
 */
export const RealUserData = ({ userId, profile }: RealUserDataProps) => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadUserMetrics = async () => {
    try {
      setLoading(true);

      // Parallell hämtning av all användardata
      const [
        assessmentResult,
        taskResult,
        stefanResult,
        journeyResult,
        pillarResult
      ] = await Promise.all([
        // Assessment data från path_entries
        supabase
          .from('path_entries')
          .select('id, created_at, metadata')
          .eq('user_id', userId)
          .eq('type', 'assessment'),
        
        // Task data
        supabase
          .from('tasks')
          .select('id, status, completed_at, created_at')
          .eq('user_id', userId),
        
        // Stefan interactions
        supabase
          .from('stefan_interactions')
          .select('id, created_at')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Journey state
        supabase
          .from('user_journey_states')
          .select('journey_progress, last_activity_at, completed_assessments')
          .eq('user_id', userId)
          .maybeSingle(),
        
        // Active pillars from attribute system
        supabase.functions.invoke('get-user-attribute', {
          body: {
            user_id: userId,
            attribute_key: 'pillar_activations'
          }
        })
      ]);

      // Beräkna metrics från real data
      const totalAssessments = assessmentResult.data?.length || 0;
      const completedTasks = taskResult.data?.filter(t => t.status === 'completed').length || 0;
      const stefanInteractions = stefanResult.data?.length || 0;
      const activePillarsData = pillarResult.data?.data || [];
      const activePillars = Array.isArray(activePillarsData) ? 
        activePillarsData.filter((p: any) => p.is_active !== false).length : 0;
      const journeyProgress = journeyResult.data?.journey_progress || 0;
      const lastActivity = journeyResult.data?.last_activity_at || profile.updated_at;

      // Beräkna engagement score baserat på aktivitet
      const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (24 * 60 * 60 * 1000));
      const engagementScore = Math.max(0, Math.min(100, 
        100 - (daysSinceActivity * 5) + (stefanInteractions * 2) + (completedTasks * 5) + (totalAssessments * 10)
      ));

      const userMetrics: UserMetrics = {
        total_assessments: totalAssessments,
        completed_tasks: completedTasks,
        stefan_interactions: stefanInteractions,
        journey_progress: journeyProgress,
        active_pillars: activePillars,
        last_activity: lastActivity,
        engagement_score: engagementScore
      };

      setMetrics(userMetrics);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading user metrics:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda användardata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserMetrics();
  }, [userId]);

  // Realtime subscriptions för live uppdateringar
  useEffect(() => {
    const channels = [
      supabase
        .channel(`user-${userId}-assessments`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'path_entries', filter: `user_id=eq.${userId}` },
          () => loadUserMetrics()
        )
        .subscribe(),

      supabase
        .channel(`user-${userId}-tasks`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
          () => loadUserMetrics()
        )
        .subscribe(),

      supabase
        .channel(`user-${userId}-stefan`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'stefan_interactions', filter: `user_id=eq.${userId}` },
          () => loadUserMetrics()
        )
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId]);

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 70) return 'Hög aktivitet';
    if (score >= 40) return 'Måttlig aktivitet';
    return 'Låg aktivitet';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Kunde inte ladda användarmetrics
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header med refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Användaraktivitet
          </h3>
          <p className="text-sm text-muted-foreground">
            Senast uppdaterad: {lastUpdated.toLocaleTimeString('sv-SE')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUserMetrics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>

      {/* Real User Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEngagementColor(metrics.engagement_score)}`}>
              {metrics.engagement_score}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getEngagementLevel(metrics.engagement_score)}
            </p>
            <Progress value={metrics.engagement_score} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utvecklingsframsteg</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.journey_progress}%</div>
            <p className="text-xs text-muted-foreground">
              Journey progression
            </p>
            <Progress value={metrics.journey_progress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stefan AI Sessioner</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.stefan_interactions}</div>
            <p className="text-xs text-muted-foreground">
              Senaste 30 dagarna
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomförda Assessments</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{metrics.total_assessments}</div>
            <p className="text-xs text-muted-foreground">
              Totalt genomförda
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-teal-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slutförda Uppgifter</CardTitle>
            <Target className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{metrics.completed_tasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks slutförda
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Pelare</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.active_pillars}</div>
            <p className="text-xs text-muted-foreground">
              Pågående utvecklingsområden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aktivitetshistorik */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Senaste Aktivitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Senaste aktivitet:</span>
              <span className="font-medium">
                {new Date(metrics.last_activity).toLocaleString('sv-SE')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dagar sedan aktivitet:</span>
              <span className="font-medium">
                {Math.floor((Date.now() - new Date(metrics.last_activity).getTime()) / (24 * 60 * 60 * 1000))} dagar
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aktivitetstrend:</span>
              <Badge variant={metrics.engagement_score >= 70 ? "default" : metrics.engagement_score >= 40 ? "secondary" : "destructive"}>
                {metrics.engagement_score >= 70 ? "Stigande" : metrics.engagement_score >= 40 ? "Stabil" : "Minskande"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};