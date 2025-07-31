import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, assessment_data } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user profile for context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    // Analyze Wheel of Life scores
    const wheelScores = assessment_data.wheelOfLife || {};
    const wheelAverage = Object.values(wheelScores).length > 0 
      ? Object.values(wheelScores).reduce((a: number, b: number) => a + b, 0) / Object.values(wheelScores).length 
      : 0;

    // Identify lowest and highest areas
    const sortedAreas = Object.entries(wheelScores)
      .sort(([,a], [,b]) => (a as number) - (b as number));
    
    const lowestAreas = sortedAreas.slice(0, 3).map(([area, score]) => ({ area, score }));
    const highestAreas = sortedAreas.slice(-3).map(([area, score]) => ({ area, score }));

    // Prepare AI analysis prompt
    const analysisPrompt = `
Du är Stefan, en erfaren coach som analyserar en omfattande välkomstbedömning. Analysera följande data och ge personliga, actionable insikter.

ANVÄNDARDATA:
Namn: ${profile?.first_name || 'Användaren'}
Wheel of Life genomsnitt: ${wheelAverage.toFixed(1)}/10

WHEEL OF LIFE SCORES:
${Object.entries(wheelScores).map(([area, score]) => `${area}: ${score}/10`).join('\n')}

LÄGSTA OMRÅDEN:
${lowestAreas.map(({area, score}) => `${area}: ${score}/10`).join('\n')}

ADAPTIVA SVAR:
${JSON.stringify(assessment_data.adaptiveQuestions, null, 2)}

FRITEXT-SVAR:
${Object.entries(assessment_data.freeTextResponses || {}).map(([key, response]) => `${key}: ${response}`).join('\n\n')}

SNABBA VINSTER:
${Object.entries(assessment_data.quickWins || {}).map(([key, value]) => `${key}: ${value ? 'Gör redan' : 'Gör inte'}`).join('\n')}

ANALYS-UPPDRAG:
1. Ge en känslig, personlig analys av användarens nuläge (max 3 meningar)
2. Identifiera top 3 utvecklingsområden baserat på all data
3. Föreslå nästa pillar att fokusera på (self_care, skills, talent, brand, eller economy)
4. Skapa 3-5 konkreta, actionable rekommendationer
5. Skriv ett varmt, uppmuntrande meddelande från Stefan (2-3 meningar)

Svara på svenska och var empatisk men rak på sak.
`;

    // Call OpenAI for analysis
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du är Stefan, en erfaren och empatisk coach som hjälper människor utvecklas. Du ger konkreta, actionable råd på svenska med värme och förståelse.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const openAIData = await openAIResponse.json();
    const aiAnalysis = openAIData.choices[0]?.message?.content || '';

    // Calculate overall score based on all data
    const quickWinsScore = Object.values(assessment_data.quickWins || {}).filter(Boolean).length / 7 * 10;
    const overallScore = (wheelAverage * 0.7 + quickWinsScore * 0.3);

    // Determine next recommended pillar
    let nextRecommendedPillar = 'self_care';
    if (lowestAreas.length > 0) {
      const lowestArea = lowestAreas[0].area;
      const pillarMapping: Record<string, string> = {
        'health': 'self_care',
        'career': 'skills',
        'finances': 'economy',
        'relationships': 'self_care',
        'personal_growth': 'talent',
        'fun_recreation': 'self_care',
        'environment': 'self_care',
        'family_friends': 'self_care',
      };
      nextRecommendedPillar = pillarMapping[lowestArea] || 'self_care';
    }

    // Extract Stefan message from AI analysis (look for personal message patterns)
    const stefanMessageMatch = aiAnalysis.match(/Stefan.*?[.!]/g);
    const stefanMessage = stefanMessageMatch 
      ? stefanMessageMatch.slice(-2).join(' ') 
      : `Hej ${profile?.first_name || 'där'}! Jag har gått igenom din bedömning och ser både styrkor och spännande utvecklingsmöjligheter. Låt oss börja med ${nextRecommendedPillar === 'self_care' ? 'välmående' : nextRecommendedPillar} - det kommer att ge dig en stark grund att bygga på.`;

    // Create structured response
    const analysisResult = {
      overall_score: Math.round(overallScore * 10) / 10,
      wheel_average: Math.round(wheelAverage * 10) / 10,
      lowest_areas: lowestAreas.map(({area}) => area),
      highest_areas: highestAreas.map(({area}) => area),
      next_recommended_pillar: nextRecommendedPillar,
      analysis: aiAnalysis,
      stefan_message: stefanMessage,
      key_insights: [
        `Genomsnittligt välmående: ${wheelAverage.toFixed(1)}/10`,
        `Starkaste områden: ${highestAreas.map(({area}) => area).join(', ')}`,
        `Utvecklingsområden: ${lowestAreas.map(({area}) => area).join(', ')}`,
        `Positiva vanor: ${Object.values(assessment_data.quickWins || {}).filter(Boolean).length}/7`,
      ],
      recommendations: {
        immediate_focus: nextRecommendedPillar,
        priority_areas: lowestAreas.map(({area}) => area).slice(0, 3),
        strengths_to_leverage: highestAreas.map(({area}) => area),
        quick_wins: Object.entries(assessment_data.quickWins || {})
          .filter(([_, value]) => !value)
          .map(([key, _]) => key)
          .slice(0, 3),
      }
    };

    console.log('Welcome assessment analysis completed for user:', user_id);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-welcome-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      analysis: 'Teknisk analys kunde inte genomföras, men din bedömning har sparats.',
      stefan_message: 'Hej! Din bedömning har tagits emot. Jag kommer snart att ge dig personliga insikter.',
      overall_score: 5,
      next_recommended_pillar: 'self_care'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});