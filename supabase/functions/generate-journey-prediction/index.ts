import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔮 JOURNEY PREDICTION AI
 * Predikterar användarens nästa steg baserat på beteende och kontext
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      current_phase,
      completed_assessments,
      journey_progress,
      recent_insights,
      behavior_patterns,
      last_activity,
      metadata
    } = await req.json();

    console.log('🔮 Journey Prediction AI starting for user:', user_id);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!openAIApiKey && !geminiApiKey) {
      throw new Error('No AI API keys available');
    }

    // Bygg AI-prompt för journey prediction
    const predictionPrompt = buildPredictionPrompt({
      current_phase,
      completed_assessments,
      journey_progress,
      recent_insights,
      behavior_patterns,
      last_activity,
      metadata
    });

    console.log('🤖 Calling AI for journey prediction...');

    let predictionResult;

    try {
      if (openAIApiKey) {
        predictionResult = await callOpenAI(openAIApiKey, predictionPrompt);
      } else if (geminiApiKey) {
        predictionResult = await callGemini(geminiApiKey, predictionPrompt);
      }
    } catch (aiError) {
      console.error('AI call failed:', aiError);
      // Fallback till regelbaserad prediktion
      predictionResult = generateFallbackPrediction({
        current_phase,
        completed_assessments,
        journey_progress,
        recent_insights,
        behavior_patterns
      });
    }

    // Parsa och validera AI-svaret
    const prediction = parsePredictionResult(predictionResult);

    console.log('✅ Journey prediction generated successfully');

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Journey prediction error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to generate journey prediction',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPredictionPrompt(data: any): string {
  return `Du är en expertcoach och dataanalytiker som predikterar användarens nästa steg i deras utvecklingsresa.

ANVÄNDARKONTTEXT:
- Aktuell fas: ${data.current_phase}
- Genomförda bedömningar: ${JSON.stringify(data.completed_assessments)}
- Resa-progress: ${data.journey_progress}%
- Senaste aktivitet: ${data.last_activity}
- Senaste insikter: ${JSON.stringify(data.recent_insights?.slice(-3) || [])}
- Beteendemönster: ${JSON.stringify(data.behavior_patterns?.slice(-2) || [])}

UPPDRAG:
Analysera användarens data och generera en JSON-struktur med:

1. PREDICTED_NEXT_ACTIONS (3-5 mest troliga nästa steg):
   - action_type (assessment, task, reflection, planning, support)
   - probability (0-1)
   - suggested_timing (immediate, within_hours, within_days, within_week)
   - context (relevant metadata)
   - reasoning (varför detta steg)

2. RISK_FACTORS (potentiella hinder):
   - long_inactivity, low_engagement, skill_gap, time_constraints, overwhelm

3. SUCCESS_INDICATORS (positiva signaler):
   - consistent_activity, goal_clarity, progress_momentum, engagement_high

4. RECOMMENDED_INTERVENTIONS (proaktiva åtgärder):
   - motivation_boost, skill_support, time_management, goal_adjustment

5. CONFIDENCE_SCORE (0-1) för hela prediktionen

Svara ENDAST med valid JSON. Var konkret och actionable.`;
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
          content: 'Du är en expert på användarresa-prediktion och beteendeanalys. Svara alltid med valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
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
        maxOutputTokens: 1500
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'Gemini kunde inte generera prediktion';
}

function parsePredictionResult(result: string): any {
  try {
    // Försök parsa JSON direkt
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback om AI inte svarade med ren JSON
    return generateFallbackPrediction({});
  } catch (error) {
    console.error('Error parsing AI prediction result:', error);
    return generateFallbackPrediction({});
  }
}

function generateFallbackPrediction(data: any): any {
  const currentPhase = data.current_phase || 'welcome';
  const journeyProgress = data.journey_progress || 0;

  return {
    user_id: data.user_id,
    predicted_next_actions: [
      {
        action_type: currentPhase === 'welcome' ? 'assessment' : 'task',
        probability: 0.8,
        suggested_timing: 'immediate',
        context: { phase: currentPhase },
        reasoning: 'Baserat på aktuell fas och progress'
      },
      {
        action_type: 'reflection',
        probability: 0.6,
        suggested_timing: 'within_days',
        context: { progress: journeyProgress },
        reasoning: 'Regelbunden reflektion stärker utvecklingen'
      }
    ],
    risk_factors: journeyProgress < 30 ? ['low_engagement'] : [],
    success_indicators: journeyProgress > 50 ? ['progress_momentum'] : [],
    recommended_interventions: journeyProgress < 30 ? ['motivation_boost'] : ['skill_support'],
    confidence_score: 0.7,
    predicted_at: new Date().toISOString()
  };
}