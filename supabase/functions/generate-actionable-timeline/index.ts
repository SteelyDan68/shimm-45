import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, pillar_key, assessment_data, journey_preferences } = await req.json()

    if (!user_id || !pillar_key || !assessment_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📅 Generating actionable timeline for pillar: ${pillar_key}`)

    // Get user's current context and preferences
    const { data: userContext } = await supabaseClient.functions.invoke('get-user-attribute', {
      body: { user_id, attribute_key: 'neuroplasticity_journeys' }
    })

    const { data: wheelData } = await supabaseClient.functions.invoke('get-user-attribute', {
      body: { user_id, attribute_key: 'wheel_of_life_scores' }
    })

    // Build AI prompt for timeline generation
    const contextData = {
      pillar: pillar_key,
      assessment: assessment_data,
      wheel_scores: wheelData?.attribute_value || {},
      existing_journeys: userContext?.attribute_value || [],
      preferred_timeline: journey_preferences?.duration || 42,
      preferred_intensity: journey_preferences?.intensity || 'moderate'
    }

    const aiPrompt = `Som expert inom neuroplasticitet och coaching, skapa en personlig utvecklingsplan baserat på denna data:

PILLAR: ${pillar_key}
ASSESSMENT DATA: ${JSON.stringify(assessment_data, null, 2)}
ÖNSKAD LÄNGD: ${contextData.preferred_timeline} dagar
INTENSITET: ${contextData.preferred_intensity}

Skapa en detaljerad timeline med:

1. NEUROPLASTISK PROGRESSION (baserat på 66-dagars neuroplastiska modellen):
- Förberedelsefas (dag 1-7): Medvetenhet och små förändringar
- Tillväxtfas (dag 8-35): Nya mönster och vanor
- Integrationsfas (dag 36-66): Djup förankring

2. VECKOVISA ACTIONABLES:
- Specifika, mätbara uppgifter
- Progressiv svårighetsgrad
- Neuroplastiska övningar
- Reflektionsmoment

3. DAGLIGA MICRO-ACTIONS:
- 5-15 minuters aktiviteter
- Hjärnträning specifikt för denna pillar
- Mindfulness och reflektion

Formatera som JSON med denna struktur:
{
  "timeline_duration": ${contextData.preferred_timeline},
  "neuroplastic_phases": [
    {
      "phase": "preparation",
      "days": "1-7",
      "focus": "beskrivning",
      "neural_focus": "medvetenhet och intention"
    }
  ],
  "weekly_goals": [
    {
      "week": 1,
      "title": "titel",
      "description": "beskrivning",
      "actionables": [
        {
          "title": "uppgift",
          "description": "detaljerad beskrivning",
          "duration_minutes": 15,
          "neuroplastic_type": "awareness/practice/integration",
          "frequency": "daily/weekly",
          "success_metrics": "hur mäta framsteg"
        }
      ]
    }
  ],
  "daily_micro_actions": [
    {
      "title": "kort titel",
      "description": "5-15 min aktivitet",
      "neuroplastic_principle": "vilken princip",
      "suggested_times": ["07:00", "12:00", "19:00"]
    }
  ],
  "milestone_checkpoints": [
    {
      "day": 7,
      "title": "vecka 1 reflektion",
      "assessment_questions": ["fråga 1", "fråga 2"],
      "celebration_suggestion": "hur fira framsteg"
    }
  ]
}

Svara ENDAST med JSON, ingen annan text.`

    // Call OpenAI for timeline generation
    let generatedTimeline = null

    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Du är en expert inom neuroplasticitet, coaching och personlig utveckling. Du skapar vetenskapligt grundade utvecklingsplaner baserat på neuroplastiska principer.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        }),
      })

      if (openAIResponse.ok) {
        const openAIData = await openAIResponse.json()
        const responseText = openAIData.choices[0]?.message?.content || ''
        
        try {
          generatedTimeline = JSON.parse(responseText)
          console.log('✅ AI timeline generated successfully')
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError)
          throw new Error('AI response was not valid JSON')
        }
      } else {
        throw new Error('OpenAI API call failed')
      }
    } catch (aiError) {
      console.error('AI timeline generation failed:', aiError)
      
      // Fallback template
      generatedTimeline = {
        timeline_duration: contextData.preferred_timeline,
        neuroplastic_phases: [
          {
            phase: "preparation",
            days: "1-7", 
            focus: "Medvetenhet och förberedelse",
            neural_focus: "Aktivera intention och awareness"
          },
          {
            phase: "growth",
            days: "8-35",
            focus: "Nya mönster och vanor",
            neural_focus: "Stärka neurala vägar"
          },
          {
            phase: "integration", 
            days: "36-66",
            focus: "Djup förankring",
            neural_focus: "Automatisera nya beteenden"
          }
        ],
        weekly_goals: [
          {
            week: 1,
            title: `${pillar_key} foundation`,
            description: "Bygg grundläggande medvetenhet",
            actionables: [
              {
                title: "Daglig reflektion",
                description: "5 minuters daglig reflektion över dina framsteg",
                duration_minutes: 5,
                neuroplastic_type: "awareness",
                frequency: "daily",
                success_metrics: "Antalet dagar du genomför reflektionen"
              }
            ]
          }
        ],
        daily_micro_actions: [
          {
            title: "Mindful pause",
            description: "3 djupa andetag med intention",
            neuroplastic_principle: "mindfulness",
            suggested_times: ["07:00", "12:00", "19:00"]
          }
        ],
        milestone_checkpoints: [
          {
            day: 7,
            title: "Vecka 1 reflektion",
            assessment_questions: [
              "Hur känns denna utvecklingsresa så här långt?",
              "Vilka mönster har du börjat märka?"
            ],
            celebration_suggestion: "Fira genom att dela din framsteg med någon du litar på"
          }
        ]
      }
    }

    // Save the generated timeline to user attributes
    try {
      const timelineData = {
        pillar_key,
        generated_at: new Date().toISOString(),
        timeline: generatedTimeline,
        assessment_context: assessment_data
      }

      await supabaseClient.functions.invoke('update-user-attribute', {
        body: {
          user_id,
          attribute_key: `actionable_timeline_${pillar_key}`,
          attribute_value: timelineData
        }
      })

      console.log('✅ Timeline saved to user attributes')
    } catch (saveError) {
      console.error('Failed to save timeline:', saveError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        timeline: generatedTimeline,
        pillar_key,
        duration: contextData.preferred_timeline
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in generate-actionable-timeline:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})