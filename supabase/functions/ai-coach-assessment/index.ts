import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentField {
  score: number; // 1-100
  weight: number;
  text_response?: string;
}

interface AssessmentData {
  pillar: 'economy' | 'self_care' | 'skills' | 'brand' | 'community' | 'sustainability';
  user_profile: {
    age?: number;
    gender?: string;
    profession?: string;
  };
  fields: Record<string, AssessmentField>;
}

interface CoachingResult {
  strengths: string[];
  challenges: string[];
  summary: string;
  actions: Array<{
    area: string;
    what: string;
    why: string;
    first_step: string;
    timeframe: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Coach Assessment request received');

    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      return new Response(JSON.stringify({
        error: 'Inga AI-tjänster tillgängliga'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const assessmentData: AssessmentData = await req.json();
    console.log('Processing assessment for pillar:', assessmentData.pillar);

    // Analysera data enligt instruktionerna
    const analysis = analyzeAssessmentData(assessmentData);

    // Skapa AI-prompt för strukturerad coaching
    const systemPrompt = `Du är Lovables AI-coach. Du analyserar självskattningsdata inom ${assessmentData.pillar}-pelaren.

INSTRUKTIONER:
1. Identifiera de tre mest kritiska utvecklingsområdena baserat på låga betyg och höga vikter
2. Identifiera tre starka områden baserat på höga betyg
3. Skapa en sammanfattning (max 150 ord) av användarens nuläge med tonträff utifrån profil
4. För varje kritiskt område: föreslå konkret SMART-åtgärd (vad, varför, första steg, tidsram)
5. Anpassa åtgärderna för specifika mål/hinder från textfält

Returnera ENDAST valid JSON med exakt denna struktur:
{
  "strengths": ["styrka 1", "styrka 2", "styrka 3"],
  "challenges": ["utmaning 1", "utmaning 2", "utmaning 3"],
  "summary": "sammanfattning max 150 ord",
  "actions": [
    {
      "area": "område",
      "what": "vad som ska göras",
      "why": "varför det är viktigt",
      "first_step": "första konkreta steg",
      "timeframe": "tidsram"
    }
  ]
}`;

    const analysisPrompt = `ASSESSMENT DATA:
Pelare: ${assessmentData.pillar}
Användarprofil: ${JSON.stringify(assessmentData.user_profile)}

FÄLTDATA (poäng 1-100, vikt):
${Object.entries(assessmentData.fields).map(([key, field]) => 
  `${key}: ${field.score}/100 (vikt: ${field.weight})${field.text_response ? ` - Text: "${field.text_response}"` : ''}`
).join('\n')}

BERÄKNAD ANALYS:
Högsta viktade poäng: ${analysis.highWeightedScores.map(item => `${item.field}: ${item.weightedScore.toFixed(1)}`).join(', ')}
Lägsta viktade poäng: ${analysis.lowWeightedScores.map(item => `${item.field}: ${item.weightedScore.toFixed(1)}`).join(', ')}
Höga råpoäng: ${analysis.highRawScores.map(item => `${item.field}: ${item.score}`).join(', ')}

Textdata som kan påverka rekommendationer:
${Object.entries(assessmentData.fields)
  .filter(([_, field]) => field.text_response)
  .map(([key, field]) => `${key}: "${field.text_response}"`)
  .join('\n') || 'Ingen textdata'}

Analysera och returnera strukturerat JSON-svar enligt instruktionerna.`;

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: analysisPrompt }
    ], {
      maxTokens: 1200,
      temperature: 0.3,
      model: 'gpt-4.1-2025-04-14'
    });

    if (!aiResponse.success) {
      console.error('AI coaching failed:', aiResponse.error);
      return new Response(JSON.stringify({
        error: 'AI-coaching misslyckades: ' + aiResponse.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Försök parsa JSON-svaret
    let coachingResult: CoachingResult;
    try {
      coachingResult = JSON.parse(aiResponse.content);
      
      // Validera strukturen
      if (!coachingResult.strengths || !coachingResult.challenges || 
          !coachingResult.summary || !coachingResult.actions) {
        throw new Error('Ogiltig JSON-struktur');
      }
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('AI Response:', aiResponse.content);
      
      // Fallback-svar
      coachingResult = {
        strengths: analysis.highRawScores.slice(0, 3).map(item => `Stark inom ${item.field}`),
        challenges: analysis.lowWeightedScores.slice(0, 3).map(item => `Utvecklingsområde: ${item.field}`),
        summary: `Baserat på din ${assessmentData.pillar}-bedömning finns både styrkor och utvecklingsområden att arbeta med.`,
        actions: analysis.lowWeightedScores.slice(0, 3).map(item => ({
          area: item.field,
          what: `Förbättra ${item.field.toLowerCase()}`,
          why: `Detta område har låg poäng men hög viktning`,
          first_step: `Gör en djupare analys av ${item.field.toLowerCase()}`,
          timeframe: '2 veckor'
        }))
      };
    }

    console.log(`AI coaching completed using ${aiResponse.model.toUpperCase()}`);

    return new Response(JSON.stringify({
      success: true,
      coaching_result: coachingResult,
      pillar: assessmentData.pillar,
      ai_model_used: aiResponse.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-coach-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Hjälpfunktion för att analysera assessment-data
function analyzeAssessmentData(data: AssessmentData) {
  const fieldAnalysis = Object.entries(data.fields).map(([field, fieldData]) => ({
    field,
    score: fieldData.score,
    weight: fieldData.weight,
    weightedScore: fieldData.score * fieldData.weight,
    textResponse: fieldData.text_response
  }));

  // Sortera efter viktade poäng (lägst först för utmaningar)
  const lowWeightedScores = fieldAnalysis
    .sort((a, b) => a.weightedScore - b.weightedScore)
    .slice(0, 3);

  // Sortera efter viktade poäng (högst först för möjligheter)
  const highWeightedScores = fieldAnalysis
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3);

  // Sortera efter råpoäng (högst först för styrkor)
  const highRawScores = fieldAnalysis
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    lowWeightedScores,
    highWeightedScores,
    highRawScores,
    allFields: fieldAnalysis
  };
}