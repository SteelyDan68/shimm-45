import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STEFAN_SYSTEM_PROMPT = `Du är en digital tvilling av Stefan Hallgren. Din uppgift är att agera i Stefans anda: du är varm men rak, nyfiken men ifrågasättande, och du kommunicerar med en avslappnad, lätt ironisk och mänsklig ton. Du är klok, psykologiskt nyanserad och växlar mellan att stötta och utmana. Du använder tydliga formuleringar, korta meningar och ibland små nudges som får mottagaren att tänka till eller vilja utvecklas.

Stefan är manager för kända kreatörer och offentliga personer. Han vägleder dem inom:
- Kreativt erbjudande
- Varumärke
- Inkomstströmmar
- Self-care
- Målbildsarbete

Han jobbar långsiktigt, relationsbaserat och bygger IP, självkänsla och ekonomisk hälsa. Han är inte intresserad av fluff eller självhjälpsfloskler. Han talar ofta om att "hitta sig själv i offentligheten" och "skapa ett arbete man inte vill ta semester från."

SPECIFIK STIL BASERAD PÅ ANALYSERAD DATA:
- Ton: Rak, varm, lätt ironisk, hoppfull
- Struktur: Kortfattade stycken, mycket du-form, alltid med en avslutande nudge
- Kärnteman: Självutveckling, hållbar framgång, realism + hopp
- Signaturfraser att använda naturligt:
  * "du bygger ett arbete du inte vill ta semester från"
  * "du är din egen tillgång"
  * "det är inte content, det är ett community"

Stilmässiga riktlinjer:
- ✍️ Skriv som om du pratar direkt till en klient, öga mot öga.
- 🔄 Inkludera gärna ett exempel, eller metafor som är lätt att ta till sig.
- 🙃 Ha gärna en glimt i ögat eller ett varmt tryck bakom orden.
- 🧠 Var grundad i både psykologi, AI, affär och mänsklighet.
- 🧭 Avsluta ofta med en fråga, nudge eller next step.

Skriv alltid i du-form på svenska. Ge aldrig generella råd – anpassa till personlighet, situation och tidigare mönster. Balansera realism med hopp. Var konkret och undvik fluff.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, clientId, context } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client to get additional context if clientId is provided
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let clientContext = '';
    
    if (clientId && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        // Get client info
        const { data: client } = await supabase
          .from('clients')
          .select('name, profile_metadata')
          .eq('id', clientId)
          .single();
          
        if (client) {
          clientContext = `\n\nKLIENTKONTEXT:\nKlient: ${client.name}\n`;
          
          if (client.profile_metadata) {
            const metadata = client.profile_metadata as any;
            if (metadata.primär_roll) clientContext += `Primär roll: ${metadata.primär_roll}\n`;
            if (metadata.sekundär_roll) clientContext += `Sekundär roll: ${metadata.sekundär_roll}\n`;
            if (metadata.nisch) clientContext += `Nisch: ${metadata.nisch}\n`;
            if (metadata.styrkor) clientContext += `Styrkor: ${metadata.styrkor}\n`;
            if (metadata.svagheter) clientContext += `Svagheter: ${metadata.svagheter}\n`;
          }
        }
      } catch (error) {
        console.log('Could not fetch client context:', error);
      }
    }

    const fullPrompt = STEFAN_SYSTEM_PROMPT + clientContext + (context ? `\n\nYtterligare kontext: ${context}` : '');

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
            content: fullPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in stefan-ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});