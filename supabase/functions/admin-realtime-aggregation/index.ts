import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AdminMetricsRequest {
  time_range?: string;
  include_realtime?: boolean;
}

interface ClientOutcome {
  client_id: string;
  client_name: string;
  overall_progress: number;
  active_pillars: number;
  velocity_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  needs_attention: boolean;
  last_activity: string;
  barriers: string[];
  recent_wins: string[];
  pillar_scores: Record<string, number>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { time_range = 'week', include_realtime = true }: AdminMetricsRequest = 
      req.method === 'POST' ? await req.json() : {};

    console.log(`Aggregating admin metrics for timeframe: ${time_range}`);

    // Beräkna tidsintervall
    const now = new Date();
    let startDate: Date;
    
    switch (time_range) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 1. Hämta alla klienter med deras profiler
    const { data: clients, error: clientError } = await supabase
      .from('profiles')
      .select(`
        id, 
        first_name, 
        last_name, 
        email,
        updated_at,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'client');

    if (clientError) {
      console.error('Error fetching clients:', clientError);
      throw clientError;
    }

    console.log(`Found ${clients?.length || 0} clients`);

    // 2. Aggregera data för varje klient
    const clientOutcomes: ClientOutcome[] = [];
    
    for (const client of clients || []) {
      try {
        // Hämta pillar-aktiveringar
        const { data: activations } = await supabase
          .from('client_pillar_activations')
          .select('pillar_key, is_active, activated_at')
          .eq('user_id', client.id)
          .eq('is_active', true);

        // Hämta senaste pillar-assessments
        const { data: assessments } = await supabase
          .from('pillar_assessments')
          .select('pillar_key, calculated_score, created_at')
          .eq('user_id', client.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        // Hämta path entries för att identifiera hinder och framsteg
        const { data: pathEntries } = await supabase
          .from('path_entries')
          .select('type, title, details, timestamp, metadata')
          .eq('user_id', client.id)
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false });

        // Beräkna metrics
        const activePillars = activations?.length || 0;
        const pillarScores: Record<string, number> = {};
        
        // Senaste scores för varje pelare
        const uniquePillars = [...new Set(assessments?.map(a => a.pillar_key) || [])];
        uniquePillars.forEach(pillarKey => {
          const latestAssessment = assessments?.find(a => a.pillar_key === pillarKey);
          if (latestAssessment) {
            pillarScores[pillarKey] = latestAssessment.calculated_score || 0;
          }
        });

        // Beräkna overall progress (genomsnitt av pillar scores)
        const scores = Object.values(pillarScores);
        const overallProgress = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        // Beräkna velocity (baserat på aktivitet de senaste dagarna)
        const recentActivity = pathEntries?.filter(entry => 
          new Date(entry.timestamp) > new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        ) || [];
        
        const velocityScore = Math.min(recentActivity.length * 10, 100);

        // Identifiera engagement level
        let engagementLevel: 'high' | 'medium' | 'low' = 'low';
        if (velocityScore >= 50) engagementLevel = 'high';
        else if (velocityScore >= 20) engagementLevel = 'medium';

        // Identifiera hinder från path entries
        const barriers = pathEntries
          ?.filter(entry => entry.type === 'barrier' || entry.title?.toLowerCase().includes('hinder'))
          .map(entry => entry.title)
          .slice(0, 3) || [];

        // Identifiera recent wins
        const recentWins = pathEntries
          ?.filter(entry => 
            entry.type === 'achievement' || 
            entry.type === 'milestone' ||
            entry.title?.toLowerCase().includes('slutfört')
          )
          .map(entry => entry.title)
          .slice(0, 3) || [];

        // Avgör om klienten behöver uppmärksamhet
        const daysSinceActivity = (now.getTime() - new Date(client.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        const needsAttention = 
          daysSinceActivity > 5 || 
          engagementLevel === 'low' || 
          barriers.length > 1 ||
          overallProgress < 30;

        const outcome: ClientOutcome = {
          client_id: client.id,
          client_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
          overall_progress: overallProgress,
          active_pillars: activePillars,
          velocity_score: velocityScore,
          engagement_level: engagementLevel,
          needs_attention: needsAttention,
          last_activity: client.updated_at,
          barriers: barriers,
          recent_wins: recentWins,
          pillar_scores: pillarScores
        };

        clientOutcomes.push(outcome);

      } catch (error) {
        console.error(`Error processing client ${client.id}:`, error);
        // Fortsätt med nästa klient även om en misslyckas
      }
    }

    // 3. Beräkna sammanfattande statistik
    const totalClients = clientOutcomes.length;
    const clientsNeedingAttention = clientOutcomes.filter(c => c.needs_attention).length;
    const avgProgress = totalClients > 0 
      ? Math.round(clientOutcomes.reduce((sum, c) => sum + c.overall_progress, 0) / totalClients)
      : 0;
    const avgVelocity = totalClients > 0
      ? Math.round(clientOutcomes.reduce((sum, c) => sum + c.velocity_score, 0) / totalClients)
      : 0;
    const activePillarsTotal = clientOutcomes.reduce((sum, c) => sum + c.active_pillars, 0);
    const totalBarriers = clientOutcomes.reduce((sum, c) => sum + c.barriers.length, 0);

    // 4. Hämta systemhälsa från error_logs
    const { data: criticalErrors } = await supabase
      .from('error_logs')
      .select('id')
      .eq('severity', 'critical')
      .gte('created_at', startDate.toISOString())
      .is('resolved_at', null);

    const systemHealth = (criticalErrors?.length || 0) === 0 ? 98 : 85;

    // 5. Bygg responsobjekt
    const response = {
      success: true,
      data: {
        timeRange: time_range,
        generatedAt: now.toISOString(),
        metrics: {
          totalClients,
          clientsNeedingAttention,
          avgProgress,
          avgVelocity,
          activePillarsTotal,
          totalBarriers,
          systemHealth,
          engagementDistribution: {
            high: clientOutcomes.filter(c => c.engagement_level === 'high').length,
            medium: clientOutcomes.filter(c => c.engagement_level === 'medium').length,
            low: clientOutcomes.filter(c => c.engagement_level === 'low').length
          }
        },
        clientOutcomes: clientOutcomes.sort((a, b) => 
          (b.needs_attention ? 1 : 0) - (a.needs_attention ? 1 : 0)
        ),
        systemAlerts: [
          ...(clientsNeedingAttention > 0 ? [{
            id: 'clients_need_attention',
            type: 'warning' as const,
            title: `${clientsNeedingAttention} klienter behöver uppmärksamhet`,
            description: 'Flera klienter visar minskad aktivitet eller hinder',
            timestamp: now.toISOString(),
            resolved: false
          }] : []),
          ...(totalBarriers > 10 ? [{
            id: 'high_barrier_count',
            type: 'warning' as const,
            title: `${totalBarriers} hinder identifierade`,
            description: 'Ovanligt många hinder rapporterade av klienter',
            timestamp: now.toISOString(),
            resolved: false
          }] : [])
        ]
      }
    };

    console.log(`Successfully aggregated data for ${totalClients} clients`);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in admin-realtime-aggregation function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});