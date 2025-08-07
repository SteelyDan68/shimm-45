import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentAnalysisRequest {
  template_id: string;
  client_id: string;
  answers: Record<string, any>;
  calculated_scores: {
    overall: number;
    pillar_scores: Record<string, number>;
  };
  context: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template_id, client_id, answers, calculated_scores, context } = await req.json() as AssessmentAnalysisRequest;

    console.log('Processing universal assessment analysis for client:', client_id);

    // Get client profile for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('name, profile_metadata')
      .eq('id', client_id)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
    }

    // Create contextual analysis prompt
    const systemPrompt = `Du är en expert AI-coach som analyserar utvecklingsbedömningar enligt fempelarmodellen: Self Care, Skills, Talent, Brand och Economy.

Din uppgift är att ge en djup, personlig analys som hjälper användaren förstå sin nuvarande situation och skapa en tydlig utvecklingsväg framåt.

Fempelarmodellen är universell - den gäller lika mycket för en influencer som en undersköterska, rörmokare eller VD. Alla människor behöver:
- Self Care: Fysisk/mental hälsa, återhämtning, balans
- Skills: Tekniska färdigheter, kompetensutveckling 
- Talent: Naturliga gåvor, kreativitet, unika styrkor
- Brand: Hur man uppfattas, kommunicerar, signalerar värde
- Economy: Ekonomisk stabilitet, värdeskapande, försörjning

Analysera med neuroplasticitetsprincipen - hjärnan förändras genom upprepning och medveten övning.`;

    const analysisPrompt = `Analysera denna ${context}-bedömning för ${clientData?.name || 'användaren'}:

SVAR PÅ BEDÖMNING:
${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n')}

BERÄKNADE POÄNG:
${Object.entries(calculated_scores.pillar_scores).map(([pillar, score]) => `${pillar}: ${score.toFixed(1)}/10`).join('\n')}

${clientData?.profile_metadata ? `ANVÄNDARKONTEXT:
${JSON.stringify(clientData.profile_metadata, null, 2)}` : ''}

Ge en djup analys som inkluderar:

1. STYRKOR (2-3 specifika områden där personen redan ligger bra till)
2. UTVECKLINGSOMRÅDEN (2-3 kritiska områden som behöver fokus)
3. FÖRSTA STEG (konkreta, genomförbara åtgärder för kommande veckan)
4. PRIORITERAD PELARE (vilken av de fem pelarna som är mest kritisk att fokusera på först)

Anpassa råden till personens specifika livssituation. En undersköterska som vill bli sjuksköterska behöver andra råd än en influencer som vill växa sitt företag.

Var empatisk, motiverande och specifik. Undvik generiska råd. Svara på svenska.`;

    // Get AI analysis
    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: analysisPrompt }
    ], {
      maxTokens: 1500,
      temperature: 0.7
    });

    if (!aiResponse.success) {
      throw new Error('AI analysis failed: ' + aiResponse.error);
    }

    // Parse the analysis to extract structured insights
    const analysisText = aiResponse.content;
    
    // Simple parsing - in production this would be more sophisticated
    const insights = {
      strengths: extractSection(analysisText, 'STYRKOR'),
      improvement_areas: extractSection(analysisText, 'UTVECKLINGSOMRÅDEN'),
      recommended_actions: extractSection(analysisText, 'FÖRSTA STEG'),
      pillar_priorities: extractSection(analysisText, 'PRIORITERAD PELARE')
    };

    // 🎯 CRITICAL FIX: Save to assessment_rounds for proper data flow
    const { data: assessmentRound, error: assessmentRoundError } = await supabase
      .from('assessment_rounds')
      .insert({
        user_id: client_id,
        created_by: client_id,
        pillar_type: context.toLowerCase().replace(/\s+/g, '_'),
        answers: answers,
        scores: calculated_scores,
        comments: '',
        ai_analysis: analysisText
      })
      .select()
      .single();

    if (assessmentRoundError) {
      console.error('Failed to save assessment round:', assessmentRoundError);
      throw assessmentRoundError;
    }

    console.log('✅ Assessment round saved with AI analysis:', assessmentRound.id);

    // Also create path entry for legacy compatibility
    const pathEntryData = {
      user_id: client_id, // FIXED: use user_id instead of client_id
      type: 'assessment',
      title: `Självskattning genomförd - ${new Date().toLocaleDateString('sv-SE')}`,
      details: `Övergripande poäng: ${calculated_scores.overall.toFixed(1)}/10`,
      content: analysisText,
      status: 'completed',
      ai_generated: true,
      created_by: client_id,
      visible_to_client: true,
      metadata: {
        assessment_type: context,
        pillar_scores: calculated_scores.pillar_scores,
        template_id,
        assessment_round_id: assessmentRound.id
      }
    };

    await supabase
      .from('path_entries')
      .insert(pathEntryData);

    console.log('Universal assessment analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisText,
      insights,
      scores: calculated_scores,
      model_used: aiResponse.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in universal-assessment-analyzer:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractSection(text: string, sectionName: string): string[] {
  const lines = text.split('\n');
  const startIndex = lines.findIndex(line => 
    line.toUpperCase().includes(sectionName.toUpperCase())
  );
  
  if (startIndex === -1) return [];
  
  const section = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.match(/^\d+\./)) continue;
    if (line.toUpperCase().includes('UTVECKLINGSOMRÅDEN') || 
        line.toUpperCase().includes('FÖRSTA STEG') || 
        line.toUpperCase().includes('PRIORITERAD PELARE')) break;
    if (line.length > 10) section.push(line);
    if (section.length >= 3) break;
  }
  
  return section;
}