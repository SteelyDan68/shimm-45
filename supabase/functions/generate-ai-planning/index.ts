import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlannedActivity {
  title: string;
  description: string;
  event_date: string;
  pillar: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recommendation_text, client_id, weeks = 3 } = await req.json();

    if (!recommendation_text || !client_id) {
      throw new Error('Missing required fields: recommendation_text, client_id');
    }

    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      throw new Error('Inga AI-tjänster tillgängliga');
    }

    console.log('Generating planning for client:', client_id);
    console.log('Recommendation text length:', recommendation_text.length);

    // Generate plan using AI (with fallback)
    const systemPrompt = `Du är en expert på att skapa genomförbara utvecklingsplaner för offentliga personer och influencers. 
            Du förstår vikten av balans mellan produktivitet och återhämtning.`;

    const userPrompt = `Du har gett följande rekommendation till en offentlig person:

"${recommendation_text}"

Skapa en genomförbar ${weeks}-veckorsplan där varje delsteg är:
- Tidsatt (datum + tid baserat på idag som startpunkt)
- Beskriven som en konkret aktivitet
- Märkt med pelare den tillhör ("self_care", "skills", "talent", "brand", "economy")
- Kategoriserad ("samtal", "mote", "deadline", "lansering", "paminnelse", "annat")

Max 1-2 aktiviteter per dag. Undvik överbelastning. Fördela jämnt över veckorna. Inkludera återhämtning.
Starta från imorgon och fördela över ${weeks} veckor.

Returnera ENDAST en giltig JSON-array utan kommentarer:
[
  {
    "title": "Skapa manus till nästa video",
    "description": "Fokusera på tydligt budskap enligt brand-plan", 
    "event_date": "2025-01-31T10:00:00Z",
    "pillar": "brand",
    "category": "deadline"
  }
]`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 2000,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      throw new Error('AI-planering misslyckades: ' + aiResponse.error);
    }

    const planText = aiResponse.content;
    
    console.log('OpenAI raw response:', planText);

    // Parse the JSON response
    let plannedActivities: PlannedActivity[];
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = planText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      plannedActivities = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Failed to parse planning response from AI');
    }

    console.log('Parsed activities:', plannedActivities.length);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const createdEvents = [];
    const createdTasks = [];

    // Create calendar events and tasks
    for (const activity of plannedActivities) {
      try {
        // Create calendar event
        const eventData = {
          client_id,
          title: activity.title,
          description: activity.description,
          event_date: activity.event_date,
          created_by_role: 'system',
          visible_to_client: true,
          category: activity.category || 'annat'
        };

        const { data: eventResult, error: eventError } = await supabase
          .from('calendar_events')
          .insert(eventData)
          .select()
          .single();

        if (eventError) {
          console.error('Error creating calendar event:', eventError);
          continue;
        }

        createdEvents.push(eventResult);

        // Create corresponding task
        const taskData = {
          client_id,
          title: activity.title,
          description: activity.description,
          deadline: activity.event_date,
          status: 'planned',
          priority: 'medium',
          ai_generated: true,
          created_by: supabaseKey, // System user
        };

        const { data: taskResult, error: taskError } = await supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();

        if (taskError) {
          console.error('Error creating task:', taskError);
          continue;
        }

        createdTasks.push(taskResult);

        // Create path entry for tracking
        const pathEntryData = {
          client_id,
          type: 'action',
          title: `Planerad: ${activity.title}`,
          details: `Automatiskt genererad från AI-rekommendation: ${activity.description}`,
          status: 'planned',
          ai_generated: true,
          created_by: supabaseKey,
          visible_to_client: true,
          metadata: {
            pillar_type: activity.pillar,
            generated_from: 'ai_planning',
            original_recommendation: recommendation_text.substring(0, 200)
          }
        };

        await supabase
          .from('path_entries')
          .insert(pathEntryData);

      } catch (activityError) {
        console.error('Error processing activity:', activityError);
        continue;
      }
    }

    console.log(`Created ${createdEvents.length} events and ${createdTasks.length} tasks`);

    return new Response(JSON.stringify({
      success: true,
      activities_planned: plannedActivities.length,
      events_created: createdEvents.length,
      tasks_created: createdTasks.length,
      activities: plannedActivities,
      events: createdEvents,
      tasks: createdTasks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-planning function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});