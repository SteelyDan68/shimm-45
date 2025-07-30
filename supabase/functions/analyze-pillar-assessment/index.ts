import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PillarAssessmentData {
  pillar_type: string;
  scores: Record<string, number>;
  comments?: string;
  client_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const assessmentData: PillarAssessmentData = await req.json();
    console.log('Analyzing pillar assessment:', assessmentData);

    // Get client profile for context
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, profile_metadata')
      .eq('id', assessmentData.client_id)
      .single();

    // Create AI prompt based on pillar type
    const pillarPrompts = {
      self_care: 'Analysera klientens self care-nivå baserat på sömn, stress, motion, nutrition och work-life balance. Ge konkreta råd för förbättring.',
      skills: 'Analysera klientens färdighetsnivå inom teknik, kommunikation, ledarskap, kreativitet och inlärning. Föreslå utvecklingsområden och konkreta steg.',
      talent: 'Analysera hur väl klienten känner och utnyttjar sina naturliga talanger. Hjälp dem identifiera outnyttjad potential och sätt att stärka sina unika förmågor.',
      brand: 'Analysera klientens personliga varumärke, online-närvaro och målgruppsengagemang. Ge råd för att stärka varumärket och öka synligheten.',
      economy: 'Analysera klientens ekonomiska situation, planering och säkerhet. Ge råd för att förbättra ekonomisk stabilitet och tillväxt.'
    };

    const scoresText = Object.entries(assessmentData.scores)
      .map(([key, value]) => `${key}: ${value}/5`)
      .join(', ');

    const prompt = `Du är mentor åt en offentlig person med ett starkt personligt varumärke.

Klient: ${clientData?.name || 'Okänd'}
Bakgrund: ${JSON.stringify(clientData?.profile_metadata || {})}

${assessmentData.pillar_type.toUpperCase()} BEDÖMNING:
Poäng: ${scoresText}
${assessmentData.comments ? `Kommentarer: ${assessmentData.comments}` : ''}

${pillarPrompts[assessmentData.pillar_type as keyof typeof pillarPrompts]}

Ge en konkret handlingsplan i 2-3 steg. Håll tonen varm, konkret och professionell.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du är en erfaren mentor och coach som hjälper offentliga personer utveckla sina karriärer och personliga varumärken.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;

    console.log('AI analysis completed');

    return new Response(JSON.stringify({
      analysis,
      pillar_type: assessmentData.pillar_type,
      client_id: assessmentData.client_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-pillar-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});