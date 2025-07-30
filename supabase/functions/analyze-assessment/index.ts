import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { buildAIPromptWithLovableTemplate } from '../_shared/client-context.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const assessmentData: AssessmentData = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Format assessment data for AI using Lovable template
    const assessmentText = Object.entries(assessmentData.assessment_scores)
      .map(([area, score]) => `${area}: ${score}/10`)
      .join('\n');

    // Add client comments if provided
    const fullAssessmentData = `Självskattning (1-10 där 10 = stort hinder):
${assessmentText}

${assessmentData.comments ? `Kommentarer från klienten: ${assessmentData.comments}` : ''}`;

    // Build AI prompt using Lovable template with the new coaching prompt
    const systemPrompt = await buildAIPromptWithLovableTemplate(
      assessmentData.client_id,
      supabase,
      fullAssessmentData,
      'Du är mentor åt en offentlig person. Klienten har gjort en självskattning där de visar hinder i sitt liv. Ta hänsyn till klientens yrkesroll, plattformar, styrkor och utmaningar när du svarar.\n\nGör följande:\n1. Reflektera över klientens aktuella situation.\n2. Identifiera 2–3 hinder som framstår som viktiga att arbeta med.\n3. Ge en konkret, handlingsbar åtgärdsplan i 2–3 steg.\n4. Håll tonen varm, empatisk och professionell.'
    );

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        analysis,
        assessment_scores: assessmentData.assessment_scores,
        comments: assessmentData.comments 
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