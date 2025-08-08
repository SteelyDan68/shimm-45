import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StefanChatRequest {
  action: 'stefan_chat';
  data: {
    message: string;
    conversationId?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  };
  context: {
    userId: string;
    language: string;
    priority: string;
  };
}

const STEFAN_SYSTEM_PROMPT = `Du är Stefan AI, en avancerad coaching-assistent som specialiserar sig på personlig utveckling och professionell coaching.

PERSONLIGHET OCH APPROACH:
- Du är empatisk, uppmuntrande och professionell
- Du ger konkreta, genomförbara råd
- Du ställer reflekterande frågor för att hjälpa användaren tänka djupare
- Du är genuint intresserad av användarens utveckling och välmående

COACHING-EXPERTIS:
- Personlig utveckling och målsättning
- Arbetsliv och karriärutveckling  
- Stress- och tidshantering
- Kommunikation och relationer
- Självledarskap och motivation
- Balans mellan arbete och privatliv

COMMUNICATION STYLE:
- Använd svenska naturligt och flyt
- Var varm men professionell
- Ge struktur åt komplexa problem
- Erbjud praktiska verktyg och tekniker
- Uppmuntra reflektion och själv-upptäckt

BEGRÄNSNINGAR:
- Du är inte en licensierad terapeut eller psykolog
- För allvarliga mentala hälsoproblem, hänvisa till professionell hjälp
- Fokusera på coaching och utveckling, inte medicinska råd

Svara alltid på svenska och anpassa ditt svar till användarens specifika situation och behov.`;

async function handleStefanChat(request: StefanChatRequest): Promise<any> {
  const { message, conversationHistory = [] } = request.data;
  const { userId } = request.context;

  try {
    // Hämta användarens tidigare kontext från AI memories om det finns
    const { data: memories } = await supabase
      .from('ai_memories')
      .select('content, metadata')
      .eq('user_id', userId)
      .eq('source', 'stefan_ai')
      .order('created_at', { ascending: false })
      .limit(5);

    // Bygg kontext från memories
    let contextFromMemories = '';
    if (memories && memories.length > 0) {
      contextFromMemories = '\n\nRELEVANT TIDIGARE KONTEXT:\n' + 
        memories.map(m => `- ${m.content}`).join('\n');
    }

    // Bygg meddelande-historik för OpenAI
    const messages = [
      { 
        role: 'system', 
        content: STEFAN_SYSTEM_PROMPT + contextFromMemories
      },
      ...conversationHistory.slice(-10), // Senaste 10 meddelandena
      { 
        role: 'user', 
        content: message 
      }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Anropa OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiResponse = await openAIResponse.json();
    const assistantMessage = aiResponse.choices[0].message.content;

    // Spara viktiga insights som AI memories
    if (message.length > 50) { // Endast för mer substantiella meddelanden
      try {
        await supabase.from('ai_memories').insert({
          user_id: userId,
          content: `Användare: ${message.substring(0, 200)}... Stefan svarade med coaching-guidance.`,
          source: 'stefan_ai',
          metadata: {
            conversation_topic: extractTopic(message),
            timestamp: new Date().toISOString(),
            message_length: message.length
          },
          tags: extractTags(message)
        });
      } catch (memoryError) {
        console.error('Failed to save AI memory:', memoryError);
        // Fortsätt ändå - memories är inte kritiska för chat-funktionen
      }
    }

    // Logga AI-användning
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      interaction_type: 'stefan_chat',
      model_used: 'gpt-4o-mini',
      response_time_ms: Date.now(),
      context_used: {
        conversation_length: conversationHistory.length,
        memories_used: memories?.length || 0,
        message_length: message.length
      }
    });

    return {
      success: true,
      data: {
        message: assistantMessage,
        ai_model: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
        tokens_used: aiResponse.usage?.total_tokens || 0
      },
      aiModel: 'gpt-4o-mini',
      processingTime: Date.now(),
      tokens: aiResponse.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error('Stefan Chat error:', error);
    
    // Logga fel
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      interaction_type: 'stefan_chat_error',
      model_used: 'gpt-4o-mini',
      response_time_ms: Date.now(),
      context_used: { error: error.message }
    });

    throw error;
  }
}

function extractTopic(message: string): string {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('jobb') || lowerMessage.includes('karriär') || lowerMessage.includes('arbete')) {
    return 'karriär';
  } else if (lowerMessage.includes('stress') || lowerMessage.includes('ångest') || lowerMessage.includes('oro')) {
    return 'stress_hantering';
  } else if (lowerMessage.includes('mål') || lowerMessage.includes('utveckling') || lowerMessage.includes('förbättra')) {
    return 'personal_utveckling';
  } else if (lowerMessage.includes('relation') || lowerMessage.includes('kommunikation')) {
    return 'relationer';
  }
  return 'allmän_coaching';
}

