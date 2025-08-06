import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoachingPreferences {
  intensity: 'chill' | 'moderate' | 'intense';
  duration: number; // weeks
  frequency: 'daily' | 'few-times-week' | 'weekly';
}

interface ActionableTask {
  title: string;
  description: string;
  event_date: string;
  pillar: string;
  category: string;
  estimated_minutes: number;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id,
      preferences,
      assessment_data,
      context_data
    } = await req.json();

    if (!user_id || !preferences) {
      throw new Error('Missing required fields: user_id, preferences');
    }

    console.log('🎯 Enhanced AI Planning for user:', user_id);
    console.log('📊 Preferences:', preferences);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's latest assessment data for context
    const { data: latestAssessments } = await supabase
      .from('assessment_rounds')
      .select('*')
      .eq('user_id', user_id)
      .not('ai_analysis', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    // Generate intensity-based parameters
    const getIntensityParams = (intensity: CoachingPreferences['intensity']) => {
      switch (intensity) {
        case 'chill':
          return {
            tasks_per_week: 2,
            min_duration: 5,
            max_duration: 15,
            complexity: 'basic',
            stress_level: 'minimal'
          };
        case 'moderate':
          return {
            tasks_per_week: 4,
            min_duration: 15,
            max_duration: 30,
            complexity: 'intermediate',
            stress_level: 'moderate'
          };
        case 'intense':
          return {
            tasks_per_week: 6,
            min_duration: 30,
            max_duration: 60,
            complexity: 'advanced',
            stress_level: 'challenging'
          };
      }
    };

    const intensityParams = getIntensityParams(preferences.intensity);
    const totalTasks = intensityParams.tasks_per_week * preferences.duration;

    // AI prompt for enhanced actionable generation
    const systemPrompt = `Du är Stefan, en AI-coach som skapar SMART actionables baserat på neuroplasticitet och användarens kapacitet.

NEUROPLASTISKA PRINCIPER:
- Progression: Börja enkelt, öka gradvis komplexitet
- Repetition: Konsistenta små steg skapar varor
- Variation: Undvik tristess genom olika typer av aktiviteter
- Reward: Inkludera positiv förstärkning och belöning

ANVÄNDARENS PREFERENSER:
- Intensitet: ${preferences.intensity} (${intensityParams.tasks_per_week} uppgifter/vecka)
- Tidsram: ${preferences.duration} veckor
- Frekvens: ${preferences.frequency}
- Tidsspann per uppgift: ${intensityParams.min_duration}-${intensityParams.max_duration} minuter`;

    const userPrompt = `Skapa ${totalTasks} ACTIONABLE UPPGIFTER fördelade över ${preferences.duration} veckor.

ANVÄNDARKONTEXT:
${latestAssessments?.map(a => `- ${a.pillar_type}: ${a.ai_analysis?.substring(0, 200)}...`).join('\n') || 'Ingen assessmentdata tillgänglig'}

RIKTLINJER FÖR UPPGIFTER:
1. Varje uppgift ska vara KONKRET och MÄTBAR
2. Tid: ${intensityParams.min_duration}-${intensityParams.max_duration} minuter
3. Gradvis progression från vecka 1 till ${preferences.duration}
4. Balansera alla utvecklingsområden
5. Inkludera både reflektion och aktion
6. Anpassa till ${preferences.intensity} intensitetsnivå

Returnera ENDAST giltig JSON-array:
[
  {
    "title": "Kortfattad, actionabel titel",
    "description": "Detaljerad beskrivning av vad användaren ska göra steg för steg",
    "event_date": "2025-01-07T09:00:00Z",
    "pillar": "self_care",
    "category": "daily_habit",
    "estimated_minutes": 15,
    "priority": "medium",
    "difficulty": "easy"
  }
]

VIKTIGT: Fördela uppgifterna jämnt över ${preferences.duration} veckor!`;

    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      throw new Error('Inga AI-tjänster tillgängliga');
    }

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 3000,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      throw new Error('AI-planering misslyckades: ' + aiResponse.error);
    }

    let actionableTasks: ActionableTask[];
    try {
      const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      actionableTasks = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI planning response');
    }

    console.log('✅ Generated', actionableTasks.length, 'actionable tasks');

    // Create calendar events and tasks in database
    const createdEvents = [];
    const createdTasks = [];

    for (const task of actionableTasks) {
      try {
        // Create calendar event
        const { data: eventResult, error: eventError } = await supabase
          .from('calendar_events')
          .insert({
            user_id: user_id,
            created_by: user_id,
            title: task.title,
            description: task.description,
            event_date: task.event_date,
            created_by_role: 'ai_system',
            visible_to_client: true,
            category: task.category
          })
          .select()
          .single();

        if (eventError) {
          console.error('Error creating calendar event:', eventError);
          continue;
        }
        createdEvents.push(eventResult);

        // Create corresponding task
        const { data: taskResult, error: taskError } = await supabase
          .from('tasks')
          .insert({
            user_id: user_id,
            created_by: user_id,
            title: task.title,
            description: task.description,
            deadline: task.event_date,
            status: 'planned',
            priority: task.priority,
            ai_generated: true
          })
          .select()
          .single();

        if (taskError) {
          console.error('Error creating task:', taskError);
          continue;
        }
        createdTasks.push(taskResult);

        // Create calendar actionable for detailed tracking
        const { error: actionableError } = await supabase
          .from('calendar_actionables')
          .insert({
            user_id: user_id,
            title: task.title,
            description: task.description,
            pillar_key: task.pillar,
            scheduled_date: task.event_date,
            estimated_duration: task.estimated_minutes,
            priority: task.priority,
            completion_status: 'pending',
            ai_generated: true
          });

        if (actionableError) {
          console.error('Error creating actionable:', actionableError);
        }

      } catch (taskError) {
        console.error('Error processing task:', taskError);
        continue;
      }
    }

    // Log coaching analytics
    await supabase.from('coaching_analytics').insert({
      user_id: user_id,
      metric_type: 'enhanced_plan_generated',
      metric_value: actionableTasks.length,
      metric_data: {
        preferences: preferences,
        tasks_created: actionableTasks.length,
        events_created: createdEvents.length,
        actionables_created: createdTasks.length,
        intensity: preferences.intensity,
        duration_weeks: preferences.duration
      }
    });

    console.log('📊 Plan Analytics Logged');

    return new Response(JSON.stringify({
      success: true,
      plan: {
        tasks_generated: actionableTasks.length,
        events_created: createdEvents.length,
        tasks_created: createdTasks.length,
        preferences: preferences,
        tasks: actionableTasks
      },
      summary: {
        intensity: preferences.intensity,
        duration_weeks: preferences.duration,
        total_tasks: actionableTasks.length,
        avg_task_duration: intensityParams.min_duration + '-' + intensityParams.max_duration + ' min'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in enhanced-ai-planning:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});