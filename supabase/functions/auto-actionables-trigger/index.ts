import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, assessment_id, pillar_type, ai_analysis } = await req.json();

    if (!user_id || !assessment_id || !ai_analysis) {
      throw new Error('Missing required fields: user_id, assessment_id, ai_analysis');
    }

    console.log('🎯 Auto-triggering actionables for assessment:', assessment_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default coaching preferences if none exist
    const defaultPreferences = {
      intensity: 'moderate' as const,
      duration: 3, // 3 weeks
      frequency: 'few-times-week' as const
    };

    // Call enhanced-ai-planning to create actionables
    const { data: planningResult, error: planningError } = await supabase.functions.invoke(
      'enhanced-ai-planning',
      {
        body: {
          user_id: user_id,
          preferences: defaultPreferences,
          assessment_data: {
            pillar_type: pillar_type,
            ai_analysis: ai_analysis,
            assessment_id: assessment_id
          },
          context_data: {
            triggered_by: 'assessment_completion',
            auto_generated: true
          }
        }
      }
    );

    if (planningError) {
      console.error('Error calling enhanced-ai-planning:', planningError);
      throw new Error('Failed to generate actionables: ' + planningError.message);
    }

    console.log('✅ Auto-generated actionables:', planningResult);

    // Create path entry to track this auto-generation
    await supabase.from('path_entries').insert({
      user_id: user_id,
      created_by: user_id,
      type: 'auto_actionables',
      title: `Automatiska actionables från ${pillar_type} analys`,
      details: `Systemet genererade automatiskt ${planningResult?.plan?.tasks_generated || 0} uppgifter baserat på AI-analysen.`,
      ai_generated: true,
      created_by_role: 'ai_system',
      visible_to_client: true,
      metadata: {
        assessment_id: assessment_id,
        pillar_type: pillar_type,
        triggered_by: 'assessment_completion',
        actionables_generated: planningResult?.plan?.tasks_generated || 0,
        events_generated: planningResult?.plan?.events_created || 0
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Actionables auto-generated successfully',
      actionables_created: planningResult?.plan?.tasks_generated || 0,
      events_created: planningResult?.plan?.events_created || 0,
      planning_result: planningResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in auto-actionables-trigger:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});