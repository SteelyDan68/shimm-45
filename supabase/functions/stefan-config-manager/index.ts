import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔧 STEFAN AI CONFIGURATION MANAGER
 * Hanterar konfiguration för Stefan AI-systemet
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'GET') {
      // Hämta aktuell konfiguration
      const { data: config, error } = await supabase
        .from('stefan_ai_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore not found
        throw error;
      }

      return new Response(JSON.stringify({
        primaryModel: config?.primary_model || 'auto',
        enableAssessmentContext: config?.enable_assessment_context ?? true,
        enableRecommendations: config?.enable_recommendations ?? true,
        confidenceThreshold: config?.confidence_threshold || 0.7,
        maxTokens: config?.max_tokens || 800,
        temperature: config?.temperature || 0.7
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'POST') {
      // Uppdatera konfiguration
      let requestBody = {};
      
      try {
        const bodyText = await req.text();
        if (bodyText.trim()) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const {
        primaryModel = 'auto',
        enableAssessmentContext = true,
        enableRecommendations = true,
        confidenceThreshold = 0.7,
        maxTokens = 800,
        temperature = 0.7
      } = requestBody;

      const { data, error } = await supabase
        .from('stefan_ai_config')
        .upsert({
          primary_model: primaryModel,
          enable_assessment_context: enableAssessmentContext,
          enable_recommendations: enableRecommendations,
          confidence_threshold: confidenceThreshold,
          max_tokens: maxTokens,
          temperature: temperature,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, config: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stefan config error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});