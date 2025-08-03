import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Unified AI request interface
interface UnifiedAIRequest {
  action: 'stefan_chat' | 'coaching_analysis' | 'assessment_analysis' | 'message_assistant' | 'planning_generation' | 'habit_analysis';
  data: any;
  context?: {
    userId?: string;
    clientId?: string;
    sessionId?: string;
    language?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

// Unified AI response interface
interface UnifiedAIResponse {
  success: boolean;
  data?: any;
  error?: string;
  aiModel: string;
  processingTime: number;
  tokens?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check AI service availability
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Inga AI-tjänster tillgängliga',
        aiModel: 'none',
        processingTime: Date.now() - startTime
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: UnifiedAIRequest = await req.json();
    console.log(`AI Orchestrator: Processing ${request.action}`);

    let result: any;

    switch (request.action) {
      case 'stefan_chat':
        result = await handleStefanChat(request, supabase);
        break;
      case 'coaching_analysis':
        result = await handleCoachingAnalysis(request, supabase);
        break;
      case 'assessment_analysis':
        result = await handleAssessmentAnalysis(request, supabase);
        break;
      case 'message_assistant':
        result = await handleMessageAssistant(request, supabase);
        break;
      case 'planning_generation':
        result = await handlePlanningGeneration(request, supabase);
        break;
      case 'habit_analysis':
        result = await handleHabitAnalysis(request, supabase);
        break;
      default:
        throw new Error(`Okänd action: ${request.action}`);
    }

    const response: UnifiedAIResponse = {
      success: true,
      data: result,
      aiModel: availability.primary,
      processingTime: Date.now() - startTime
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Orchestrator error:', error);
    
    const errorResponse: UnifiedAIResponse = {
      success: false,
      error: error.message,
      aiModel: 'none',
      processingTime: Date.now() - startTime
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============= STEFAN CHAT HANDLER =============
async function handleStefanChat(request: UnifiedAIRequest, supabase: any) {
  console.log('Processing Stefan chat request');

  const { message, conversationHistory = [] } = request.data;
  const userId = request.context?.userId;

  // Get user profile and context
  let userContext = '';
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      userContext = `Användarprofil: ${profile.first_name || ''} ${profile.last_name || ''}`;
    }
  }

  // Get Stefan's personality and knowledge
  const stefanPrompt = `Du är Stefan, en erfaren AI-coach med följande egenskaper:

PERSONLIGHET:
- Empatisk och uppmuntrande
- Praktisk och lösningsorienterad
- Använder neuroplastiska principer
- Talar svenska med värme och professionalitet

KUNSKAP:
- Expertis inom coaching och personlig utveckling
- Förståelse för de sex livsområdena (hälsa, relationer, karriär, ekonomi, personlig utveckling, fritid)
- Neuroplastiska principer för vanetransformation
- Motivationspsykologi och beteendeförändring

STIL:
- Ställ följdfrågor för att förstå bättre
- Ge konkreta, handlingsbara råd
- Använd exempel och analogier
- Uppmuntra små steg framåt

${userContext}

Tidigare konversation:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

Svara på användarens meddelande med Stefans personlighet och expertis.`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: stefanPrompt },
    { role: 'user', content: message }
  ], {
    maxTokens: 800,
    temperature: 0.8,
    model: 'gpt-4.1-2025-04-14'
  });

  if (!aiResponse.success) {
    throw new Error('Stefan AI kunde inte generera svar: ' + aiResponse.error);
  }

  // Store interaction
  if (userId) {
    await supabase.from('stefan_interactions').insert([{
      user_id: userId,
      message: message,
      response: aiResponse.content,
      created_at: new Date().toISOString(),
      metadata: { ai_model: aiResponse.model }
    }]);
  }

  return {
    message: aiResponse.content,
    ai_model: aiResponse.model,
    timestamp: new Date().toISOString()
  };
}

