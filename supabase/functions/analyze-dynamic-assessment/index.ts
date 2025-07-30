import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DynamicAssessmentData {
  assessment_round_id: string;
  form_definition_id: string;
  answers: Record<string, any>;
  comments?: string;
  client_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Dynamic assessment analysis request received');

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

    const assessmentData: DynamicAssessmentData = await req.json();
    console.log('Analyzing dynamic assessment:', assessmentData);

    // Get form definition and questions
    const { data: formData } = await supabase
      .from('assessment_form_definitions')
      .select(`
        *,
        assessment_questions (*)
      `)
      .eq('id', assessmentData.form_definition_id)
      .single();

    if (!formData) {
      throw new Error('Form definition not found');
    }

    // Get client profile for context
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, profile_metadata')
      .eq('id', assessmentData.client_id)
      .single();

    // Format answers with question context
    const formattedAnswers = Object.entries(assessmentData.answers).map(([key, value]) => {
      const question = formData.assessment_questions.find((q: any) => q.question_key === key);
      if (question) {
        if (question.question_type === 'scale') {
          return `${question.question_text}: ${value}/${question.max_value}`;
        } else {
          return `${question.question_text}: ${value}`;
        }
      }
      return `${key}: ${value}`;
    }).join('\n');

    // Use the custom AI prompt template from the form definition
    const prompt = formData.ai_prompt_template.replace('{answers}', formattedAnswers);

    const systemPrompt = 'Du är en erfaren mentor och coach som hjälper offentliga personer utveckla sina karriärer och personliga varumärken.';

    const userPrompt = `Du är mentor åt en offentlig person med ett starkt personligt varumärke.

Klient: ${clientData?.name || 'Okänd'}
Bakgrund: ${JSON.stringify(clientData?.profile_metadata || {})}

ASSESSMENT: ${formData.name}
${formData.description ? `Beskrivning: ${formData.description}` : ''}

SVAR:
${formattedAnswers}

${assessmentData.comments ? `Kommentarer: ${assessmentData.comments}` : ''}

${prompt}

Ge en konkret handlingsplan i 2-3 steg. Håll tonen varm, konkret och professionell.`;

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

    return new Response(JSON.stringify({
      analysis: aiResponse.content,
      form_name: formData.name,
      assessment_type: formData.assessment_type,
      client_id: assessmentData.client_id,
      ai_model_used: aiResponse.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-dynamic-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});