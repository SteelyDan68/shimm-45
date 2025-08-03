import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsAggregationResult {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisWeek: number;
    usersNeedingAttention: number;
  };
  coachMetrics: {
    totalCoaches: number;
    averageClientLoad: number;
    topPerformingCoach: string;
  };
  assessmentMetrics: {
    pendingAssessments: number;
    completedAssessmentsThisWeek: number;
    assessmentCompletionRate: number;
  };
  taskMetrics: {
    pendingTasks: number;
    overdueTasks: number;
    completedTasksThisWeek: number;
    upcomingEvents: number;
  };
  systemHealth: {
    healthScore: number;
    databasePerformance: number;
    issues: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔥 Unified Metrics Aggregator: Starting aggregation...');

    // Define time boundaries
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Parallel execution of all metrics queries for maximum performance
    const [
      // User metrics
      totalUsersResult,
      activeUsersResult, 
      newUsersResult,
      
      // Coach metrics
      coachesResult,
      assignmentsResult,
      
      // Assessment metrics
      pendingAssessmentsResult,
      completedAssessmentsResult,
      
      // Task metrics
      pendingTasksResult,
      overdueTasksResult,
      completedTasksResult,
      upcomingEventsResult,
      
      // AI metrics
      aiRecommendationsResult,
      coachingSessionsResult
    ] = await Promise.all([
      // User counts
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_journey_tracking')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity_at', weekAgo.toISOString()),
      supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      
      // Coach data
      supabase.from('user_roles').select('user_id').eq('role', 'coach'),
      supabase.from('coach_client_assignments').select('coach_id').eq('is_active', true),
      
      // Assessments
      supabase.from('assessment_states')
        .select('*', { count: 'exact', head: true })
        .eq('is_draft', true),
      supabase.from('assessment_rounds')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      
      // Tasks
      supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed'),
      supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed')
        .lt('deadline', now.toISOString()),
      supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', weekAgo.toISOString()),
      supabase.from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', now.toISOString())
        .lte('event_date', nextWeek.toISOString()),
      
      // AI data
      supabase.from('ai_coaching_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('coaching_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
    ]);

    // Process coach assignments for load calculation
    const coaches = coachesResult.data || [];
    const assignments = assignmentsResult.data || [];
    
    const clientCounts: Record<string, number> = {};
    assignments.forEach(assignment => {
      clientCounts[assignment.coach_id] = (clientCounts[assignment.coach_id] || 0) + 1;
    });
    
    const averageClientLoad = Object.keys(clientCounts).length > 0 
      ? Object.values(clientCounts).reduce((a, b) => a + b, 0) / Object.keys(clientCounts).length 
      : 0;

    // Find top performing coach
    let topPerformingCoach = '';
    if (Object.keys(clientCounts).length > 0) {
      const topCoachId = Object.keys(clientCounts).reduce((a, b) => 
        clientCounts[a] > clientCounts[b] ? a : b
      );
      
      const { data: topCoachProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', topCoachId)
        .single();
      
      topPerformingCoach = topCoachProfile 
        ? `${topCoachProfile.first_name} ${topCoachProfile.last_name}` 
        : 'Okänd';
    }

    // Calculate system health
    const totalUsers = totalUsersResult.count || 0;
    const activeUsers = activeUsersResult.count || 0;
    const overdueTasksCount = overdueTasksResult.count || 0;
    const pendingAssessmentsCount = pendingAssessmentsResult.count || 0;
    
    let healthScore = 100;
    const issues: string[] = [];
    
    if (overdueTasksCount > 5) {
      healthScore -= 10;
      issues.push(`${overdueTasksCount} försenade uppgifter`);
    }
    if (pendingAssessmentsCount > 10) {
      healthScore -= 5;
      issues.push(`${pendingAssessmentsCount} väntande bedömningar`);
    }
    if (activeUsers < totalUsers * 0.3) {
      healthScore -= 15;
      issues.push('Låg användaraktivitet');
    }
    if (averageClientLoad > 8) {
      healthScore -= 5;
      issues.push('Överbelastade coaches');
    }
    
    const finalHealthScore = Math.max(75, healthScore);

    // Calculate users needing attention (simplified)
    const usersNeedingAttention = Math.floor(totalUsers * 0.1) + overdueTasksCount;

    // Assemble final result
    const result: MetricsAggregationResult = {
      userMetrics: {
        totalUsers,
        activeUsers: activeUsersResult.count || 0,
        newUsersThisWeek: newUsersResult.count || 0,
        usersNeedingAttention
      },
      coachMetrics: {
        totalCoaches: coaches.length,
        averageClientLoad,
        topPerformingCoach
      },
      assessmentMetrics: {
        pendingAssessments: pendingAssessmentsCount,
        completedAssessmentsThisWeek: completedAssessmentsResult.count || 0,
        assessmentCompletionRate: pendingAssessmentsCount > 0 
          ? ((completedAssessmentsResult.count || 0) / pendingAssessmentsCount) * 100 
          : 0
      },
      taskMetrics: {
        pendingTasks: pendingTasksResult.count || 0,
        overdueTasks: overdueTasksCount,
        completedTasksThisWeek: completedTasksResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0
      },
      systemHealth: {
        healthScore: finalHealthScore,
        databasePerformance: 95, // TODO: Calculate from actual DB metrics
        issues
      }
    };

    console.log('✅ Unified Metrics Aggregation completed successfully');
    console.log('📊 Aggregated metrics:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in unified-metrics-aggregator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to aggregate system metrics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});