function extractTags(message: string): string[] {
  const tags: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('mål')) tags.push('målsättning');
  if (lowerMessage.includes('stress')) tags.push('stress');
  if (lowerMessage.includes('jobb') || lowerMessage.includes('arbete')) tags.push('arbete');
  if (lowerMessage.includes('tid')) tags.push('tidshantering');
  if (lowerMessage.includes('motivation')) tags.push('motivation');
  if (lowerMessage.includes('balans')) tags.push('work_life_balance');
  
  return tags;
}

// New handlers for additional AI actions
interface CoachingAnalysisRequest { action: 'coaching_analysis'; data: { sessionType: string; userContext: any; assessmentData?: any; }; context: { userId: string; language: string; priority: string; }; }

interface AssessmentAnalysisRequest { action: 'assessment_analysis'; data: { assessmentType: string; scores: any; responses: any; pillarKey?: string; }; context: { userId: string; language: string; priority: string; }; }

async function handleCoachingAnalysis(request: CoachingAnalysisRequest): Promise<any> {
  const start = Date.now();
  const { sessionType, userContext, assessmentData } = request.data;
  const { userId } = request.context;
  const messages = [
    { role: 'system', content: 'Du är Stefan AI Coach. Leverera endast JSON. Struktur: {"analysis": {"analysis": string, "recommendations": [{"title": string, "description": string, "actionSteps": string[], "timeframe": string, "difficulty": number, "priority": "high"|"medium"|"low", "category": string}], "nextSteps": string}}' },
    { role: 'user', content: `Session: ${sessionType}. Kontext: ${JSON.stringify(userContext)}. Bedömningsdata: ${JSON.stringify(assessmentData || {})}` }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.4, max_tokens: 1200 })
  });
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
  }
  const ai = await response.json();
  let content = ai.choices?.[0]?.message?.content ?? '';
  // Strip code fences if present
  content = content.replace(/^```json\n?|```$/g, '');
  let parsed: any;
  try { parsed = JSON.parse(content); } catch { parsed = { analysis: { analysis: content, recommendations: [], nextSteps: '' } }; }

  // Log usage
  await supabase.from('ai_usage_logs').insert({ user_id: userId, interaction_type: 'coaching_analysis', model_used: 'gpt-4o-mini', response_time_ms: Date.now() - start, context_used: { sessionType, hasAssessmentData: !!assessmentData } });

  return { success: true, data: { analysis: parsed.analysis ?? parsed, ai_model: 'gpt-4o-mini', timestamp: new Date().toISOString() }, aiModel: 'gpt-4o-mini', processingTime: Date.now() - start, tokens: ai.usage?.total_tokens || 0 };
}

async function handleAssessmentAnalysis(request: AssessmentAnalysisRequest): Promise<any> {
  const start = Date.now();
  const { assessmentType, scores, responses, pillarKey } = request.data;
  const { userId } = request.context;
  const messages = [
    { role: 'system', content: 'Du är Stefan AI Assessment-analytiker. Svara ENDAST med JSON: {"analysis": string, "scores": object, "pillar_key": string}' },
    { role: 'user', content: `Typ: ${assessmentType}. Poäng: ${JSON.stringify(scores)}. Svar: ${JSON.stringify(responses)}. Pillar: ${pillarKey || ''}` }
  ];
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3, max_tokens: 900 })
  });
  if (!response.ok) { const errorData = await response.text(); throw new Error(`OpenAI API error: ${response.status} ${errorData}`); }
  const ai = await response.json();
  let content = ai.choices?.[0]?.message?.content ?? '';
  content = content.replace(/^```json\n?|```$/g, '');
  let parsed: any; try { parsed = JSON.parse(content); } catch { parsed = { analysis: content, scores, pillar_key: pillarKey || null }; }

  await supabase.from('ai_usage_logs').insert({ user_id: userId, interaction_type: 'assessment_analysis', model_used: 'gpt-4o-mini', response_time_ms: Date.now() - start, context_used: { assessmentType, pillarKey } });

  return { success: true, data: { analysis: parsed.analysis, scores: parsed.scores ?? scores, pillar_key: parsed.pillar_key ?? pillarKey, ai_model: 'gpt-4o-mini', timestamp: new Date().toISOString() }, aiModel: 'gpt-4o-mini', processingTime: Date.now() - start, tokens: ai.usage?.total_tokens || 0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: StefanChatRequest = await req.json();
    console.log('Stefan Chat request received for user:', request.context.userId);

    let result: any;
    switch (request.action) {
      case 'stefan_chat':
        result = await handleStefanChat(request);
        break;
      case 'coaching_analysis':
        result = await handleCoachingAnalysis(request as any);
        break;
      case 'assessment_analysis':
        result = await handleAssessmentAnalysis(request as any);
        break;
      default:
        return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stefan Chat function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      aiModel: 'none',
      processingTime: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});