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

    const { user_id, pillar_key, dependency_types } = await req.json()

    if (!user_id || !pillar_key) {
      return new Response(
        JSON.stringify({ error: 'user_id and pillar_key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    // 1. Radera AI recommendations för denna pillar
    if (dependency_types.includes('ai_recommendations')) {
      const { error: recommendationsError } = await supabaseClient
        .from('ai_recommendations')
        .delete()
        .eq('user_id', user_id)
        .eq('category', pillar_key)

      if (recommendationsError) {
        console.error('Error deleting AI recommendations:', recommendationsError)
      } else {
        results.push('ai_recommendations')
      }
    }

    // 2. Radera coaching recommendations för denna pillar
    if (dependency_types.includes('ai_recommendations')) {
      const { error: coachingRecommendationsError } = await supabaseClient
        .from('ai_coaching_recommendations')
        .delete()
        .eq('user_id', user_id)
        .eq('category', pillar_key)

      if (coachingRecommendationsError) {
        console.error('Error deleting coaching recommendations:', coachingRecommendationsError)
      } else {
        results.push('ai_coaching_recommendations')
      }
    }

    // 3. Radera calendar events relaterade till denna pillar
    if (dependency_types.includes('calendar_events')) {
      const { error: calendarError } = await supabaseClient
        .from('calendar_events')
        .delete()
        .eq('user_id', user_id)
        .eq('category', pillar_key)

      if (calendarError) {
        console.error('Error deleting calendar events:', calendarError)
      } else {
        results.push('calendar_events')
      }
    }

    // 4. Radera progress entries för denna pillar
    if (dependency_types.includes('progress_entries')) {
      const { error: progressError } = await supabaseClient
        .from('coaching_progress_entries')
        .delete()
        .eq('user_id', user_id)
        .ilike('title', `%${pillar_key}%`)

      if (progressError) {
        console.error('Error deleting progress entries:', progressError)
      } else {
        results.push('progress_entries')
      }
    }

    // 5. Uppdatera neuroplasticity journeys för att ta bort pillar-specifik data
    if (dependency_types.includes('neuroplasticity_journeys')) {
      try {
        // Hämta användarens neuroplasticity journey data
        const { data: userData, error: getUserError } = await supabaseClient.functions.invoke('get-user-attribute', {
          body: { user_id, attribute_key: 'neuroplasticity_journeys' }
        })

        if (!getUserError && userData?.attribute_value) {
          const journeys = userData.attribute_value as any[]
          
          // Filtrera bort journeys som är relaterade till denna pillar
          const filteredJourneys = journeys.filter(journey => 
            journey.journey_type !== pillar_key && 
            !journey.focus_areas?.includes(pillar_key)
          )

          // Uppdatera datan
          await supabaseClient.functions.invoke('update-user-attribute', {
            body: {
              user_id,
              attribute_key: 'neuroplasticity_journeys',
              attribute_value: filteredJourneys
            }
          })

          results.push('neuroplasticity_journeys')
        }
      } catch (neuroplasticityError) {
        console.error('Error updating neuroplasticity journeys:', neuroplasticityError)
      }
    }

    // 6. Radera pillar-specifik data från user attributes
    try {
      const { data: pillarData, error: getPillarError } = await supabaseClient.functions.invoke('get-user-attribute', {
        body: { user_id, attribute_key: 'pillar_assessments' }
      })

      if (!getPillarError && pillarData?.attribute_value) {
        const assessments = pillarData.attribute_value as any
        
        // Ta bort denna pillar från assessments
        delete assessments[pillar_key]

        await supabaseClient.functions.invoke('update-user-attribute', {
          body: {
            user_id,
            attribute_key: 'pillar_assessments',
            attribute_value: assessments
          }
        })

        results.push('pillar_assessments')
      }
    } catch (attributeError) {
      console.error('Error updating user attributes:', attributeError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleared_dependencies: results,
        message: `Successfully cleared dependencies for pillar ${pillar_key}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in clear-pillar-dependencies:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})