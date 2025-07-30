import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OverallAssessmentRequest {
  client_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      throw new Error('Inga AI-tjänster tillgängliga');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { client_id }: OverallAssessmentRequest = await req.json();

    if (!client_id) {
      throw new Error('client_id is required');
    }

    console.log('Generating overall assessment for client:', client_id);

    // Get client profile metadata
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, profile_metadata')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      throw new Error(`Failed to fetch client: ${clientError?.message}`);
    }

    // Get latest assessments for each pillar
    const { data: assessments, error: assessmentsError } = await supabase
      .from('pillar_assessments')
      .select('pillar_key, assessment_data, calculated_score, ai_analysis, created_at')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false });

    if (assessmentsError) {
      throw new Error(`Failed to fetch assessments: ${assessmentsError.message}`);
    }

    // Group by pillar and get latest for each
    const latestAssessments: Record<string, any> = {};
    const pillars = ['self_care', 'skills', 'talent', 'brand', 'economy'];
    
    assessments?.forEach(assessment => {
      if (pillars.includes(assessment.pillar_key) && !latestAssessments[assessment.pillar_key]) {
        latestAssessments[assessment.pillar_key] = assessment;
      }
    });

    // Check if we have at least 3 pillars with assessments
    const assessedPillars = Object.keys(latestAssessments);
    if (assessedPillars.length < 3) {
      throw new Error(`Insufficient assessments. Need at least 3 pillars, got ${assessedPillars.length}`);
    }

    console.log(`Found assessments for ${assessedPillars.length} pillars:`, assessedPillars);

    // Format assessment summaries
    const formatPillarSummary = (pillarKey: string) => {
      const assessment = latestAssessments[pillarKey];
      if (!assessment) return 'Ingen bedömning gjord än.';
      
      return `Poäng: ${assessment.calculated_score?.toFixed(1) || 'N/A'}/10
Analys: ${assessment.ai_analysis || 'Ingen analys tillgänglig'}
Datum: ${new Date(assessment.created_at).toLocaleDateString('sv-SE')}`;
    };

    // Build the AI prompt
    const prompt = `Du är mentor åt en offentlig person. Klienten har nyligen gjort en självskattning inom flera områden som tillsammans formar deras förutsättningar att växa.

Här är deras profil:
${JSON.stringify(client.profile_metadata || {}, null, 2)}

Här är deras bedömningar:

SELF CARE:
${formatPillarSummary('self_care')}

SKILLS:
${formatPillarSummary('skills')}

TALENT:
${formatPillarSummary('talent')}

BRAND:
${formatPillarSummary('brand')}

ECONOMY:
${formatPillarSummary('economy')}

Din uppgift:
1. Reflektera över helheten – hur hänger de olika pelarna ihop?
2. Identifiera 1–2 mönster eller sammanhang där ett område påverkar ett annat (ex: låg self care påverkar skills).
3. Ge en kort övergripande rekommendation:
   - Vad bör prioriteras just nu?
   - Vad verkar mest moget att bygga på?
   - Vad bör coach och klient fokusera på kommande 2 veckor?

Håll tonen varm, insiktsfull och framåtblickande.`;

    console.log('Sending prompt to AI service...');

    // Call AI service with fallback
    const systemPrompt = 'Du är en erfaren mentor och coach för offentliga personer. Du ger insiktsfulla, varm och konstruktiva analyser baserat på självskattningar.';

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], {
      maxTokens: 1000,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      throw new Error('AI-analys misslyckades: ' + aiResponse.error);
    }

    const analysis = aiResponse.content;

    console.log('Generated overall assessment successfully');

    return new Response(JSON.stringify({ 
      analysis,
      assessed_pillars: assessedPillars,
      client_name: client.name,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-overall-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});