// ============= COACHING ANALYSIS HANDLER =============
async function handleCoachingAnalysis(request: UnifiedAIRequest, supabase: any) {
  console.log('Processing coaching analysis request');

  const { sessionType, userContext, assessmentData } = request.data;
  const userId = request.context?.userId;

  // Get user profile and historical data
  let userProfile = {};
  let historicalSessions = [];

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: sessions } = await supabase
      .from('coaching_sessions')
      .select('*, ai_coaching_recommendations(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    userProfile = profile || {};
    historicalSessions = sessions || [];
  }

  const coachingPrompt = `Du är en AI-coaching specialist som analyserar användardata och skapar personaliserade rekommendationer.

SESSION TYP: ${sessionType}

ANVÄNDARKONTEXT:
${JSON.stringify(userContext, null, 2)}

ASSESSMENTDATA:
${JSON.stringify(assessmentData, null, 2)}

HISTORISKA SESSIONER:
${historicalSessions.map(s => `- ${s.session_type}: ${s.ai_coaching_recommendations?.length || 0} rekommendationer`).join('\n')}

UPPGIFT:
Skapa 3-5 konkreta, handlingsbara rekommendationer baserat på data. Varje rekommendation ska ha:
- Tydlig titel
- Detaljerad beskrivning
- Praktiska steg
- Tidsram för genomförande
- Svårighetsgrad (1-5)
- Prioritet (high/medium/low)
- Kategori

Svara med JSON-format:
{
  "analysis": "Övergripande analys av situationen",
  "recommendations": [
    {
      "title": "Titel på rekommendation",
      "description": "Detaljerad beskrivning",
      "actionSteps": ["Steg 1", "Steg 2", "Steg 3"],
      "timeframe": "1-2 veckor",
      "difficulty": 3,
      "priority": "high",
      "category": "self_care"
    }
  ],
  "nextSteps": "Vad användaren bör fokusera på näst"
}`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: coachingPrompt }
  ], {
    maxTokens: 1200,
    temperature: 0.7,
    model: 'gpt-4.1-2025-04-14'
  });

  if (!aiResponse.success) {
    throw new Error('Coaching analys misslyckades: ' + aiResponse.error);
  }

  let analysisResult;
  try {
    analysisResult = JSON.parse(aiResponse.content);
  } catch (error) {
    // Fallback om JSON parsing misslyckas
    analysisResult = {
      analysis: aiResponse.content,
      recommendations: [],
      nextSteps: "Fortsätt med regelbunden self-care och reflektion."
    };
  }

  return {
    analysis: analysisResult,
    ai_model: aiResponse.model,
    timestamp: new Date().toISOString()
  };
}

// ============= ASSESSMENT ANALYSIS HANDLER =============
async function handleAssessmentAnalysis(request: UnifiedAIRequest, supabase: any) {
  console.log('Processing assessment analysis request');

  const { assessmentType, scores, responses, pillarKey } = request.data;
  const userId = request.context?.userId;

  // Get user context
  let userContext = '';
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      userContext = `Användare: ${profile.first_name || ''} ${profile.last_name || ''}`;
    }
  }

  const assessmentPrompt = `Du är en expert på personlighetsbedömning och coaching som analyserar assessments.

ASSESSMENT TYP: ${assessmentType}
PILLAR OMRÅDE: ${pillarKey || 'Allmänt'}

RESULTAT:
Scores: ${JSON.stringify(scores, null, 2)}
Svar: ${JSON.stringify(responses, null, 2)}

${userContext}

UPPGIFT:
Analysera resultaten och skapa:
1. Övergripande bedömning av styrkor och utvecklingsområden
2. Specifika insikter baserat på svaren
3. Konkreta handlingsplan med 3-5 rekommendationer
4. Motiverande budskap för fortsatt utveckling

Fokusera på:
- Neuroplastiska principer
- Små, genomförbara steg
- Positiv psykologi
- Praktisk tillämpning

Svara på svenska med struktur och tydlighet.`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: assessmentPrompt }
  ], {
    maxTokens: 1000,
    temperature: 0.7,
    model: 'gpt-4.1-2025-04-14'
  });

  if (!aiResponse.success) {
    throw new Error('Assessment analys misslyckades: ' + aiResponse.error);
  }

  return {
    analysis: aiResponse.content,
    scores: scores,
    pillar_key: pillarKey,
    ai_model: aiResponse.model,
    timestamp: new Date().toISOString()
  };
}

// ============= MESSAGE ASSISTANT HANDLER =============
async function handleMessageAssistant(request: UnifiedAIRequest, supabase: any) {
  console.log('Processing message assistant request');

  const { messageContent, senderName, context } = request.data;

  const messagePrompt = `Du är en hjälpsam coach-assistent som hjälper till att svara på meddelanden från klienter. 
Du ska vara professionell, empatisk och uppmuntrande. Svara på svenska.

Kontext: ${context || 'Allmän coaching-konversation'}
Meddelande från: ${senderName}

Skapa ett passande svar som är:
- Professionellt men vänligt
- Uppmuntrande och stödjande
- Konkret och hjälpsamt
- Anpassat till coaching-miljön

Håll svaret kort och fokuserat (max 200 ord).`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: messagePrompt },
    { role: 'user', content: messageContent }
  ], {
    maxTokens: 300,
    temperature: 0.7,
    model: 'gpt-4.1-2025-04-14'
  });

  if (!aiResponse.success) {
    throw new Error('Message assistant misslyckades: ' + aiResponse.error);
  }

  return {
    suggestion: aiResponse.content,
    ai_model: aiResponse.model,
    timestamp: new Date().toISOString()
  };
}

