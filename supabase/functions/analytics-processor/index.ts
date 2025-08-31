import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AnalyticsRequest {
  user_id: string
  metric_type: string
  metric_value: number
  metadata?: Record<string, any>
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, metric_type, metric_value, metadata }: AnalyticsRequest = await req.json()

    console.log('Analytics request:', { user_id, metric_type, metric_value })

    // Insert analytics metric
    const { data, error } = await supabase
      .from('analytics_metrics')
      .insert({
        user_id,
        metric_type,
        metric_value,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting analytics metric:', error)
      throw error
    }

    // Process real-time analytics
    await processRealtimeAnalytics(user_id, metric_type, metric_value)

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Analytics processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function processRealtimeAnalytics(userId: string, metricType: string, metricValue: number) {
  try {
    // Calculate derived metrics based on new data
    switch (metricType) {
      case 'task_completion':
        // Update completion rate
        const { data: taskMetrics } = await supabase
          .from('analytics_metrics')
          .select('metric_value')
          .eq('user_id', userId)
          .eq('metric_type', 'task_completion')
          .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (taskMetrics && taskMetrics.length > 0) {
          const averageCompletion = taskMetrics.reduce((sum, m) => sum + m.metric_value, 0) / taskMetrics.length

          await supabase
            .from('analytics_metrics')
            .insert({
              user_id: userId,
              metric_type: 'weekly_completion_rate',
              metric_value: averageCompletion,
              metadata: { period: 'week', calculated_from: 'task_completion' }
            })
        }
        break

      case 'assessment_score':
        // Update consistency tracking
        const { data: assessmentMetrics } = await supabase
          .from('analytics_metrics')
          .select('metric_value, recorded_at')
          .eq('user_id', userId)
          .eq('metric_type', 'assessment_score')
          .order('recorded_at', { ascending: false })
          .limit(5)

        if (assessmentMetrics && assessmentMetrics.length >= 2) {
          const trend = assessmentMetrics[0].metric_value - assessmentMetrics[assessmentMetrics.length - 1].metric_value
          
          await supabase
            .from('analytics_metrics')
            .insert({
              user_id: userId,
              metric_type: 'assessment_trend',
              metric_value: trend,
              metadata: { 
                period: 'recent_5',
                trend_direction: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'
              }
            })
        }
        break
    }

    console.log('Real-time analytics processed successfully for user:', userId)

  } catch (error) {
    console.error('Real-time analytics processing error:', error)
  }
}