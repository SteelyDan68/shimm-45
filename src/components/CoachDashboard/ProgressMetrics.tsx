import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react';

interface MetricsData {
  totalClients: number;
  activeClients: number;
  averageProgress: number;
  completedAssessments: number;
  weeklyActivity: number;
  interventions: number;
}

export function ProgressMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalClients: 0,
    activeClients: 0,
    averageProgress: 0,
    completedAssessments: 0,
    weeklyActivity: 0,
    interventions: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadMetrics();
    }
  }, [user?.id]);

  const loadMetrics = async () => {
    try {
      // Hämta klientdata
      // Hämta klientdata och journey tracking separat
      const { data: assignments } = await supabase
        .from('coach_client_assignments')
        .select('client_id')
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (!assignments) return;

      // Hämta journey tracking för klienterna
      const clientIds = assignments.map(a => a.client_id);
      const { data: journeyData } = await supabase
        .from('user_journey_tracking')
        .select('user_id, overall_progress, last_activity_at')
        .in('user_id', clientIds);

      // Hämta interventioner senaste veckan
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: triggers } = await supabase
        .from('autonomous_triggers')
        .select('*')
        .gte('condition_met_at', weekAgo.toISOString());

      // Hämta slutförda assessments senaste veckan
      const { data: assessments } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('is_draft', false)
        .gte('completed_at', weekAgo.toISOString());

      const totalClients = assignments.length;
      const journeyMap = new Map(journeyData?.map(j => [j.user_id, j]) || []);
      
      const activeClients = assignments.filter(a => {
        const journey = journeyMap.get(a.client_id);
        if (!journey?.last_activity_at) return false;
        const daysSince = (Date.now() - new Date(journey.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }).length;

      const averageProgress = assignments.reduce((sum, a) => {
        const journey = journeyMap.get(a.client_id);
        return sum + (journey?.overall_progress || 0);
      }, 0) / totalClients || 0;

      setMetrics({
        totalClients,
        activeClients,
        averageProgress: Math.round(averageProgress),
        completedAssessments: assessments?.length || 0,
        weeklyActivity: activeClients,
        interventions: triggers?.length || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    progress, 
    subtitle 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    progress?: number; 
    subtitle?: string;
  }) => (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mb-2">{subtitle}</div>
      )}
      {progress !== undefined && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progressmått
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Progressmått
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Totala klienter"
            value={metrics.totalClients}
            icon={Users}
            subtitle="Aktiva tilldelningar"
          />
          
          <MetricCard
            title="Aktiva denna vecka"
            value={metrics.activeClients}
            icon={TrendingUp}
            progress={(metrics.activeClients / metrics.totalClients) * 100}
          />
          
          <MetricCard
            title="Genomsnittlig framsteg"
            value={`${metrics.averageProgress}%`}
            icon={Target}
            progress={metrics.averageProgress}
          />
          
          <MetricCard
            title="Slutförda assessments"
            value={metrics.completedAssessments}
            icon={Target}
            subtitle="Senaste 7 dagarna"
          />
          
          <MetricCard
            title="AI-interventioner"
            value={metrics.interventions}
            icon={BarChart3}
            subtitle="Senaste veckan"
          />
          
          <MetricCard
            title="Aktivitetsgrad"
            value={`${Math.round((metrics.activeClients / metrics.totalClients) * 100) || 0}%`}
            icon={TrendingUp}
            progress={(metrics.activeClients / metrics.totalClients) * 100}
          />
        </div>
      </CardContent>
    </Card>
  );
}