// ============= PLANNING GENERATION HANDLER =============
async function handlePlanningGeneration(request: UnifiedAIRequest, supabase: any) {
  console.log('Processing planning generation request');

  const { goals, preferences, constraints, timeframe } = request.data;
  const userId = request.context?.userId;

  // Get user profile for context
  let userProfile = {};
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    userProfile = profile || {};
  }

  const planningPrompt = `Du är Stefan, en AI-coach som skapar autonoma utvecklingsplaner baserat på neuroplastiska principer.

MÅLSÄTTNINGAR:
${JSON.stringify(goals, null, 2)}

PREFERENSER:
${JSON.stringify(preferences, null, 2)}

BEGRÄNSNINGAR:
${JSON.stringify(constraints, null, 2)}

TIDSRAM: ${timeframe || '4 veckor'}

ANVÄNDARKONTEXT:
${JSON.stringify(userProfile, null, 2)}

UPPGIFT:
Skapa en detaljerad utvecklingsplan som innehåller:

1. VECKOSTRUKTUR med specifika aktiviteter
2. NEUROPLASTISKA PRINCIPER (21-66 dagars cykler, micro-habits)
3. PROGRESSIVA STEG från enkelt till komplext
4. MÄTBARA MILSTOLPAR
5. ÅTERHÄMTNINGSSTRATEGIER vid motgångar

Strukturera som JSON:
{
  "planTitle": "Titel på planen",
  "overview": "Översikt av planen",
  "duration": "antal veckor",
  "weeklyStructure": [
    {
      "week": 1,
      "focus": "Grundläggande rutiner",
      "activities": ["Aktivitet 1", "Aktivitet 2"],
      "milestones": ["Milstolpe 1"]
    }
  ],
  "dailyHabits": ["Habit 1", "Habit 2"],
  "recoveryStrategies": ["Strategi 1", "Strategi 2"]
}`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: planningPrompt }
  ], {
    maxTokens: 1500,
    temperature: 0.7,
    model: 'gpt-4.1-2025-04-14'
  });

  if (!aiResponse.success) {
    throw new Error('Planning generation misslyckades: ' + aiResponse.error);
  }

  let planResult;
  try {
    planResult = JSON.parse(aiResponse.content);
  } catch (error) {
    // Fallback om JSON parsing misslyckas
    planResult = {
      planTitle: "Personlig utvecklingsplan",
      overview: aiResponse.content,
      duration: timeframe || "4 veckor",
      weeklyStructure: [],
      dailyHabits: [],
      recoveryStrategies: []
    };
  }

  return {
    plan: planResult,
    ai_model: aiResponse.model,
    timestamp: new Date().toISOString()
  };
}

// ============= HABIT ANALYSIS HANDLER =============
async function handleHabitAnalysis(request: UnifiedAIRequest, supabase: any) {
  console.log('Processing habit analysis request');

  const { habitData, patterns, challenges } = request.data;
  const userId = request.context?.userId;

  const habitPrompt = `Du är en expert på vanetransformation och neuroplasticitet som analyserar användarens habitdata.

HABITDATA:
${JSON.stringify(habitData, null, 2)}

MÖNSTER:
${JSON.stringify(patterns, null, 2)}

UTMANINGAR:
${JSON.stringify(challenges, null, 2)}

UPPGIFT:
Analysera data och skapa:
1. Identifiering av framgångsrika mönster
2. Analys av hinder och utmaningar
3. Neuroplastiska rekommendationer för förbättring
4. Konkret återhämtningsplan för svåra perioder
5. Micro-habits för fortsatt framsteg

Fokusera på:
- 21-66 dagars neuroplastiska cykler
- Habit stacking tekniker
- Dopamin-feedback loops
- Progressive complexity
- Sustainable transformation

Svara på svenska med konkreta, vetenskapligt baserade råd.`;

  const aiResponse = await aiService.generateResponse([
    { role: 'system', content: habitPrompt }
  ], {
    maxTokens: 1000,
    temperature: 0.7,
    model: 'gpt-4.1-2025-04-14'
  });

  if (!aiResponse.success) {
    throw new Error('Habit analysis misslyckades: ' + aiResponse.error);
  }

  return {
    analysis: aiResponse.content,
    patterns: patterns,
    ai_model: aiResponse.model,
    timestamp: new Date().toISOString()
  };
}