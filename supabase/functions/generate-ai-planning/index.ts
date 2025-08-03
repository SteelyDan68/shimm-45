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
    const { 
      recommendation_text, 
      client_id, 
      user_id,
      assessment_type,
      assessment_result,
      journey_progress,
      current_phase,
      weeks = 3,
      comprehensive = false
    } = await req.json();

    const userId = user_id || client_id; // Support both parameter names
    if (!recommendation_text || !userId) {
      throw new Error('Missing required fields: recommendation_text, user_id/client_id');
    }

    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      throw new Error('Inga AI-tjänster tillgängliga');
    }

    console.log('Generating planning for user:', userId);
    console.log('Recommendation text length:', recommendation_text.length);

    // Generate autonomous coaching plan using AI
    const systemPrompt = `Du är Stefan, en AI-coach som skapar autonoma utvecklingsplaner. Du förstår de fem pillars-områdena:
- Self Care (Välmående & Självvård)
- Skills (Färdigheter & Utveckling)
- Talent (Talang & Styrkor)  
- Brand (Varumärke & Position)
- Economy (Ekonomi & Tillväxt)

VIKTIGA PRINCIPER FÖR AUTONOMT COACHING:
- Skapa små, konkreta och genomförbara uppgifter (max 15-30 min per uppgift)
- Bygg gradvis komplexitet över tid
- Fokusera på dagliga mikro-habits som leder till större förändringar
- Använd positiv psykologi och motivation
- Anpassa svårighetsgrad till användarens nuvarande nivå
- Skapa variation för att undvika tristess`;

    const userPrompt = `AUTONOMT COACHING KONTEXT:
Assessment typ: ${assessment_type || 'allmän utveckling'}
Nuvarande utvecklingsfas: ${current_phase || 'start'}
Utvecklingsframsteg: ${journey_progress || 0}%
Rekommendation: ${recommendation_text}

${assessment_result ? `Assessment-resultat: ${JSON.stringify(assessment_result)}` : ''}

Skapa en personaliserad ${weeks}-veckors utvecklingsplan med små, autonoma uppgifter som:
- Börjar med enkla, genomförbara steg
- Gradvis ökar i komplexitet
- Fokuserar på de områden som behöver mest utveckling
- Inkluderar både praktiska övningar och reflektion
- Skapar hållbara vanor för långsiktig tillväxt

Fördela 12-20 aktiviteter över ${weeks} veckor. Max 1-2 per dag.

Returnera ENDAST en giltig JSON-array:
[
  {
    "title": "5-minuters morgonreflektion",
    "description": "Sätt dig ner i 5 minuter och reflektera över hur du mår och vad du vill fokusera på idag. Skriv ned tre saker du är tacksam för.",
    "event_date": "2025-01-31T07:00:00Z",
    "pillar": "self_care",
    "category": "daily_habit"
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
        // Create calendar event for autonomous coaching
        const eventData = {
          user_id: userId,
          created_by: userId,
          title: activity.title,
          description: activity.description,
          event_date: activity.event_date,
          created_by_role: 'ai_system',
          visible_to_client: true,
          category: activity.category || 'autonomous_task'
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

        // Create corresponding autonomous task
        const taskData = {
          user_id: userId,
          created_by: userId,
          title: activity.title,
          description: activity.description,
          deadline: activity.event_date,
          status: 'planned',
          priority: 'medium',
          ai_generated: true
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

        // Create path entry for autonomous coaching tracking
        const pathEntryData = {
          user_id: userId,
          created_by: userId,
          type: 'autonomous_task',
          title: `Autonom uppgift: ${activity.title}`,
          details: `AI-genererad utvecklingsuppgift: ${activity.description}`,
          status: 'planned',
          ai_generated: true,
          created_by_role: 'ai_system',
          visible_to_client: true,
          metadata: {
            pillar: activity.pillar,
            category: activity.category,
            generated_from: 'autonomous_coaching',
            assessment_type: assessment_type,
            journey_progress: journey_progress,
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