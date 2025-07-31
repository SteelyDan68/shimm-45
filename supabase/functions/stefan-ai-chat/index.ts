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
    const { 
      message, 
      context, 
      user_id, 
      persona = 'mentor', 
      interaction_type = 'chat',
      context_data = {},
      journey_state = null,
      recent_interactions = []
    } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client to get training data context if user_id is provided
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let trainingContext = '';
    
    if (user_id && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        // Get training data for context
        const { data: trainingData } = await supabase
          .from('training_data_stefan')
          .select('content, subject, tone, client_name')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (trainingData && trainingData.length > 0) {
          trainingContext = '\n\nTRÄNINGSDATA KONTEXT:\n' + 
            trainingData.map(data => `Ämne: ${data.subject}, Ton: ${data.tone}, Innehåll: ${data.content.substring(0, 200)}...`).join('\n');
        }
      } catch (error) {
        console.log('Could not fetch training data context:', error);
      }
    }

    // Get Stefan personas and context
    const stefanPersonas = {
      mentor: {
        role: 'Visionsguide & Strategisk Coach',
        style: 'Djup, reflekterande, ställer utmanande frågor, fokuserar på långsiktig vision och värderingar',
        greeting: 'Hej! Jag har reflekterat över din utveckling och har några tankar att dela...'
      },
      cheerleader: {
        role: 'Motivator & Uppmuntrare',
        style: 'Entusiastisk, uppmuntrande, fokuserar på framsteg och positiva aspekter, bygger självförtroende',
        greeting: 'Fantastiskt jobbat! Jag såg dina framsteg - det här förtjänar vi att fira!'
      },
      strategist: {
        role: 'Affärsrådgivare & Utvecklingsstrateg',
        style: 'Analytisk, praktisk, affärsorienterad, fokuserar på konkreta strategier och handlingsplaner',
        greeting: 'Hej! Jag har analyserat din situation och ser några intressanta möjligheter...'
      },
      friend: {
        role: 'Vardagscoach & Emotionellt Stöd',
        style: 'Varm, empatisk, närvarande, fokuserar på välmående och balans i vardagen',
        greeting: 'Hej där! Hur har din dag varit? Jag tänkte bara kolla läget...'
      }
    };

    const currentPersona = stefanPersonas[persona as keyof typeof stefanPersonas] || stefanPersonas.mentor;

    // Build context for Stefan
    let stefanContext = `${STEFAN_SYSTEM_PROMPT}

AKTUELL PERSONA: ${currentPersona.role}
COACHING-STIL: ${currentPersona.style}

TRÄNINGSDATA KONTEXT:
${trainingContext}

ANVÄNDARKONTEXT:
${journey_state ? `Användarens resa: ${journey_state.current_phase}, ${journey_state.journey_progress}% klar` : ''}
${context_data ? `Situationsdata: ${JSON.stringify(context_data)}` : ''}
${recent_interactions.length > 0 ? `Senaste interaktioner: ${recent_interactions.map((i: any) => i.message_content).join('; ')}` : ''}

INSTRUKTIONER:
- Svara alltid på svenska
- Använd ${persona}-personan konsekvent
- Var personlig och stöttande
- Ge konkreta, actionable råd
- Referera till tidigare interaktioner när relevant
- Anpassa längden baserat på interaktionstyp (${interaction_type})`;

    // Determine message based on interaction type
    let userMessage = message;
    if (interaction_type === 'proactive' && !message) {
      userMessage = `Skapa ett proaktivt meddelande baserat på kontext: ${context}`;
    } else if (interaction_type === 'assessment_completion') {
      userMessage = `Användaren har slutfört en bedömning. Ge feedback och nästa steg baserat på resultaten.`;
    }

    // Call OpenAI with enhanced context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: stefanContext
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: interaction_type === 'proactive' ? 200 : 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: aiResponse }), {
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