import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { buildAIPromptWithLovableTemplate } from '../_shared/client-context.ts';
import { aiService } from '../_shared/ai-service.ts';

const supabaseUrl = "https://gcoorbcglxczmukzcmqs.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey || '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentData {
  client_id: string;
  client_name: string;
  assessment_scores: Record<string, number>;
  comments?: string;
  functional_access?: Record<string, string>;
  subjective_opportunities?: Record<string, number>;
  relationships?: Record<string, { answer: string; comment: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const assessmentData: AssessmentData = await req.json();
    
    console.log('Assessment analysis request received');

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

    // Format assessment data with clearer structure
    const hinderText = Object.entries(assessmentData.assessment_scores)
      .map(([area, score]) => `${area}: ${score}/10`)
      .join('\n');

    // Format opportunities and resources
    let resurserText = '';
    
    if (assessmentData.functional_access) {
      resurserText += `Funktionstillgång:\n${Object.entries(assessmentData.functional_access)
        .map(([question, answer]) => `- ${question}: ${answer}`)
        .join('\n')}\n\n`;
    }
    
    if (assessmentData.subjective_opportunities) {
      resurserText += `Subjektiva möjligheter (1-5 där 5 = lätt/ofta):\n${Object.entries(assessmentData.subjective_opportunities)
        .map(([question, score]) => `- ${question}: ${score}/5`)
        .join('\n')}\n\n`;
    }
    
    if (assessmentData.relationships) {
      resurserText += `Relationer:\n${Object.entries(assessmentData.relationships)
        .map(([question, data]) => `- ${question}: ${data.answer}${data.comment ? ` (${data.comment})` : ''}`)
        .join('\n')}\n\n`;
    }

    // Get profile metadata from the database
    const { data: clientData } = await supabase
      .from('clients')
      .select('profile_metadata')
      .eq('id', assessmentData.client_id)
      .single();

    const profileMetadata = clientData?.profile_metadata || {};

    // Skapa AI-analys med fallback-system
    const systemPrompt = `Du är mentor åt en offentlig person med ett starkt personligt varumärke. Personen har gjort en självskattning som visar både hinder och möjligheter.

Din uppgift är att:
1. Reflektera över deras nuläge – vad är mest utmanande just nu?
2. Identifiera vilka möjligheter som kan användas som hävstång
3. Skapa en handlingsplan i 2–3 steg utifrån både hinder och tillgångar
4. Håll tonen varm, konkret och professionell – och anpassad till deras roll och nisch`;

    const userPrompt = `Här är deras bakgrund:
${JSON.stringify(profileMetadata, null, 2)}

Här är personens upplevda hinder (1-10 där 10 = stort hinder):
${hinderText}

Här är personens möjligheter och resurser:
${resurserText}

${assessmentData.comments ? `Ytterligare kommentarer från personen: ${assessmentData.comments}` : ''}

Ge en personlig analys enligt instruktionerna ovan.`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 800,
      temperature: 0.7,
      model: 'gpt-4.1-2025-04-14'
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
    const analysis = aiResponse.content;

    return new Response(
      JSON.stringify({ 
        analysis,
        assessment_scores: assessmentData.assessment_scores,
        comments: assessmentData.comments,
        ai_model_used: aiResponse.model
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-assessment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});