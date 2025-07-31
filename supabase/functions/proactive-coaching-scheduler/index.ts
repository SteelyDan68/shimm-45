import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoachingRequest {
  client_id: string;
  trigger_event: 'daily_check_in' | 'streak_warning' | 'achievement_earned' | 'low_engagement' | 'progress_milestone';
  check_in_data?: any;
  context_data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_id, trigger_event, check_in_data, context_data } = await req.json() as CoachingRequest;

    console.log('Processing proactive coaching for client:', client_id, 'Event:', trigger_event);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client profile and progress data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('name, profile_metadata, custom_fields')
      .eq('id', client_id)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
      throw clientError;
    }

    const progressData = (clientData?.custom_fields as any)?.progress_data;
    const profileData = clientData?.profile_metadata;

    // Generate contextual coaching message based on trigger event
    let coachingMessage = '';
    let interactionType = 'insight';
    let priority = 'medium';

    switch (trigger_event) {
      case 'daily_check_in':
        coachingMessage = await generateCheckInResponse(check_in_data, profileData, progressData);
        interactionType = 'check_in_response';
        priority = 'high';
        break;
        
      case 'streak_warning':
        coachingMessage = await generateStreakWarning(progressData, profileData);
        interactionType = 'reminder';
        priority = 'high';
        break;
        
      case 'achievement_earned':
        coachingMessage = await generateAchievementCelebration(context_data, profileData);
        interactionType = 'celebration';
        priority = 'medium';
        break;
        
      case 'low_engagement':
        coachingMessage = await generateReEngagementMessage(progressData, profileData);
        interactionType = 'reminder';
        priority = 'high';
        break;
        
      case 'progress_milestone':
        coachingMessage = await generateProgressInsight(progressData, profileData);
        interactionType = 'insight';
        priority = 'medium';
        break;
    }

    // Create path entry with the coaching interaction
    const pathEntryData = {
      client_id,
      type: 'recommendation',
      title: getCoachingTitle(trigger_event),
      details: 'Stefan har analyserat din utveckling',
      content: coachingMessage,
      status: 'completed',
      ai_generated: true,
      created_by: supabaseKey,
      visible_to_client: true,
      created_by_role: 'system',
      metadata: {
        coaching_type: interactionType,
        trigger_event,
        priority,
        generated_from: 'proactive_coaching',
        check_in_data: check_in_data || null
      }
    };

    await supabase
      .from('path_entries')
      .insert(pathEntryData);

    console.log('Proactive coaching message created successfully');

    return new Response(JSON.stringify({
      success: true,
      message: coachingMessage,
      interaction_type: interactionType,
      priority
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in proactive-coaching-scheduler:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateCheckInResponse(checkInData: any, profileData: any, progressData: any): Promise<string> {
  const systemPrompt = `Du är Stefan, en empatisk AI-coach som hjälper människor utvecklas genom neuroplasticitet och de fem pelarna: Self Care, Skills, Talent, Brand, Economy.

Du har just fått en daglig check-in från en användare. Ge en personlig, uppmuntrande och konkret coaching-respons baserat på deras svar.

Principer:
- Var empatisk och stöttande, inte dömande
- Ge konkreta, genomförbara råd för dagen
- Fokusera på neuroplasticitet - små steg leder till stora förändringar
- Anpassa råden till användarens specifika situation och mål
- Var positiv men realistisk`;

  const userPrompt = `Användaren har genomfört sin dagliga check-in:

DAGENS CHECK-IN:
- Humör: ${checkInData.mood_score}/10
- Energi: ${checkInData.energy_level}/10  
- Stress: ${checkInData.stress_level}/10
- Motivation: ${checkInData.motivation_level}/10
- Fokuspelare: ${checkInData.pillar_focus}
- Daglig intention: ${checkInData.daily_intention || 'Inget specifikt mål'}
- Reflektion: ${checkInData.reflection_notes || 'Ingen reflektion'}

${progressData ? `FRAMSTEGSDATA:
- Nuvarande nivå: ${progressData.current_level}
- XP: ${progressData.current_xp}
- Streak: ${progressData.current_streak_days} dagar` : ''}

${profileData ? `ANVÄNDARKONTEXT:
${JSON.stringify(profileData, null, 2)}` : ''}

Ge en personlig coaching-respons (max 200 ord) som:
1. Erkänner deras känslor och situation
2. Ger konkreta råd för ${checkInData.pillar_focus}-pelaren idag
3. Föreslår små, genomförbara steg
4. Är uppmuntrande och motiverande

Svara på svenska med varmt och stöttande tonfall.`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    maxTokens: 300,
    temperature: 0.8
  });

  return aiResponse.success ? aiResponse.content : 'Tack för din check-in! Fortsätt med det fina arbetet du gör för din utveckling.';
}

async function generateStreakWarning(progressData: any, profileData: any): Promise<string> {
  return `Hej! 👋 Jag märkte att din utvecklingsstreak kan vara i fara. Du har byggt upp ${progressData?.current_streak_days || 0} dagar i rad - det är fantastiskt! 

För att behålla din momentum, varför inte göra en snabb 2-minuters check-in idag? Små konstanta steg är nyckeln till neuroplasticitet och varaktig förändring.

Vad säger du - kan vi hålla din streak vid liv? 💪`;
}

async function generateAchievementCelebration(achievementData: any, profileData: any): Promise<string> {
  return `🎉 Fantastiskt! Du har just låst upp en ny prestationsutmärkelse! 

Detta visar att du verkligen har tagit tag i din utveckling. Varje liten framsteg bygger på den förra och skapar nya neurala banor i din hjärna.

Fortsätt så här - du är på helt rätt väg! Vad blir ditt nästa mål? 🌟`;
}

async function generateReEngagementMessage(progressData: any, profileData: any): Promise<string> {
  return `Hej igen! 👋 

Jag har inte hört från dig på ett tag och undrar hur det går. Ibland behöver vi alla en paus, och det är helt okej.

När du känner dig redo att fortsätta din utvecklingsresa, så är jag här. Även de minsta stegen framåt gör skillnad - en check-in, en reflektion, eller bara att läsa dina tidigare framsteg.

Vad säger du om att börja mjukt igen? 🌱`;
}

async function generateProgressInsight(progressData: any, profileData: any): Promise<string> {
  return `💡 Utvecklingsinsikt:

Jag har analyserat din utveckling och ser fantastiska framsteg! Du visar verkligen hur neuroplasticitet fungerar - genom konsekventa små steg bygger du nya vanor och förmågor.

Baserat på dina mönster skulle jag föreslå att du fokuserar lite extra på [specifik rekommendation baserat på data]. Detta kan hjälpa dig att ta nästa steg i din utvecklingsresa.

Fortsätt det fina arbetet! 🚀`;
}

function getCoachingTitle(triggerEvent: string): string {
  switch (triggerEvent) {
    case 'daily_check_in': return 'Stefans respons på din check-in';
    case 'streak_warning': return 'Håll din streak vid liv!';
    case 'achievement_earned': return 'Grattis till din prestationsutmärkelse!';
    case 'low_engagement': return 'Välkommen tillbaka!';
    case 'progress_milestone': return 'Utvecklingsinsikt från Stefan';
    default: return 'Meddelande från Stefan';
  }
}