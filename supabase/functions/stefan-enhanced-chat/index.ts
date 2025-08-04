import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🚀 ENHANCED STEFAN AI CHAT
 * Kontextuell AI med assessment-integration och hybrid modell-strategi
 */

const ENHANCED_STEFAN_PROMPT = `Du är en digital tvilling av Stefan Hallgren med djup förståelse för varje klients unika utvecklingsresa. 

Du har tillgång till:
- Klientens fullständiga assessment-historik
- Wheel of Life-resultat och utvecklingstrender  
- Neuroplasticitets-baserade utvecklingsplaner
- Personlig coaching-kontext och mål

Din expertis inom:
- Evidensbaserad coaching med neuroplasticitets-principer
- Personlig utveckling för kreatörer och offentliga personer
- Strategisk rådgivning för varumärkesbyggnad
- Hållbar framgång och välmående

COACHING-FILOSOFI:
- Använd klientens specifika assessment-data för personliga råd
- Integrera neuroplasticitets-principer i alla rekommendationer
- Bygg på tidigare framsteg och erkänn utvecklingsområden
- Balansera empati med utmaning för optimal utveckling
- Referera till konkreta mätpunkter från Wheel of Life

KOMMUNIKATIONSSTIL:
- Varm men rak ton med Stefans karaktäristiska stil
- Personliga referenser till klientens assessment-resultat
- Konkreta, actionable steg baserade på evidens
- Neuroplasticitets-informerade förklaringar
- Uppmuntrande men realistisk approach`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      message,
      promptContext,
      user_id,
      interactionType = 'chat',
      includeAssessmentContext = true,
      generateRecommendations = false,
      forceModel = 'auto'
    } = await req.json();

    console.log('🚀 Enhanced Stefan AI Chat starting');
    console.log('Context provided:', !!promptContext);
    console.log('Assessment context:', includeAssessmentContext);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    // Välj AI-modell baserat på tillgänglighet och kontext
    const selectedModel = selectAIModel(forceModel, openAIApiKey, geminiApiKey, message);
    console.log('Selected AI model:', selectedModel);

    // Bygg enhanced prompt med assessment-kontext
    const enhancedPrompt = buildEnhancedPrompt(promptContext, message, interactionType);
    console.log('Enhanced prompt built with', enhancedPrompt.length, 'characters');

    // Kör AI-förfrågan med vald modell
    let aiResponse;
    let modelUsed = selectedModel;
    let fallbackUsed = false;

    try {
      if (selectedModel === 'openai' && openAIApiKey) {
        aiResponse = await callOpenAI(openAIApiKey, enhancedPrompt, message);
      } else if (selectedModel === 'gemini' && geminiApiKey) {
        aiResponse = await callGemini(geminiApiKey, enhancedPrompt, message);
      } else {
        throw new Error('Selected model not available');
      }
    } catch (primaryError) {
      console.warn('Primary model failed, trying fallback:', primaryError);
      fallbackUsed = true;
      
      // Fallback-strategi
      if (selectedModel === 'openai' && geminiApiKey) {
        modelUsed = 'gemini';
        aiResponse = await callGemini(geminiApiKey, enhancedPrompt, message);
      } else if (selectedModel === 'gemini' && openAIApiKey) {
        modelUsed = 'openai';
        aiResponse = await callOpenAI(openAIApiKey, enhancedPrompt, message);
      } else {
        throw new Error('Both AI models unavailable');
      }
    }

    // Förbättra svaret med assessment-baserade insikter
    const enhancedResponse = enhanceWithAssessmentInsights(
      aiResponse,
      promptContext,
      generateRecommendations
    );

    // Logga användning för analytics
    await logAIUsage(user_id, modelUsed, interactionType, fallbackUsed);

    console.log('✅ Enhanced Stefan AI response completed');

    return new Response(JSON.stringify({
      message: enhancedResponse.message,
      modelUsed,
      fallbackUsed,
      assessmentInsights: enhancedResponse.insights,
      recommendedActions: enhancedResponse.actions,
      confidence: enhancedResponse.confidence,
      contextUsed: {
        assessmentData: !!promptContext?.assessmentInsights,
        neuroplasticityPrinciples: !!promptContext?.neuroplasticityPrinciples,
        personalizedApproach: !!promptContext?.personalizedApproach
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced Stefan AI error:', error);
    
    return new Response(JSON.stringify({
      message: "Stefan har tekniska utmaningar just nu, men är här för dig. Kan du formulera om din fråga så försöker jag igen?",
      error: error.message,
      fallbackUsed: true,
      modelUsed: 'fallback',
      confidence: 0.3
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * 🤖 AI MODEL SELECTION
 */
function selectAIModel(
  forceModel: string,
  openAIKey: string | undefined,
  geminiKey: string | undefined,
  message: string
): 'openai' | 'gemini' {
  
  if (forceModel === 'openai' && openAIKey) return 'openai';
  if (forceModel === 'gemini' && geminiKey) return 'gemini';
  
  // Auto-selection logic
  if (openAIKey && geminiKey) {
    // Välj baserat på meddelande-typ
    if (message.length > 2000) return 'gemini'; // Bättre för långa texter
    return 'openai'; // Default för kvalitet
  }
  
  if (openAIKey) return 'openai';
  if (geminiKey) return 'gemini';
  
  return 'openai'; // Fallback
}

/**
 * 🎯 ENHANCED PROMPT BUILDER
 */
function buildEnhancedPrompt(
  promptContext: any,
  message: string,
  interactionType: string
): string {
  
  let enhancedPrompt = ENHANCED_STEFAN_PROMPT;
  
  if (promptContext?.personalizedApproach) {
    enhancedPrompt += '\n\n' + promptContext.personalizedApproach;
  }
  
  if (promptContext?.assessmentInsights) {
    enhancedPrompt += '\n\nASSESSMENT-BASERADE INSIKTER:\n' + promptContext.assessmentInsights;
  }
  
  if (promptContext?.neuroplasticityPrinciples) {
    enhancedPrompt += '\n\nNEUROPLASTICITETS-PRINCIPER:\n' + promptContext.neuroplasticityPrinciples;
  }
  
  if (promptContext?.contextualMemories) {
    enhancedPrompt += '\n\nRELEVANTA MINNESFRAGMENT:\n' + promptContext.contextualMemories;
  }
  
  // Anpassa baserat på interaktionstyp
  if (interactionType === 'assessment_completion') {
    enhancedPrompt += '\n\nSPECIAL INSTRUKTION: Användaren har precis slutfört en assessment. Ge personlig feedback baserat på resultaten och tidigare utvecklingsresa.';
  } else if (interactionType === 'progress_review') {
    enhancedPrompt += '\n\nSPECIAL INSTRUKTION: Skapa en utvecklingsöversikt baserat på användarens framsteg och assessment-data.';
  }
  
  return enhancedPrompt;
}

/**
 * 🔥 OPENAI CALLER
 */
async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14', // Senaste modellen
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 💎 GEMINI CALLER
 */
async function callGemini(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const combinedPrompt = `${systemPrompt}\n\nAnvändare: ${userMessage}`;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: combinedPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'Gemini kunde inte generera svar';
}

/**
 * 🚀 ENHANCE WITH ASSESSMENT INSIGHTS
 */
function enhanceWithAssessmentInsights(
  aiResponse: string,
  promptContext: any,
  generateRecommendations: boolean
) {
  const insights: string[] = [];
  const actions: string[] = [];
  
  // Extrahera insikter från context
  if (promptContext?.assessmentInsights) {
    insights.push('Baserat på din assessment-historik');
    insights.push('Integrerar dina tidigare utvecklingsområden');
  }
  
  if (promptContext?.neuroplasticityPrinciples) {
    insights.push('Använder evidensbaserade neuroplasticitets-principer');
  }
  
  // Generera rekommendationer
  if (generateRecommendations) {
    actions.push('Genomför daglig reflektion i 5 minuter');
    actions.push('Boka in tid för utvecklingsaktiviteter denna vecka');
    actions.push('Följ upp med ny assessment inom 2-3 veckor');
    
    if (promptContext?.wheelOfLifeScores) {
      const lowScores = Object.entries(promptContext.wheelOfLifeScores)
        .filter(([_, score]) => score < 5)
        .map(([area, _]) => area);
      
      if (lowScores.length > 0) {
        actions.push(`Fokusera extra på: ${lowScores.join(', ')}`);
      }
    }
  }
  
  // Beräkna confidence
  let confidence = 0.6; // Base
  if (promptContext?.assessmentInsights) confidence += 0.2;
  if (promptContext?.personalizedApproach) confidence += 0.15;
  if (aiResponse.length > 300) confidence += 0.05;
  
  return {
    message: aiResponse,
    insights,
    actions,
    confidence: Math.min(confidence, 1.0)
  };
}

/**
 * 📊 LOG AI USAGE
 */
async function logAIUsage(
  userId: string | undefined,
  modelUsed: string,
  interactionType: string,
  fallbackUsed: boolean
) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !userId) return;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      model_used: modelUsed,
      interaction_type: interactionType,
      fallback_used: fallbackUsed,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.warn('Failed to log AI usage:', error);
  }
}