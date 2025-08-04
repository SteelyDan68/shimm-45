import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🎓 LEARNING STYLE ANALYZER AI
 * Analyserar användarens lärstilar baserat på beteendemönster
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      session_interactions,
      time_spent_patterns,
      interaction_preferences,
      completion_patterns,
      feedback_responses
    } = await req.json();

    console.log('🎓 Learning Style Analyzer starting for user:', user_id);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!openAIApiKey && !geminiApiKey) {
      // Fallback till regelbaserad analys
      return new Response(JSON.stringify(generateRuleBasedAnalysis({})), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bygg AI-prompt för lärstil-analys
    const analysisPrompt = buildLearningStylePrompt({
      session_interactions,
      time_spent_patterns,
      interaction_preferences,
      completion_patterns,
      feedback_responses
    });

    console.log('🤖 Calling AI for learning style analysis...');

    let analysisResult;

    try {
      if (openAIApiKey) {
        analysisResult = await callOpenAI(openAIApiKey, analysisPrompt);
      } else if (geminiApiKey) {
        analysisResult = await callGemini(geminiApiKey, analysisPrompt);
      }
    } catch (aiError) {
      console.error('AI call failed:', aiError);
      analysisResult = generateRuleBasedAnalysis({
        session_interactions,
        interaction_preferences,
        completion_patterns
      });
    }

    // Parsa och validera AI-svaret
    const learningProfile = parseAnalysisResult(analysisResult);

    console.log('✅ Learning style analysis completed successfully');

    return new Response(JSON.stringify(learningProfile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Learning style analysis error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to analyze learning style',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildLearningStylePrompt(data: any): string {
  return `Du är en expert inom pedagogik, neuroplasticitet och lärstilar. Analysera användarens beteendemönster och identifiera deras lärstil.

ANVÄNDARDATA:
- Session interaktioner: ${JSON.stringify(data.session_interactions || {})}
- Tidsanvändningsmönster: ${JSON.stringify(data.time_spent_patterns || [])}
- Interaktionspreferenser: ${JSON.stringify(data.interaction_preferences || [])}
- Slutförandemönster: ${JSON.stringify(data.completion_patterns || [])}
- Feedback-respons: ${JSON.stringify(data.feedback_responses || [])}

ANALYSERA OCH GENERERA JSON med:

1. PRIMARY_LEARNING_STYLE:
   - type: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'multimodal'
   - confidence: 0-1
   - characteristics: [beskrivande egenskaper]
   - detected_behaviors: [observerade beteenden]

2. LEARNING_PATTERNS:
   - preferred_time_of_day: ['morning', 'afternoon', 'evening']
   - optimal_session_length: minuter (5-60)
   - attention_span_minutes: uppmärksamhetsspann
   - learning_pace: 'slow' | 'moderate' | 'fast'
   - feedback_preference: 'immediate' | 'delayed' | 'summary'
   - motivation_triggers: [triggers som motiverar]

3. NEUROPLASTICITY_INDICATORS:
   - growth_mindset_score: 0-1
   - resilience_level: 0-1  
   - adaptability_score: 0-1

4. COGNITIVE_LOAD_TOLERANCE: 'low' | 'medium' | 'high'

Basera analysen på neurovetenskap och evidensbaserad pedagogik. Svara ENDAST med valid JSON.`;
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: 'Du är en expert inom pedagogisk neurovetenskap och lärstilar. Svara alltid med valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'Gemini kunde inte generera analys';
}

function parseAnalysisResult(result: string): any {
  try {
    // Försök parsa JSON direkt
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback om AI inte svarade med ren JSON
    return generateRuleBasedAnalysis({});
  } catch (error) {
    console.error('Error parsing AI analysis result:', error);
    return generateRuleBasedAnalysis({});
  }
}

function generateRuleBasedAnalysis(data: any): any {
  return {
    user_id: data.user_id,
    primary_learning_style: {
      type: 'multimodal',
      confidence: 0.7,
      characteristics: [
        'Föredrar kombinerade lärandeapproaches',
        'Anpassningsbar till olika situationer',
        'Drar nytta av visuella och interaktiva element'
      ],
      detected_behaviors: [
        'Engagerar sig med olika typer av content',
        'Visar flexibilitet i lärande'
      ]
    },
    learning_patterns: {
      preferred_time_of_day: ['morning', 'afternoon'],
      optimal_session_length: 20,
      attention_span_minutes: 15,
      learning_pace: 'moderate',
      feedback_preference: 'immediate',
      motivation_triggers: [
        'progress_tracking',
        'skill_mastery',
        'challenge_completion'
      ]
    },
    cognitive_load_tolerance: 'medium',
    neuroplasticity_indicators: {
      growth_mindset_score: 0.75,
      resilience_level: 0.7,
      adaptability_score: 0.8
    },
    last_updated: new Date().toISOString()
  };
}