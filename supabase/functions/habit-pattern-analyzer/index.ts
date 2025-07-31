import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface HabitPatternRequest {
  habit_data: any;
  analysis_type: 'weekly_review' | 'monthly_deep_dive' | 'pattern_detection' | 'optimization_suggestions';
  client_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { habit_data, analysis_type, client_id }: HabitPatternRequest = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get client's all habits for pattern analysis
    const { data: allHabitsData } = await supabase
      .from('path_entries')
      .select('*')
      .eq('client_id', client_id)
      .contains('metadata', { is_habit: true });

    const allHabits = (allHabitsData || []).map(entry => (entry.metadata as any).habit_data);

    // Analyze patterns based on neuroplasticity principles
    const analysisPrompt = generateAnalysisPrompt(habit_data, allHabits, analysis_type);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `Du är en expert på neuroplasticitet och vanformning. Analysera vanmönster baserat på hjärnforskning och beteendepsykologi. 

NEUROPLASTICITETS-PRINCIPER:
- 66-dagarsregeln för vanbildning
- Synaptisk plasticitet genom repetition
- Myelinering av neurala banor
- Betydelsen av konsistens över intensitet
- Dopaminbelöningssystem
- Kontextuell inlärning

Ge konkreta, svenska råd baserade på data. Fokusera på:
1. Neuroplastiska framsteg
2. Optimala tider och kontext
3. Progressionsstrategier
4. Riskfaktorer för bakslag
5. Personliga mönster

Svara alltid på svenska med konkreta handlingsplaner.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Parse and structure the analysis
    const structuredAnalysis = parseAnalysisResponse(analysis, habit_data, analysis_type);

    // Store analysis results
    await supabase
      .from('path_entries')
      .insert({
        client_id,
        type: 'ai_analysis',
        title: `🧠 Vananalys: ${habit_data.title}`,
        details: `${analysis_type} - Neuroplasticitetsfokus`,
        content: analysis,
        status: 'completed',
        ai_generated: true,
        created_by: 'system',
        visible_to_client: true,
        metadata: {
          analysis_type,
          habit_id: habit_data.id,
          analysis_data: structuredAnalysis,
          is_habit_analysis: true
        }
      });

    return new Response(JSON.stringify({
      success: true,
      analysis: structuredAnalysis,
      raw_analysis: analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habit pattern analyzer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateAnalysisPrompt(habit: any, allHabits: any[], analysisType: string): string {
  const baseInfo = `
VANA ATT ANALYSERA:
Titel: ${habit.title}
Frekvens: ${habit.frequency}
Svårighetsgrad: ${habit.difficulty}
Nuvarande streak: ${habit.streak_current}
Längsta streak: ${habit.streak_longest}
Framgångsgrad: ${habit.success_rate}%
Aktuella repetitioner: ${habit.current_repetitions}/${habit.repetition_goal}

GENOMFÖRANDEHISTORIK:
${habit.completion_history.slice(-10).map((c: any) => 
  `- ${new Date(c.completed_at).toLocaleDateString('sv-SE')}: Kvalitet ${c.completion_quality}/10, Kändes ${c.difficulty_felt}/10 svårt`
).join('\n')}
`;

  switch (analysisType) {
    case 'weekly_review':
      return `${baseInfo}

VECKOANALYS EFTERFRÅGAS:
Analysera denna veckas framsteg mot neuroplastiska principer. Identifiera:
1. Framsteg mot 66-dagars automatisering
2. Konsistensmönster och förbättringsområden
3. Optimal timing och kontext
4. Nästa veckas fokusområden`;

    case 'pattern_detection':
      return `${baseInfo}

MÖNSTERIGENKÄNNING:
Analysera alla genomföranden för att identifiera:
1. Bästa tider för genomförande
2. Miljöfaktorer som påverkar framgång
3. Humörmönster före/efter
4. Prediktiva faktorer för framgång/misslyckande`;

    case 'optimization_suggestions':
      return `${baseInfo}

OPTIMERINGSANALYS:
Baserat på neuroplasticitetsforskning, föreslå:
1. Progressionsjusteringar för optimal hjärnförändring
2. Kontextuella förbättringar
3. Svårighetsgradsjusteringar
4. Belöningssystem-optimeringar`;

    default:
      return baseInfo;
  }
}

function parseAnalysisResponse(analysis: string, habit: any, analysisType: string) {
  return {
    habit_id: habit.id,
    analysis_type: analysisType,
    neuroplastic_progress: extractProgress(analysis),
    key_insights: extractInsights(analysis),
    recommendations: extractRecommendations(analysis),
    risk_factors: extractRiskFactors(analysis),
    next_actions: extractNextActions(analysis),
    confidence_score: 0.85,
    generated_at: new Date().toISOString()
  };
}

function extractProgress(text: string): number {
  const progressMatch = text.match(/(\d+)%.*framsteg|(\d+)%.*progress/i);
  return progressMatch ? parseInt(progressMatch[1] || progressMatch[2]) : 50;
}

function extractInsights(text: string): string[] {
  const insights = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('insikt') || line.includes('mönster') || line.includes('framsteg')) {
      insights.push(line.trim());
    }
  }
  
  return insights.slice(0, 5);
}

function extractRecommendations(text: string): string[] {
  const recommendations = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('rekommend') || line.includes('förslag') || line.includes('bör')) {
      recommendations.push(line.trim());
    }
  }
  
  return recommendations.slice(0, 5);
}

function extractRiskFactors(text: string): string[] {
  const risks = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('risk') || line.includes('varning') || line.includes('problem')) {
      risks.push(line.trim());
    }
  }
  
  return risks.slice(0, 3);
}

function extractNextActions(text: string): string[] {
  const actions = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('nästa') || line.includes('åtgärd') || line.includes('handling')) {
      actions.push(line.trim());
    }
  }
  
  return actions.slice(0, 5);
}