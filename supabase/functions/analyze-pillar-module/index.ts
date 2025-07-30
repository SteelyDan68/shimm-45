import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PillarModuleAnalysisData {
  assessment_id: string;
  pillar_key: string;
  assessment_data: Record<string, any>;
  calculated_score: number;
  client_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Pillar module analysis request received');

    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      return new Response(JSON.stringify({
        error: 'Inga AI-tjänster tillgängliga'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`AI Services available - OpenAI: ${availability.openai}, Gemini: ${availability.gemini}, Primary: ${availability.primary}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: PillarModuleAnalysisData = await req.json();
    console.log('Analyzing pillar module:', data.pillar_key);

    // Get pillar definition with AI prompt template
    const { data: pillarDefinition } = await supabase
      .from('pillar_definitions')
      .select('*')
      .eq('pillar_key', data.pillar_key)
      .single();

    if (!pillarDefinition) {
      throw new Error('Pillar definition not found');
    }

    // Get client profile for context
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, profile_metadata')
      .eq('id', data.client_id)
      .single();

    // Format assessment data for AI prompt
    const formattedData = Object.entries(data.assessment_data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Use the pillar-specific AI prompt template
    const prompt = pillarDefinition.ai_prompt_template.replace('{assessment_data}', formattedData);

    const systemPrompt = `Du är en erfaren mentor och coach som hjälper offentliga personer utveckla sina karriärer och personliga varumärken. Du specialiserar dig på ${pillarDefinition.name}-området.`;

    const userPrompt = `Du är mentor åt en offentlig person med ett starkt personligt varumärke.

Klient: ${clientData?.name || 'Okänd'}
Bakgrund: ${JSON.stringify(clientData?.profile_metadata || {})}

PELARE: ${pillarDefinition.name} (${data.pillar_key})
BERÄKNAD POÄNG: ${data.calculated_score}/10

ASSESSMENT DATA:
${formattedData}

${prompt}

Ge en konkret handlingsplan i 2-3 steg. Håll tonen varm, konkret och professionell.

Avsluta med en sammanfattning av de viktigaste områdena för förbättring inom denna pelare.`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 1000,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      console.error('AI analysis failed:', aiResponse.error);
      return new Response(JSON.stringify({
        error: 'AI-analys misslyckades: ' + aiResponse.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`AI analysis completed using ${aiResponse.model.toUpperCase()}`);

    // Generate structured insights for visualizations
    const insights = {
      strengths: [], // TODO: Extract from AI analysis
      weaknesses: [], // TODO: Extract from AI analysis
      priority_actions: [], // TODO: Extract from AI analysis
      score_breakdown: data.assessment_data,
      improvement_potential: Math.max(0, 10 - data.calculated_score)
    };

    console.log(`AI analysis completed for ${data.pillar_key} pillar`);

    return new Response(JSON.stringify({
      analysis: aiResponse.content,
      insights,
      pillar_key: data.pillar_key,
      pillar_name: pillarDefinition.name,
      calculated_score: data.calculated_score,
      client_id: data.client_id,
      ai_model_used: aiResponse.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-pillar-module function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});