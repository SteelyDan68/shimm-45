import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';
import { resolveUserClient } from '../_shared/user-client-resolver.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PillarAssessmentData {
  pillar_type: string;
  scores: Record<string, number>;
  comments?: string;
  client_id?: string; // Backward compatibility
  user_id?: string;   // New user-centric approach
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Pillar assessment analysis request received');

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

    const assessmentData: PillarAssessmentData = await req.json();
    console.log('Analyzing pillar assessment:', assessmentData);

    // Validate input - require either user_id or client_id
    if (!assessmentData.user_id && !assessmentData.client_id) {
      return new Response(JSON.stringify({
        error: 'Either user_id or client_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve user/client data using universal resolver
    const userData = await resolveUserClient({
      user_id: assessmentData.user_id,
      client_id: assessmentData.client_id
    }, supabase);

    if (!userData) {
      return new Response(JSON.stringify({
        error: 'User/client not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const systemPrompt = 'Du är en erfaren mentor och coach som hjälper offentliga personer utveckla sina karriärer och personliga varumärken.';

    const userPrompt = `Du är mentor åt en offentlig person med ett starkt personligt varumärke.

Klient: ${userData.name}
Bakgrund: ${JSON.stringify(userData.profile_metadata || {})}

${assessmentData.pillar_type.toUpperCase()} BEDÖMNING:
Poäng: ${scoresText}
${assessmentData.comments ? `Kommentarer: ${assessmentData.comments}` : ''}

${pillarPrompts[assessmentData.pillar_type as keyof typeof pillarPrompts]}

Ge en konkret handlingsplan i 2-3 steg. Håll tonen varm, konkret och professionell.`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 800,
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

    return new Response(JSON.stringify({
      analysis: aiResponse.content,
      pillar_type: assessmentData.pillar_type,
      user_id: userData.user_id,
      client_id: userData.client_id, // Include both for compatibility
      ai_model_used: aiResponse.model
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