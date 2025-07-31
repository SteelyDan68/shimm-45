import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryRequest {
  client_id: string;
  setback_event: any;
  habit_context: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_id, setback_event, habit_context } = await req.json() as RecoveryRequest;

    console.log('Generating recovery plan for client:', client_id, 'Setback type:', setback_event.setback_type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client profile for personalized recovery
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('name, profile_metadata, custom_fields')
      .eq('id', client_id)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
    }

    const progressData = (clientData?.custom_fields as any)?.progress_data;

    // Generate AI-powered recovery plan
    const systemPrompt = `Du är Stefan, en expert på neuroplasticitet och vanbildning. Din uppgift är att skapa personaliserade återhämtningsplaner när användare hamnar efter med sina vanor.

Neuroplasticitetsprinciper:
- Hjärnan formar nya banor genom upprepad övning
- Små, konsekventa steg är mer effektiva än stora sporadiska insatser
- Miljöförändringar påverkar vanbildning kraftigt
- Självmedkänsla är avgörande för långsiktig framgång
- Progressiv svårighetsökning efter att grunden är stabil

Återhämtningsstrategier baserat på setback-typ:
- missed_days: Minska åtagandet temporärt, fokusera på konsistens
- low_motivation: Återanknyt till ursprungligt "varför", lägg till externa belöningar
- external_disruption: Anpassa vanan till nya omständigheter
- difficulty_spike: Skala ner till tidigare nivå, bygg upp igen
- life_change: Helt omdesign av vana för nya livssituationen

Skapa alltid KONKRETA, GENOMFÖRBARA steg - inte vaga råd.`;

    const userPrompt = `SETBACK SITUATION:
Typ: ${setback_event.setback_type}
Allvarlighetsgrad: ${setback_event.severity}
Kontext: ${JSON.stringify(setback_event.context, null, 2)}

VANA SOM PÅVERKATS:
${habit_context ? `
Titel: ${habit_context.title}
Beskrivning: ${habit_context.description}
Svårighetsgrad: ${habit_context.difficulty}
Frekvens: ${habit_context.frequency}
Nuvarande streak: ${habit_context.streak_current}
Framgångsgrad: ${habit_context.success_rate}%
Senaste genomförande: ${habit_context.completion_history?.length || 0} totalt
` : 'Ingen specifik vana - allmänt motivationsproblem'}

${progressData ? `ANVÄNDARENS ÖVERGRIPANDE UTVECKLING:
Nivå: ${progressData.current_level}
XP: ${progressData.current_xp}
Nuvarande streak: ${progressData.current_streak_days}
Total genomförda sessioner: ${progressData.total_sessions_completed}` : ''}

${clientData?.profile_metadata ? `ANVÄNDARKONTEXT:
${JSON.stringify(clientData.profile_metadata, null, 2)}` : ''}

Skapa en personlig återhämtningsplan med:

1. OMEDELBAR ÅTGÄRD (nästa 24h):
   - Specifik, minimal handling för att bryta stillastående
   - Exempel: "Gör bara 1 minut av vanan istället för 10"

2. KORTSIKTIG PLAN (nästa vecka):
   - 3-5 konkreta steg för att återbygga momentum
   - Justering av svårighetsgrad eller frekvens om nödvändigt

3. MILJÖFÖRÄNDRINGAR:
   - Konkreta ändringar i omgivning eller rutiner
   - Nya cues eller påminnelser

4. MOTIVATIONS-BOOST:
   - Återanknytning till ursprungliga mål
   - Nya belöningar eller accountability-system

5. FÖREBYGGANDE ÅTGÄRDER:
   - Strategier för att undvika liknande setbacks i framtiden

Var empatisk, uppmuntrande och fokusera på neuroplasticiteten - hjärnan kan läka och anpassa sig! Använd konkreta exempel och undvik allmänna råd.

Svara på svenska med varm, stöttande ton.`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 1000,
      temperature: 0.7
    });

    if (!aiResponse.success) {
      throw new Error('AI recovery plan generation failed: ' + aiResponse.error);
    }

    const recoveryPlan = aiResponse.content;

    // Create path entry with recovery plan
    const pathEntryData = {
      client_id,
      type: 'recommendation',
      title: '🔄 Återhämtningsplan från Stefan',
      details: `Personlig plan för att komma tillbaka efter ${setback_event.setback_type}`,
      content: recoveryPlan,
      status: 'completed',
      ai_generated: true,
      created_by: supabaseKey,
      visible_to_client: true,
      created_by_role: 'system',
      metadata: {
        recovery_plan: true,
        setback_type: setback_event.setback_type,
        severity: setback_event.severity,
        habit_id: habit_context?.id || null,
        generated_from: 'habit_recovery_planner',
        plan_type: determineRecoveryPlanType(setback_event.setback_type)
      }
    };

    await supabase
      .from('path_entries')
      .insert(pathEntryData);

    // If habit exists, create adjustment recommendation
    if (habit_context) {
      await createHabitAdjustmentRecommendation(supabase, client_id, habit_context, setback_event, recoveryPlan);
    }

    console.log('Recovery plan created successfully');

    return new Response(JSON.stringify({
      success: true,
      recovery_plan: recoveryPlan,
      plan_type: determineRecoveryPlanType(setback_event.setback_type),
      estimated_recovery_days: estimateRecoveryTime(setback_event),
      model_used: aiResponse.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habit-recovery-planner:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function determineRecoveryPlanType(setbackType: string): string {
  switch (setbackType) {
    case 'missed_days': return 'gentle_restart';
    case 'low_motivation': return 'motivation_boost';
    case 'external_disruption': return 'context_change';
    case 'difficulty_spike': return 'difficulty_reduction';
    case 'life_change': return 'complete_redesign';
    default: return 'gentle_restart';
  }
}

function estimateRecoveryTime(setbackEvent: any): number {
  const baseDays = {
    'minor': 3,
    'moderate': 7,
    'major': 14
  }[setbackEvent.severity] || 7;

  // Adjust based on context
  const contextMultiplier = setbackEvent.context?.days_missed 
    ? Math.min(setbackEvent.context.days_missed * 0.3, 2) 
    : 1;

  return Math.round(baseDays * contextMultiplier);
}

async function createHabitAdjustmentRecommendation(
  supabase: any, 
  clientId: string, 
  habit: any, 
  setbackEvent: any, 
  recoveryPlan: string
): Promise<void> {
  let adjustmentType = 'difficulty_decrease';
  let newValue = habit.difficulty;
  let reason = 'Automatically adjusted due to setback detection';

  // Determine appropriate adjustment
  switch (setbackEvent.setback_type) {
    case 'difficulty_spike':
      adjustmentType = 'difficulty_decrease';
      newValue = decreaseDifficulty(habit.difficulty);
      reason = 'Reduced difficulty to rebuild confidence and consistency';
      break;
    case 'missed_days':
      adjustmentType = 'frequency_change';
      newValue = 'reduced_frequency';
      reason = 'Temporarily reduced frequency to focus on consistency';
      break;
    case 'external_disruption':
      adjustmentType = 'context_change';
      newValue = 'flexible_timing';
      reason = 'Made timing more flexible to adapt to new circumstances';
      break;
  }

  // Create adjustment recommendation in path_entries
  await supabase
    .from('path_entries')
    .insert({
      client_id: clientId,
      type: 'action',
      title: `⚙️ Vanajustering rekommenderad`,
      details: `Stefan föreslår: ${adjustmentType.replace('_', ' ')} för ${habit.title}`,
      content: `Baserat på återhämtningsplanen rekommenderar Stefan följande justering:\n\n${reason}\n\nFörändring: ${habit.current_commitment} → ${newValue}`,
      status: 'planned',
      ai_generated: true,
      created_by: clientId,
      visible_to_client: true,
      metadata: {
        habit_adjustment: true,
        habit_id: habit.id,
        adjustment_type: adjustmentType,
        previous_value: habit.current_commitment || habit.difficulty,
        new_value: newValue,
        reason,
        ai_confidence: 0.8,
        generated_from_recovery: true
      }
    });
}

function decreaseDifficulty(currentDifficulty: string): string {
  const difficultyLevels = ['micro', 'small', 'medium', 'large', 'challenging'];
  const currentIndex = difficultyLevels.indexOf(currentDifficulty);
  
  if (currentIndex <= 0) return 'micro';
  return difficultyLevels[currentIndex - 1];
}