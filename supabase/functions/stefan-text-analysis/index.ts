import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_SYSTEM_PROMPT = `Du är en expert på kommunikationsanalys med 30 års erfarenhet av psykologi, teknik och kreativitet. 

Din uppgift är att analysera text som skrivits av Stefan Hallgren och extrahera hans unika kommunikationsmönster.

Analysera texten enligt följande struktur och returnera ENDAST giltigt JSON:

{
  "stefan_tonality": {
    "word_choice": "Beskrivning av ordval och språkbruk",
    "tone": "Beskrivning av grundton och känslomässig färgning", 
    "structure": "Beskrivning av textens struktur och uppbyggnad"
  },
  "implied_philosophy": {
    "core_values": ["Värdering 1", "Värdering 2", "Värdering 3"],
    "approach_to_clients": "Beskrivning av synen på klientrelationer",
    "view_on_creativity": "Beskrivning av synen på kreativitet och utveckling",
    "leadership_style": "Beskrivning av ledarskaps- och coachingstil"
  },
  "communication_purpose": {
    "primary_intent": "Huvudsyfte med kommunikationen",
    "underlying_goals": ["Mål 1", "Mål 2", "Mål 3"],
    "target_outcome": "Önskat resultat av kommunikationen"
  },
  "patterns": {
    "feedback_style": "Beskrivning av hur Stefan ger feedback",
    "questioning_technique": "Beskrivning av hur Stefan ställer frågor",
    "challenge_vs_support": "Balans mellan utmaning och stöd",
    "use_of_examples": "Hur Stefan använder exempel och metaforer",
    "conversation_flow": "Typisk struktur i Stefans konversationer"
  },
  "distinctive_elements": {
    "signature_phrases": ["Typisk fras 1", "Typisk fras 2"],
    "recurring_themes": ["Tema 1", "Tema 2", "Tema 3"],
    "unique_perspective": "Vad som gör Stefans perspektiv unikt"
  }
}

Fokusera på konkreta observationer från texten. Var specifik och undvik generella påståenden.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textContent, trainingDataId, metadata } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Analyzing text for Stefan communication patterns...');

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
            content: ANALYSIS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Analysera följande text från Stefan:

METADATA:
- Ämne: ${metadata?.subject || 'Ej angivet'}
- Tonläge: ${metadata?.tone || 'Ej angivet'}
- Klient: ${metadata?.client_name || 'Ej angivet'}
- Datum: ${metadata?.date_created || 'Ej angivet'}

TEXT ATT ANALYSERA:
${textContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;

    // Parse the JSON response
    let analysisJson;
    try {
      analysisJson = JSON.parse(analysisContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', analysisContent);
      throw new Error('AI response was not valid JSON');
    }

    // Save the analysis to the database
    const { error: updateError } = await supabase
      .from('training_data_stefan')
      .update({
        metadata: {
          ...metadata,
          stefan_analysis: {
            analyzed_at: new Date().toISOString(),
            analysis: analysisJson,
            ai_model: 'gpt-4.1-2025-04-14'
          }
        }
      })
      .eq('id', trainingDataId);

    if (updateError) {
      console.error('Error saving analysis:', updateError);
      throw updateError;
    }

    console.log('Analysis completed and saved successfully');

    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysisJson 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in stefan-text-analysis function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});