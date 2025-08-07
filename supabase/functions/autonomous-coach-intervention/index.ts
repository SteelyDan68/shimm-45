import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface InterventionRequest {
  trigger: any;
  user_id: string;
}

interface InterventionResponse {
  intervention: {
    type: string;
    priority: string;
    message: string;
    action_points: string[];
    estimated_impact: string;
  };
  action_taken: string;
  requires_human_intervention: boolean;
  user_notification?: {
    title: string;
    description: string;
    variant: string;
  };
  insight_title?: string;
  insight_description?: string;
  priority?: string;
  recommended_actions?: string[];
  expires_at?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { trigger, user_id }: InterventionRequest = await req.json();

    // Hämta användarens kontext och historik
    const { data: userData } = await supabaseClient
      .from('user_journey_tracking')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const { data: recentAssessments } = await supabaseClient
      .from('assessment_states')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Generera intervention baserat på trigger-typ
    let intervention: InterventionResponse;

    switch (trigger.trigger_type) {
      case 'engagement_drop':
        intervention = await generateEngagementIntervention(trigger, userData, recentAssessments);
        break;
      case 'progress_stalled':
        intervention = await generateProgressIntervention(trigger, userData, recentAssessments);
        break;
      case 'assessment_abandoned':
        intervention = await generateAssessmentIntervention(trigger, userData, recentAssessments);
        break;
      default:
        intervention = await generateGenericIntervention(trigger, userData, recentAssessments);
    }

    // Logga intervention i GDPR-kompatibel audit trail
    await supabaseClient.from('gdpr_audit_log').insert({
      user_id: user_id,
      action: 'ai_intervention_generated',
      details: {
        trigger_type: trigger.trigger_type,
        intervention_type: intervention.intervention.type,
        priority: intervention.intervention.priority,
        requires_human: intervention.requires_human_intervention
      },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent')
    });

    return new Response(
      JSON.stringify(intervention),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in autonomous coach intervention:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function generateEngagementIntervention(trigger: any, userData: any, assessments: any[]): Promise<InterventionResponse> {
  const hoursInactive = trigger.trigger_data.hours_inactive;
  const severity = hoursInactive > 168 ? 'high' : 'medium'; // 1 vecka = hög prio

  return {
    intervention: {
      type: 'engagement_boost',
      priority: severity,
      message: `Du har varit inaktiv i ${Math.floor(hoursInactive)} timmar. Stefan finns här för att hjälpa dig komma tillbaka på spåret.`,
      action_points: [
        'Schemalägg 10 minuter för reflektion idag',
        'Välj en enkel uppgift att börja med',
        'Kontakta Stefan för personlig vägledning'
      ],
      estimated_impact: 'Hög - kan förbättra motivation och återengagemang'
    },
    action_taken: 'Stefan notification sent + gentle re-engagement prompt',
    requires_human_intervention: severity === 'high',
    user_notification: {
      title: '👋 Hej igen!',
      description: 'Stefan har märkt att du varit borta ett tag. Vill du att vi hjälper dig komma igång igen?',
      variant: 'default'
    },
    insight_title: `Klient inaktiv i ${Math.floor(hoursInactive / 24)} dagar`,
    insight_description: `Klienten har varit inaktiv sedan ${new Date(trigger.trigger_data.last_activity).toLocaleDateString('sv-SE')}. Automatisk re-engagement har initierats.`,
    priority: severity,
    recommended_actions: [
      'Skicka personligt meddelande',
      'Erbjud förenklad återstart',
      'Boka uppföljningssamtal om inaktiviteten fortsätter'
    ],
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

async function generateProgressIntervention(trigger: any, userData: any, assessments: any[]): Promise<InterventionResponse> {
  return {
    intervention: {
      type: 'progress_acceleration',
      priority: 'high',
      message: 'Din utveckling har stagnerat. Låt oss hitta nya vägar framåt tillsammans.',
      action_points: [
        'Genomför en snabb statusbedömning',
        'Identifiera eventuella hinder',
        'Sätt upp mindre, mer uppnåeliga mål'
      ],
      estimated_impact: 'Hög - kan låsa upp progression'
    },
    action_taken: 'Progress review triggered + goal reassessment',
    requires_human_intervention: true,
    user_notification: {
      title: '🎯 Utvecklingsmöjlighet',
      description: 'Stefan har identifierat möjligheter att accelerera din utveckling. Vill du se förslaget?',
      variant: 'default'
    },
    insight_title: 'Klient behöver progressionsstöd',
    insight_description: `Endast ${trigger.trigger_data.current_progress}% framsteg på ${trigger.trigger_data.days_since_start} dagar. Föreslår omvärdering av mål och metoder.`,
    priority: 'high',
    recommended_actions: [
      'Gå igenom nuvarande mål och strategier',
      'Identifiera blockerande faktorer',
      'Anpassa förväntningar och tidsramar',
      'Erbjud extra stöd eller resurser'
    ],
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  };
}

async function generateAssessmentIntervention(trigger: any, userData: any, assessments: any[]): Promise<InterventionResponse> {
  return {
    intervention: {
      type: 'assessment_completion_support',
      priority: 'medium',
      message: 'Du har påbörjade bedömningar som väntar. Stefan kan hjälpa dig slutföra dem.',
      action_points: [
        'Återgå till sparade bedömningar',
        'Be Stefan om hjälp med svåra frågor',
        'Dela upp bedömningen i mindre delar'
      ],
      estimated_impact: 'Medium - förbättrar datakompletering'
    },
    action_taken: 'Assessment continuation prompt + guided support',
    requires_human_intervention: false,
    user_notification: {
      title: '📝 Påbörjade bedömningar',
      description: `Du har ${trigger.trigger_data.abandoned_count} påbörjade bedömning(ar). Vill du fortsätta där du slutade?`,
      variant: 'default'
    },
    insight_title: 'Klient har ofullständiga bedömningar',
    insight_description: `${trigger.trigger_data.abandoned_count} bedömningar sedan ${new Date(trigger.trigger_data.oldest_draft).toLocaleDateString('sv-SE')}. Automatisk påminnelse skickad.`,
    priority: 'medium',
    recommended_actions: [
      'Följ upp bedömningsstatus',
      'Erbjud förenklad bedömningsprocess',
      'Kontrollera om frågorna är för komplexa'
    ],
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  };
}

async function generateGenericIntervention(trigger: any, userData: any, assessments: any[]): Promise<InterventionResponse> {
  return {
    intervention: {
      type: 'general_support',
      priority: 'low',
      message: 'Stefan har märkt något i din utvecklingsresa och vill erbjuda stöd.',
      action_points: [
        'Granska din senaste aktivitet',
        'Kontakta Stefan för vägledning',
        'Fortsätt med din nuvarande plan'
      ],
      estimated_impact: 'Medium - förebyggande stöd'
    },
    action_taken: 'General check-in triggered',
    requires_human_intervention: false,
    user_notification: {
      title: '🤗 Stefan checkar in',
      description: 'Hur mår du idag? Stefan är här om du behöver prata.',
      variant: 'default'
    },
    insight_title: 'Allmän check-in med klient',
    insight_description: 'Automatisk check-in baserad på okategoriserad trigger.',
    priority: 'low',
    recommended_actions: [
      'Observera klientens respons',
      'Notera eventuella mönster'
    ],
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}