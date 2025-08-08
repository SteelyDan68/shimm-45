import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('🎯 Admin Live Insights - Starting analysis...');

    // Get pillar performance from assessment_rounds
    const { data: pillarPerformance, error: pillarError } = await supabaseClient
      .from('assessment_rounds')
      .select('pillar_type, scores, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (pillarError) {
      console.error('Error fetching pillar performance:', pillarError);
      throw pillarError;
    }

    // Get active clients and their path entries
    const { data: activeClients, error: clientsError } = await supabaseClient
      .from('profiles')
      .select(`
        id, 
        email, 
        full_name,
        updated_at,
        user_roles(role)
      `)
      .eq('is_active', true);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    // Filter only clients
    const clients = activeClients?.filter(user => 
      user.user_roles?.some((ur: any) => ur.role === 'client')
    ) || [];

    // Get recent path entries for activity analysis
    const { data: recentActivity, error: activityError } = await supabaseClient
      .from('path_entries')
      .select('user_id, type, created_at, metadata')
      .gte('created_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('Error fetching activity:', activityError);
      throw activityError;
    }

    // Get Stefan AI recommendations
    const { data: stefanRecs, error: recsError } = await supabaseClient
      .from('ai_coaching_recommendations')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (recsError) {
      console.error('Error fetching Stefan recommendations:', recsError);
      throw recsError;
    }

    // Analyze pillar performance
    const pillarStats: Record<string, { avgScore: number, totalAssessments: number, completionRate: number }> = {};
    
    pillarPerformance?.forEach(assessment => {
      const pillar = assessment.pillar_type;
      const overallScore = assessment.scores?.overall || 0;
      
      if (!pillarStats[pillar]) {
        pillarStats[pillar] = { avgScore: 0, totalAssessments: 0, completionRate: 0 };
      }
      
      pillarStats[pillar].totalAssessments++;
      pillarStats[pillar].avgScore += overallScore;
    });

    // Calculate averages and completion rates
    Object.keys(pillarStats).forEach(pillar => {
      const stats = pillarStats[pillar];
      stats.avgScore = stats.avgScore / stats.totalAssessments;
      stats.completionRate = (stats.totalAssessments / clients.length) * 100;
    });

    // Find inactive clients (no activity in last 5 days)
    const activeUserIds = new Set(recentActivity?.map(entry => entry.user_id) || []);
    const inactiveClients = clients.filter(client => !activeUserIds.has(client.id));

    // Find best and worst performing pillars
    const sortedPillars = Object.entries(pillarStats)
      .sort(([,a], [,b]) => b.completionRate - a.completionRate);
    
    const bestPillar = sortedPillars[0];
    const worstPillar = sortedPillars[sortedPillars.length - 1];

    // Analyze Stefan recommendations trends
    const stefanInsights = {
      totalRecommendations: stefanRecs?.length || 0,
      pendingRecommendations: stefanRecs?.filter(r => r.status === 'pending').length || 0,
      completedRecommendations: stefanRecs?.filter(r => r.status === 'completed').length || 0,
      criticalRecommendations: stefanRecs?.filter(r => r.priority === 'critical').length || 0
    };

    // Generate AI insights based on real data
    const insights = [
      {
        id: 'inactive-clients',
        type: 'warning' as const,
        title: 'Coach-intervention behövs',
        description: `${inactiveClients.length} klienter visar minskad aktivitet de senaste 5 dagarna. Föreslår proaktiv kontakt från deras coaches.`,
        actionText: 'Skicka notifikation till coaches',
        priority: 'high',
        metadata: {
          inactiveClientIds: inactiveClients.map(c => c.id),
          count: inactiveClients.length
        }
      }
    ];

    // Add best pillar insight if available
    if (bestPillar) {
      insights.push({
        id: 'best-pillar',
        type: 'success' as const,
        title: `Framgång: ${bestPillar[0]} pillar presterar bäst`,
        description: `${Math.round(bestPillar[1].completionRate)}% completion rate för ${bestPillar[0]} assessments. Föreslår att använda denna modell för andra pelare.`,
        actionText: '',
        priority: 'medium',
        metadata: {
          pillar: bestPillar[0],
          completionRate: bestPillar[1].completionRate,
          avgScore: bestPillar[1].avgScore
        }
      });
    }

    // Add worst pillar insight if available
    if (worstPillar && worstPillar[1].completionRate < 50) {
      insights.push({
        id: 'worst-pillar',
        type: 'warning' as const,
        title: `Varning: ${worstPillar[0]} pillar behöver uppmärksamhet`,
        description: `Lägst engagement (${Math.round(worstPillar[1].completionRate)}%) och låg genomsnittscore (${worstPillar[1].avgScore.toFixed(1)}). Föreslår innehållsöversyn och förenklad struktur.`,
        actionText: `Granska ${worstPillar[0]}-innehåll`,
        priority: 'high',
        metadata: {
          pillar: worstPillar[0],
          completionRate: worstPillar[1].completionRate,
          avgScore: worstPillar[1].avgScore
        }
      });
    }

    // Add Stefan recommendations insight
    if (stefanInsights.pendingRecommendations > 0) {
      insights.push({
        id: 'stefan-recommendations',
        type: 'info' as const,
        title: 'Stefan AI rekommendationer väntar',
        description: `${stefanInsights.pendingRecommendations} nya AI-rekommendationer behöver granskas. ${stefanInsights.criticalRecommendations} markerade som kritiska.`,
        actionText: 'Granska AI-rekommendationer',
        priority: stefanInsights.criticalRecommendations > 0 ? 'high' : 'medium',
        metadata: stefanInsights
      });
    }

    // Calculate priority actions
    const priorityActions = [
      {
        id: 'contact-inactive',
        title: 'Kontakta inaktiva klienter',
        description: `${inactiveClients.length} klienter behöver uppföljning`,
        urgency: 'high',
        count: inactiveClients.length,
        type: 'client-outreach'
      },
      {
        id: 'review-recommendations',
        title: 'Granska AI-rekommendationer',
        description: `${stefanInsights.pendingRecommendations} väntande rekommendationer`,
        urgency: stefanInsights.criticalRecommendations > 0 ? 'high' : 'medium',
        count: stefanInsights.pendingRecommendations,
        type: 'stefan-review'
      },
      {
        id: 'pillar-analysis',
        title: 'Pillar-prestanda analys',
        description: 'Optimera underpresterande utvecklingsområden',
        urgency: worstPillar && worstPillar[1].completionRate < 40 ? 'high' : 'medium',
        count: Object.keys(pillarStats).length,
        type: 'pillar-optimization'
      }
    ].filter(action => action.count > 0);

    const result = {
      success: true,
      data: {
        insights,
        priorityActions,
        pillarStats,
        stefanInsights,
        clientsData: {
          total: clients.length,
          inactive: inactiveClients.length,
          active: clients.length - inactiveClients.length
        },
        generatedAt: new Date().toISOString()
      }
    };

    console.log('✅ Admin Live Insights generated successfully');
    console.log(`📊 Generated ${insights.length} insights and ${priorityActions.length} priority actions`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in admin-live-insights function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Check function logs for more information' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});