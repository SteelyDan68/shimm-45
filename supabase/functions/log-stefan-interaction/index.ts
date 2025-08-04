import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 📊 STEFAN INTERACTION LOGGER
 * Loggar Stefan AI-interaktioner för analytics
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { response, options, timestamp } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Logga AI-användning
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: response.userId || null,
        model_used: response.aiModel || 'unknown',
        interaction_type: options.interactionType || 'chat',
        fallback_used: response.fallbackUsed || false,
        response_time_ms: response.responseTime || 0,
        confidence_score: response.confidence || 0,
        context_used: {
          assessmentContext: options.includeAssessmentContext || false,
          recommendations: options.generateRecommendations || false,
          contextualMemories: !!response.contextUsed?.contextualMemories
        },
        timestamp: timestamp || new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log interaction:', error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Interaction logging error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});