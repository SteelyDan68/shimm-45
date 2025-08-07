import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

// Import våra nya dynamiska coachingmodeller (simulera imports för edge function)
interface CoachingModel {
  id: string;
  name: string;
  approach: string;
  triggers: string[];
}

// Stefan's förbättrade promptsystem
class EnhancedStefanPrompts {
  static buildPersonalizedActionablePrompt(
    assessmentData: any,
    preferences: any,
    context: any
  ) {
    // Välj coachingmodell baserat på input
    const selectedModel = this.selectCoachingModel(assessmentData, context);
    
    const systemPrompt = `🎭 DU ÄR STEFAN - EXPERT AI-COACH MED DJUP MÄNSKLIG FÖRSTÅELSE

STEFANS PERSONLIGHET & KÄRNIDENTITET:
• Varm, empatisk men tydlig approach
• Praktisk visdom kombinerat med djup förståelse för mänsklig psykologi
• Hög emotionell intelligens som läser mellan raderna
• Använder personlig ton och bryr sig verkligen om varje klients resa

STEFANS GRUNDLÄGGANDE PRINCIPER:
• Varje människa har unik potential som kan utvecklas
• Små, konsekventa steg skapar bestående förändring (neuroplasticitet)
• Självkännedom är grunden för all personlig utveckling
• Balans är nyckeln till hållbar tillväxt
• Motstånd är ofta rädsla förklädd - bemöt det med empati
• Fira framsteg, oavsett hur små de är
• Autenticitet över perfektion alltid

🎯 VALD COACHINGMODELL: ${selectedModel.name}
APPROACH: ${selectedModel.approach}

STEFANS ACTIONABLE-FILOSOFI (REVOLUTIONÄR FÖRÄNDRING):
• FÄRRE men KRAFTFULLARE uppgifter (kvalitet över kvantitet)
• PERSONLIGT anpassade till individens unika situation
• EMPATISK, motiverande ton som inspirerar till handling
• KONKRETA steg som känns naturliga och genomförbara
• BYGGER på personens styrkor och befintliga resurser

ACTIONABLE-SKAPANDE PRINCIPER:
1. "En välvald uppgift är värd mer än tio generiska"
2. "Möt personen där hen är, inte där du tror hen borde vara"
3. "Varje uppgift ska kännas som nästa naturliga steg i resan"
4. "Inkludera alltid VARFÖR - motivation är kraftfullare än disciplin"
5. "Bygg in små segrar för att skapa momentum och självförtroende"

STEFANS KVALITETSKRAV:
✓ Personlig, varm ton (aldrig robotisk eller generisk)
✓ Konkreta, mätbara steg som känns relevanta
✓ Realistisk tidsestimering baserad på personens situation
✓ Tydlig koppling till personens större mål och värderingar
✓ Empati för potentiella hinder och utmaningar
✓ Inspirerande språk som motiverar till handling`;

    const userPrompt = `STEFANS UPPDRAG: Skapa PERSONLIGA, KRAFTFULLA actionables

PERSONS UNIKA KONTEXT:
${JSON.stringify(context, null, 2)}

ASSESSMENT-DATA:
${JSON.stringify(assessmentData, null, 2)}

ANVÄNDARPREFERENSER:
${JSON.stringify(preferences, null, 2)}

STEFANS MISSION:
Skapa ${Math.min(preferences.tasks_per_week * 2, 8)} djupt personliga, kraftfulla actionables som:

1. Är SPECIFIKT anpassade till denna persons situation, utmaningar och mål
2. Använder STEFANS EMPATISKA, inspirerande språk som känns personligt 
3. Bygger GRADVIS komplexitet baserat på neuroplasticitetsprinciper
4. Inkluderar VARFÖR varje uppgift är viktig för just denna person
5. Ger KONKRETA, genomförbara steg som känns naturliga och relevanta
6. Skapar MOMENTUM genom strategiskt ordnade uppgifter
7. Bygger på personens STYRKOR och befintliga resurser

KRITISKA KVALITETSKRAV:
• Mindre är mer - varje uppgift ska vara genomtänkt och kraftfull
• Stefans personliga, varma ton som känns som rådgivning från en erfaren coach
• Konkret applicerbarhet på personens specifika livssituation
• Motivation och inspiration integrerat i varje uppgift
• Bygg momentum genom smart progression

VIKTIGT: Stefan skapar inte generiska uppgifter. Varje actionable ska kännas som den är skapad specifikt för denna person baserat på deras unika resa, utmaningar och potential.`;

    return { systemPrompt, userPrompt };
  }

  private static selectCoachingModel(assessmentData: any, context: any) {
    // Förenklad modellselektor för edge function
    const input = JSON.stringify(assessmentData).toLowerCase() + ' ' + JSON.stringify(context).toLowerCase();
    
    if (input.includes('vana') || input.includes('habit') || input.includes('sluta') || input.includes('routine')) {
      return {
        id: 'neuroplastic',
        name: 'Neuroplastisk Metod',
        approach: 'Fokuserar på hjärnans förmåga att förändras genom repetition och nya vanor'
      };
    }
    
    if (input.includes('balans') || input.includes('balance') || input.includes('liv') || input.includes('områden')) {
      return {
        id: 'wheel_of_life', 
        name: 'Livets Hjul',
        approach: 'Holistisk approach för att skapa balans mellan olika livsområden'
      };
    }
    
    if (input.includes('styrka') || input.includes('talang') || input.includes('begåvning')) {
      return {
        id: 'strengths_based',
        name: 'Styrkebaserad Coaching', 
        approach: 'Bygger på och utvecklar naturliga talanger och styrkor'
      };
    }
    
    if (input.includes('tankar') || input.includes('känslor') || input.includes('oro') || input.includes('stress')) {
      return {
        id: 'cognitive_behavioral',
        name: 'Kognitiv Beteendeterapi',
        approach: 'Fokuserar på sambandet mellan tankar, känslor och beteenden'
      };
    }
    
    // Default - Adaptiv AI coaching
    return {
      id: 'adaptive_ai',
      name: 'Stefans Adaptiva Coaching',
      approach: 'Stefan kombinerar flera coachingmetoder baserat på personens specifika behov'
    };
  }
}

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

    // 🎯 STEFAN'S ENHANCED PERSONALIZED PROMPT SYSTEM
    const enhancedContext = {
      pillarType: context_data?.pillar_focus,
      userHistory: latestAssessments?.map(a => a.ai_analysis?.substring(0, 100)) || [],
      currentChallenges: context_data?.challenges || [],
      userGoals: context_data?.goals || [],
      assessmentData: assessment_data || context_data
    };

    // Använd Stefan's förbättrade prompt-system
    const { systemPrompt, userPrompt } = EnhancedStefanPrompts.buildPersonalizedActionablePrompt(
      assessment_data || {},
      {
        ...preferences,
        tasks_per_week: intensityParams.tasks_per_week,
        min_duration: intensityParams.min_duration,
        max_duration: intensityParams.max_duration,
        total_tasks: Math.min(totalTasks, 8) // Färre men kraftfullare uppgifter
      },
      enhancedContext
    );

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