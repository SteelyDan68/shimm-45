import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, context, sessionType, userId, duration } = await req.json();

    switch (action) {
      case 'analyze_and_recommend':
        return await analyzeAndRecommend(supabase, user.id, context, sessionType);
      
      case 'generate_plan':
        return await generateCoachingPlan(supabase, user.id, duration || 30);
      
      case 'adaptive_recommendations':
        return await getAdaptiveRecommendations(supabase, user.id, context);
      
      case 'log_implementation':
        return await logImplementation(supabase, userId, context);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in advanced-ai-coaching function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeAndRecommend(supabase: any, userId: string, context: any, sessionType: string) {
  console.log('Analyzing user context for coaching recommendations...');
  
  // Hämta användarens historik och data
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: recentSessions } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: pillarAssessments } = await supabase
    .from('pillar_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: pathEntries } = await supabase
    .from('path_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Bygg AI-prompt baserat på användardata
  const aiPrompt = buildCoachingPrompt(userProfile, recentSessions, pillarAssessments, pathEntries, sessionType);

  // Anropa OpenAI för AI-analys
  const recommendations = await generateAIRecommendations(aiPrompt, sessionType);

  // Skapa session i databasen
  const { data: session, error: sessionError } = await supabase
    .from('coaching_sessions')
    .insert({
      user_id: userId,
      session_type: sessionType,
      context_data: context,
      ai_analysis: recommendations.analysis,
      status: 'active'
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // Spara rekommendationer i databasen
  const recommendationRecords = recommendations.recommendations.map((rec: any) => ({
    session_id: session.id,
    user_id: userId,
    recommendation_type: rec.type,
    title: rec.title,
    description: rec.description,
    reasoning: rec.reasoning,
    priority: rec.priority,
    category: rec.category,
    estimated_time_minutes: rec.estimatedTime,
    difficulty: rec.difficulty,
    expected_outcome: rec.expectedOutcome,
    success_metrics: rec.metrics || [],
    resources: rec.resources || [],
    dependencies: rec.dependencies || []
  }));

  const { data: savedRecommendations } = await supabase
    .from('ai_coaching_recommendations')
    .insert(recommendationRecords)
    .select();

  // Logga GDPR-aktivitet
  await supabase.from('gdpr_audit_log').insert({
    user_id: userId,
    action: 'ai_coaching_session_created',
    details: {
      session_id: session.id,
      session_type: sessionType,
      recommendations_count: savedRecommendations?.length || 0
    }
  });

  return new Response(JSON.stringify({
    session,
    recommendations: savedRecommendations,
    analysis: recommendations.analysis
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateCoachingPlan(supabase: any, userId: string, duration: number) {
  console.log('Generating personalized coaching plan...');

  // Hämta användardata för planering
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: assessments } = await supabase
    .from('pillar_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const { data: recentRecommendations } = await supabase
    .from('ai_coaching_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('implementation_date', { ascending: false })
    .limit(10);

  // Generera AI-plan
  const planPrompt = buildPlanningPrompt(userProfile, assessments, recentRecommendations, duration);
  const aiPlan = await generateAIPlan(planPrompt, duration);

  // Spara plan i databasen
  const { data: plan, error: planError } = await supabase
    .from('coaching_plans')
    .insert({
      user_id: userId,
      title: aiPlan.title,
      description: aiPlan.description,
      duration_days: duration,
      focus_areas: aiPlan.focusAreas,
      ai_generation_context: {
        user_profile_summary: userProfile ? {
          experience_level: 'intermediate', // Anpassa baserat på data
          preferred_learning_style: 'mixed',
          main_challenges: aiPlan.challenges
        } : null,
        assessment_insights: assessments?.slice(0, 3) || [],
        generation_timestamp: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (planError) throw planError;

  // Skapa milstolpar
  const milestones = aiPlan.milestones.map((milestone: any) => ({
    plan_id: plan.id,
    milestone_date: milestone.date,
    title: milestone.title,
    description: milestone.description,
    success_criteria: milestone.successCriteria
  }));

  const { data: savedMilestones } = await supabase
    .from('coaching_milestones')
    .insert(milestones)
    .select();

  // Logga aktivitet
  await supabase.from('coaching_progress_entries').insert({
    user_id: userId,
    plan_id: plan.id,
    entry_type: 'plan_created',
    title: 'Ny coaching-plan skapad',
    description: `${duration}-dagars plan med fokus på: ${aiPlan.focusAreas.join(', ')}`,
    metadata: {
      focus_areas: aiPlan.focusAreas,
      duration_days: duration,
      milestones_count: milestones.length
    }
  });

  return new Response(JSON.stringify({
    plan: {
      ...plan,
      milestones: savedMilestones,
      weeklyGoals: aiPlan.weeklyGoals
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAdaptiveRecommendations(supabase: any, userId: string, sessionHistory: any[]) {
  console.log('Generating adaptive recommendations based on user progress...');

  // Analysera användarens patterns och framsteg
  const { data: completedRecommendations } = await supabase
    .from('ai_coaching_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('implementation_date', { ascending: false })
    .limit(20);

  const { data: currentPlan } = await supabase
    .from('coaching_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Generera adaptiva rekommendationer
  const adaptivePrompt = buildAdaptivePrompt(sessionHistory, completedRecommendations, currentPlan);
  const adaptiveRecommendations = await generateAdaptiveRecommendations(adaptivePrompt);

  return new Response(JSON.stringify({
    recommendations: adaptiveRecommendations
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function logImplementation(supabase: any, userId: string, context: any) {
  // Logga implementering för framtida adaptivt lärande
  await supabase.from('coaching_analytics').insert({
    user_id: userId,
    metric_type: 'recommendation_implementation',
    metric_value: 1,
    metric_data: context
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildCoachingPrompt(userProfile: any, recentSessions: any[], pillarAssessments: any[], pathEntries: any[], sessionType: string) {
  const contextSummary = {
    user_background: userProfile ? {
      challenges: userProfile.challenges || 'Inga specifika utmaningar noterade',
      goals: userProfile.custom_fields?.goals || 'Inga specifika mål noterade',
      experience_level: 'Medel' // Anpassa baserat på data
    } : 'Begränsad användardata tillgänglig',
    recent_activity: pathEntries?.slice(0, 5) || [],
    assessment_results: pillarAssessments?.slice(0, 2) || [],
    session_history_summary: recentSessions?.length > 0 ? 
      `Användaren har ${recentSessions.length} tidigare sessioner` : 'Första session'
  };

  return `Som expert AI-coach med specialisering inom neuroplasticitet, beteendevetenskap och pedagogik, analysera följande användarkontext och generera personaliserade rekommendationer.

ANVÄNDARKONTEXT:
${JSON.stringify(contextSummary, null, 2)}

SESSIONTYP: ${sessionType}

INSTRUKTIONER:
1. Analysera användarens nuvarande situation utifrån neuroplasticitets-principer
2. Identifiera specifika utvecklingsmöjligheter baserat på beteendevetenskaplig forskning  
3. Skapa konkreta, mätbara rekommendationer som är pedagogiskt välstrukturerade
4. Prioritera utifrån användarens kapacitet och motivation
5. Inkludera både kortsiktiga (1-2 veckor) och längre (1-3 månader) mål

SVARA MED:
{
  "analysis": "Detaljerad analys av användarens situation och behov (2-3 meningar)",
  "recommendations": [
    {
      "type": "action|reflection|learning|habit|goal",
      "title": "Kort, actionabel titel",
      "description": "Detaljerad beskrivning av rekommendationen",
      "reasoning": "Varför denna rekommendation är relevant (neuroplasticitet/beteendevetenskap)",
      "priority": "low|medium|high|urgent",
      "category": "Självvård|Kompetensutveckling|Målsättning|Relationer|etc",
      "estimatedTime": number (minuter),
      "difficulty": "easy|medium|hard",
      "expectedOutcome": "Förväntat resultat",
      "metrics": ["mätbara indikatorer"],
      "resources": [{"type": "article|video|exercise", "title": "Resurs titel", "content": "Kort beskrivning"}]
    }
  ]
}

Fokusera på evidensbaserade metoder och skapa 3-5 högkvalitativa rekommendationer.`;
}

function buildPlanningPrompt(userProfile: any, assessments: any[], completedRecommendations: any[], duration: number) {
  return `Som expert utvecklingsplanerare, skapa en personaliserad ${duration}-dagars coaching-plan.

ANVÄNDARDATA:
- Profil: ${JSON.stringify(userProfile?.custom_fields || {}, null, 2)}
- Bedömningar: ${assessments?.slice(0, 3) || []}
- Genomförda rekommendationer: ${completedRecommendations?.length || 0}

Skapa en strukturerad plan med:
- Tydliga fokusområden
- Veckovisa mål och aktiviteter  
- Milstolpar med framstegsmätning
- Anpassning baserat på användarens kapacitet

SVARA MED JSON-struktur för coaching-plan.`;
}

function buildAdaptivePrompt(sessionHistory: any[], completedRecommendations: any[], currentPlan: any) {
  return `Analysera användarens framsteg och generera adaptiva rekommendationer:

SESSIONSHISTORIK: ${JSON.stringify(sessionHistory)}
GENOMFÖRDA REKOMMENDATIONER: ${JSON.stringify(completedRecommendations?.slice(0, 5))}
NUVARANDE PLAN: ${JSON.stringify(currentPlan)}

Generera 2-3 adaptiva rekommendationer baserat på patterns och framsteg.`;
}

async function generateAIRecommendations(prompt: string, sessionType: string) {
  if (!openAIApiKey) {
    return generateFallbackRecommendations(sessionType);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du är en expert AI-coach specialiserad på neuroplasticitet, beteendevetenskap och pedagogik. Svara alltid på svenska med välstrukturerad JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return generateFallbackRecommendations(sessionType);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackRecommendations(sessionType);
  }
}

async function generateAIPlan(prompt: string, duration: number) {
  // Förenklad AI-plan generation med fallback
  const weeks = Math.ceil(duration / 7);
  
  return {
    title: `${duration}-dagars personlig utvecklingsplan`,
    description: 'AI-genererad plan baserad på dina behov och mål',
    focusAreas: ['Självvård', 'Kompetensutveckling', 'Målsättning'],
    challenges: ['Tidshantering', 'Motivation', 'Balans'],
    weeklyGoals: Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      goals: [
        `Vecka ${i + 1}: Etablera grundläggande rutiner`,
        `Utveckla specifika färdigheter inom fokusområdet`
      ],
      activities: [
        {
          type: 'habit',
          title: 'Daglig reflektion',
          estimatedTime: 10,
          description: 'Reflektion över dagens framsteg och utmaningar'
        }
      ]
    })),
    milestones: [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Första veckans genomförande',
        description: 'Etablera grundläggande rutiner och tracking',
        successCriteria: ['Daglig aktivitet', 'Reflektion genomförd']
      }
    ]
  };
}

async function generateAdaptiveRecommendations(prompt: string) {
  // Förenklad adaptiv generering
  return [
    {
      type: 'reflection',
      title: 'Utvärdera senaste veckans framsteg',
      description: 'Reflektera över vad som fungerat bra och vad som kan förbättras',
      priority: 'medium',
      estimatedTime: 15
    }
  ];
}

function generateFallbackRecommendations(sessionType: string) {
  const baseRecommendations = {
    assessment: [
      {
        type: 'reflection',
        title: 'Identifiera dina utvecklingsområden',
        description: 'Ta 15 minuter för att reflektera över vilka områden i ditt liv som du vill utveckla mest.',
        reasoning: 'Självreflektion är första steget för att skapa medvetenhet om nuvarande situation.',
        priority: 'high',
        category: 'Personlig utveckling',
        estimatedTime: 15,
        difficulty: 'easy',
        expectedOutcome: 'Klarhet över prioriterade utvecklingsområden',
        metrics: ['Identifierade fokusområden', 'Motivation för förändring'],
        resources: []
      }
    ],
    planning: [
      {
        type: 'action',
        title: 'Sätt upp SMART-mål',
        description: 'Definiera 2-3 specifika, mätbara mål för de närmaste veckorna.',
        reasoning: 'SMART-mål ökar sannolikheten för framgång genom tydlighet och mätbarhet.',
        priority: 'high',
        category: 'Målsättning',
        estimatedTime: 30,
        difficulty: 'medium',
        expectedOutcome: 'Tydliga, actionabla mål',
        metrics: ['Antal definierade mål', 'Specificitetsgrad'],
        resources: []
      }
    ]
  };

  return {
    analysis: `Baserat på sessiontypen ${sessionType} fokuserar vi på att skapa struktur och tydlighet i din utvecklingsprocess.`,
    recommendations: baseRecommendations[sessionType as keyof typeof baseRecommendations] || baseRecommendations.assessment
  };
}