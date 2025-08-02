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

    // Enhanced AI analysis prompt for pillar recommendations
    const analysisPrompt = `
Du är Stefan, en erfaren coach som analyserar en omfattande välkomstbedömning för att skapa en intelligent utvecklingsplan. Analysera följande data och ge detaljerade pillar-rekommendationer.

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

PILLAR SYSTEM:
- self_care: Fysisk och mental hälsa, stresshantering, rutiner
- skills: Färdigheter, kommunikation, ledarskap, inlärning  
- talent: Naturliga begåvningar, passion, styrkor, flow
- brand: Personligt varumärke, synlighet, närvaro
- economy: Ekonomisk planering, inkomst, investeringar

ANALYS-UPPDRAG:
1. PILLAR RELEVANCE SCORING: Betygsätt varje pillar 1-10 baserat på användarens behov och potential
2. PRIMARY RECOMMENDATION: Välj 1 huvudpillar som är mest kritisk för användarens utveckling
3. SECONDARY RECOMMENDATION: Välj 1 sekundär pillar som kompletterar den första
4. PERSONLIG MOTIVERING: Förklara VARFÖR dessa pillars är viktiga för just denna användare (2-3 meningar per pillar)
5. EXPECTED OUTCOMES: Beskriv konkreta förbättringar användaren kan förvänta sig inom 3-4 veckor
6. READINESS ASSESSMENT: Bedöm användarens beredskap att börja (1-10)
7. SUCCESS INDICATORS: Lista 3 konkreta tecken på framsteg användaren ska titta efter
8. STEFAN MESSAGE: Personligt, uppmuntrande meddelande från Stefan (2-3 meningar)

Svara i JSON-format med dessa nycklar: pillar_scores, primary_pillar, secondary_pillar, personal_motivation, expected_outcomes, readiness_score, success_indicators, stefan_message
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
            content: 'Du är Stefan, en erfaren och empatisk coach som hjälper människor utvecklas. Du ger konkreta, actionable råd på svenska med värme och förståelse. Svara alltid i korrekt JSON-format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const openAIData = await openAIResponse.json();
    const aiAnalysis = openAIData.choices[0]?.message?.content || '';

    // Parse AI JSON response
    let aiRecommendations;
    try {
      aiRecommendations = JSON.parse(aiAnalysis);
    } catch (error) {
      console.error('Failed to parse AI recommendations, using fallback');
      aiRecommendations = {
        pillar_scores: { self_care: 8, skills: 6, talent: 5, brand: 4, economy: 5 },
        primary_pillar: 'self_care',
        secondary_pillar: 'skills',
        personal_motivation: {
          primary: 'Baserat på din bedömning behöver du stärka din grundläggande hälsa och rutiner',
          secondary: 'Utveckling av färdigheter kommer ge dig verktyg för framtida tillväxt'
        },
        expected_outcomes: {
          primary: 'Bättre energi, sömn och fokus inom 3-4 veckor',
          secondary: 'Ökad självförtroende och produktivitet'
        },
        readiness_score: 7,
        success_indicators: ['Mer energi på morgonen', 'Färre stresstillfällen', 'Bättre fokus'],
        stefan_message: `Hej ${profile?.first_name || 'där'}! Jag ser både dina styrkor och utvecklingsmöjligheter. Låt oss börja med det som ger dig mest energi!`
      };
    }

    // Calculate overall score based on all data
    const quickWinsScore = Object.values(assessment_data.quickWins || {}).filter(Boolean).length / 7 * 10;
    const overallScore = (wheelAverage * 0.7 + quickWinsScore * 0.3);

    // Use AI recommendation for next pillar
    const nextRecommendedPillar = aiRecommendations.primary_pillar || 'self_care';
    const secondaryRecommendedPillar = aiRecommendations.secondary_pillar || 'skills';

    // Create enhanced structured response with intelligent recommendations
    const analysisResult = {
      overall_score: Math.round(overallScore * 10) / 10,
      wheel_average: Math.round(wheelAverage * 10) / 10,
      lowest_areas: lowestAreas.map(({area}) => area),
      highest_areas: highestAreas.map(({area}) => area),
      next_recommended_pillar: nextRecommendedPillar,
      secondary_recommended_pillar: secondaryRecommendedPillar,
      analysis: aiAnalysis,
      stefan_message: aiRecommendations.stefan_message,
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
      },
      // NEW: Intelligent Pillar Discovery data
      pillar_recommendations: {
        pillar_scores: aiRecommendations.pillar_scores || {},
        primary_pillar: {
          key: aiRecommendations.primary_pillar,
          motivation: aiRecommendations.personal_motivation?.primary || '',
          expected_outcome: aiRecommendations.expected_outcomes?.primary || '',
          relevance_score: aiRecommendations.pillar_scores?.[aiRecommendations.primary_pillar] || 8
        },
        secondary_pillar: {
          key: aiRecommendations.secondary_pillar,
          motivation: aiRecommendations.personal_motivation?.secondary || '',
          expected_outcome: aiRecommendations.expected_outcomes?.secondary || '',
          relevance_score: aiRecommendations.pillar_scores?.[aiRecommendations.secondary_pillar] || 6
        },
        readiness_score: aiRecommendations.readiness_score || 7,
        success_indicators: aiRecommendations.success_indicators || [],
        user_context: {
          life_balance: wheelAverage,
          change_readiness: Math.min(10, aiRecommendations.readiness_score + (quickWinsScore / 10 * 2)),
          focus_areas: lowestAreas.slice(0, 2).map(({area}) => area)
        }
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