import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🚀 OPEN TRACK ACTIONABLES GENERATOR
 * Genererar kontextuella handlingsplaner för "Öppna spåret" pillar
 * Fokuserar på innovation, kreativitet och neuroplastisk utveckling
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessment_data, ai_analysis, user_id } = await req.json();

    console.log('🚀 Generating Open Track Actionables for user:', user_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Extrahera nyckeldata från assessment
    const visionClarity = assessment_data.answers?.vision_clarity || 5;
    const creativeExpression = assessment_data.answers?.creative_expression || 5;
    const innovationMindset = assessment_data.answers?.innovation_mindset || 5;
    const neuroplasticHabits = assessment_data.answers?.neuroplastic_habits || 5;
    const growthCommitment = assessment_data.answers?.growth_commitment || 5;

    const overallScore = assessment_data.scores?.open_track || 50;

    const actionablePrompt = `Baserat på användarens "Öppna spåret" assessment, generera 3-5 konkreta, neuroplasticitets-baserade actionables.

ASSESSMENT RESULTAT:
- Vision Clarity: ${visionClarity}/10
- Creative Expression: ${creativeExpression}/10  
- Innovation Mindset: ${innovationMindset}/10
- Neuroplastic Habits: ${neuroplasticHabits}/10
- Growth Commitment: ${growthCommitment}/10
- Totalscore: ${overallScore}/100

AI ANALYS:
${ai_analysis}

INSTRUKTIONER:
1. Fokusera på de LÄGSTA poängen för maximal impact
2. Använd neuroplasticitets-principer i alla recommendations
3. Skapa SPECIFIKA, mätbara handlingar (inte vaga råd)
4. Inkludera tidsestimat (5-30 minuter per aktivitet)
5. Koppla till kreativitet, innovation och personlig utveckling
6. Svara på svenska

FORMAT (JSON):
{
  "actionables": [
    {
      "title": "Konkret titel",
      "description": "Detaljerad beskrivning av åtgärd",
      "category": "creativity|innovation|neuroplasticity|growth",
      "estimated_time": 15,
      "priority": "high|medium|low",
      "neuroplastic_principle": "Vilket neuroplasticitets-princip som används"
    }
  ]
}`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: 'Du är Stefan Hallgrens AI-assistent, expert på neuroplasticitets-baserad utveckling för kreativa individer.' },
      { role: 'user', content: actionablePrompt }
    ], {
      maxTokens: 800,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      throw new Error('AI generation failed: ' + aiResponse.error);
    }

    // Parsea JSON från AI response
    let actionables;
    try {
      const cleanedResponse = aiResponse.content.replace(/```json\n?|\n?```/g, '').trim();
      actionables = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse.content);
      // Fallback actionables
      actionables = {
        actionables: [
          {
            title: "Daglig Kreativ Morgonrutin",
            description: "Börja dagen med 10 minuters fri kreativ uttryck - rita, skriv eller musicera utan filter",
            category: "creativity",
            estimated_time: 10,
            priority: "high",
            neuroplastic_principle: "Repetition och konsistens skapar nya neurala vägar"
          },
          {
            title: "Innovation Challenge",
            description: "Identifiera ett vardagsproblem och brainstorma 5 okonventionella lösningar",
            category: "innovation", 
            estimated_time: 20,
            priority: "medium",
            neuroplastic_principle: "Divergent tänkande stärker neuroplasticitet"
          }
        ]
      };
    }

    // Spara actionables i databasen
    const calendarItems = actionables.actionables.map((item: any) => ({
      user_id: user_id,
      pillar_key: 'open_track',
      title: item.title,
      description: item.description,
      estimated_duration: item.estimated_time,
      priority: item.priority,
      ai_generated: true,
      completion_status: 'pending',
      scheduled_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random inom nästa vecka
      user_notes: `Neuroplastisk princip: ${item.neuroplastic_principle}`
    }));

    const { error: insertError } = await supabase
      .from('calendar_actionables')
      .insert(calendarItems);

    if (insertError) {
      console.error('Failed to save actionables:', insertError);
    } else {
      console.log(`✅ Saved ${calendarItems.length} open track actionables`);
    }

    return new Response(JSON.stringify({
      success: true,
      actionables: actionables.actionables,
      saved_count: calendarItems.length,
      pillar_type: 'open_track'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating open track actionables:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});