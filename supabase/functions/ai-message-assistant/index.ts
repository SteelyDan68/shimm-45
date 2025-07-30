import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageContent, senderName, context } = await req.json();

    console.log('AI Message Assistant request received');

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

    const systemPrompt = `Du är en hjälpsam coach-assistent som hjälper till att svara på meddelanden från klienter. 
    Du ska vara professionell, empatisk och uppmuntrande. Svara på svenska.
    
    Kontext: ${context || 'Allmän coaching-konversation'}
    Meddelande från: ${senderName}
    
    Skapa ett passande svar som är:
    - Professionellt men vänligt
    - Uppmuntrande och stödjande
    - Konkret och hjälpsamt
    - Anpassat till coaching-miljön`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: messageContent }
    ], {
      maxTokens: 500,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      throw new Error('AI-tjänst misslyckades: ' + aiResponse.error);
    }

    const aiSuggestion = aiResponse.content;

    return new Response(JSON.stringify({ aiSuggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in AI message assistant:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});