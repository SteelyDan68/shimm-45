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

    // UNIVERSELL SPARNING: Spara i båda assessment_rounds och path_entries för kompatibilitet
    try {
      // 1. Spara i assessment_rounds (primär källa)
      const { data: assessmentRound, error: roundError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: userData.user_id,
          created_by: userData.user_id,
          pillar_type: assessmentData.pillar_type,
          answers: {
            ...assessmentData.scores,
            analysis_metadata: {
              ai_generated: true,
              model_used: aiResponse.model,
              generated_at: new Date().toISOString()
            }
          },
          scores: {
            [assessmentData.pillar_type]: Object.values(assessmentData.scores).reduce((a, b) => a + b, 0) / Object.values(assessmentData.scores).length,
            overall: Object.values(assessmentData.scores).reduce((a, b) => a + b, 0) / Object.values(assessmentData.scores).length,
            ...assessmentData.scores
          },
          comments: assessmentData.comments || 'AI-genererad analys via analyze-pillar-assessment',
          ai_analysis: aiResponse.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (roundError) {
        console.error('Error saving to assessment_rounds:', roundError);
      } else {
        console.log(`✅ Saved to assessment_rounds with ID: ${assessmentRound.id}`);
      }

      // 2. Spara i path_entries för backward compatibility
      const { error: entryError } = await supabase
        .from('path_entries')
        .insert({
          user_id: userData.user_id,
          created_by: userData.user_id,
          timestamp: new Date().toISOString(),
          type: 'recommendation',
          title: `AI-analys: ${getPillarDisplayName(assessmentData.pillar_type)}`,
          details: aiResponse.content,
          status: 'completed',
          ai_generated: true,
          visible_to_client: true,
          metadata: {
            pillar_type: assessmentData.pillar_type,
            assessment_score: Object.values(assessmentData.scores).reduce((a, b) => a + b, 0) / Object.values(assessmentData.scores).length,
            assessment_data: assessmentData.scores,
            assessment_round_id: assessmentRound?.id,
            ai_model_used: aiResponse.model,
            universal_service: true,
            created_via: 'analyze-pillar-assessment'
          }
        });

      if (entryError) {
        console.warn('Warning: Failed to save to path_entries (non-critical):', entryError);
      } else {
        console.log('✅ Saved to path_entries for compatibility');
      }

    } catch (saveError) {
      console.error('Error saving analysis results:', saveError);
      // Fortsätt även om sparning misslyckas - returnera fortfarande analysen
    }

    // Hjälpfunktion för pillar-namn
    function getPillarDisplayName(pillarType: string): string {
      const displayNames: Record<string, string> = {
        'talent': 'Talang',
        'skills': 'Kompetenser', 
        'brand': 'Varumärke',
        'economy': 'Ekonomi',
        'self_care': 'Självomvårdnad',
        'open_track': 'Öppna spåret'
      };
      return displayNames[pillarType] || pillarType;
    }

    // Generate actionables for open_track pillar
    if (assessmentData.pillar_type === 'open_track') {
      try {
        const { data: actionablesData, error: actionablesError } = await supabase.functions.invoke('generate-open-track-actionables', {
          body: {
            assessment_data: assessmentData,
            ai_analysis: aiResponse.content,
            user_id: userData.user_id
          }
        });
        
        if (!actionablesError && actionablesData) {
          console.log('✅ Open track actionables generated successfully');
        }
      } catch (actionableError) {
        console.warn('⚠️ Failed to generate open track actionables:', actionableError);
      }
    }

    return new Response(JSON.stringify({
      analysis: aiResponse.content,
      pillar_type: assessmentData.pillar_type,
      user_id: userData.user_id,
      client_id: userData.client_id, // Include both for compatibility
      ai_model_used: aiResponse.model,
      saved_to_assessment_rounds: true,
      saved_to_path_entries: true
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