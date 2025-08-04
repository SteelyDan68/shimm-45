import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, context_data, analysis_type } = await req.json();

    console.log('🧠 Context Analyzer: Processing request for user:', user_id);
    console.log('📊 Context data size:', JSON.stringify(context_data).length, 'characters');

    // Kontrollera AI-tillgänglighet
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      return new Response(JSON.stringify({
        error: 'AI-tjänster inte tillgängliga för kontextanalys'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bygg systemets prompt för kontextanalys
    const systemPrompt = `Du är en expertpsykolog och beteendeanalytiker som analyserar användarmönster för att ge djupa insikter och rekommendationer.

DITT UPPDRAG:
Analysera användarens aktivitetsmönster och generera 2-4 värdefulla insikter som kan hjälpa dem växa och utvecklas.

KONTEXT DATA:
${JSON.stringify(context_data, null, 2)}

ANALYSERA FÖLJANDE:
1. Beteendemönster - Vad säger aktiviteten om användarens vanor?
2. Möjligheter - Vilka förbättringsområden finns?
3. Risker - Finns det oroande mönster som behöver uppmärksamhet?
4. Rekommendationer - Konkreta nästa steg för utveckling

SVARA I FÖLJANDE JSON-FORMAT:
{
  "insights": [
    {
      "type": "behavioral_pattern|opportunity|risk|recommendation",
      "title": "Kort beskrivande titel",
      "description": "Detaljerad förklaring av insikten och varför den är viktig",
      "confidence": 0.8,
      "sources": ["recent_events", "activity_summary"],
      "expires": false
    }
  ],
  "summary": "Övergripande sammanfattning av användarens nuvarande tillstånd",
  "priority_actions": ["Konkret handling 1", "Konkret handling 2"]
}

RIKTLINJER:
- Var empatisk och stödjande i tonen
- Ge konkreta, handlingsbara insikter
- Basera allt på faktiska data från kontexten
- Undvik generaliseringar
- Fokusera på tillväxt och utveckling`;

    const userPrompt = `Analysera denna användares kontext och ge djupa insikter för ${analysis_type}. Fokusera på mönster som kan hjälpa dem växa och utvecklas.`;

    // Anropa AI-tjänsten
    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 1000,
      temperature: 0.7,
      model: 'gpt-4o-mini'
    });

    if (!aiResponse.success) {
      throw new Error('AI-analys misslyckades: ' + aiResponse.error);
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse.content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse.content);
      // Fallback response om JSON parsing misslyckas
      analysisResult = {
        insights: [
          {
            type: 'recommendation',
            title: 'Fortsätt din utvecklingsresa',
            description: 'Baserat på din aktivitet ser jag potential för tillväxt. Låt oss tillsammans identifiera nästa steg.',
            confidence: 0.6,
            sources: ['activity_analysis'],
            expires: false
          }
        ],
        summary: 'Analys genomförd med begränsad data. Fortsätt använda plattformen för djupare insikter.',
        priority_actions: ['Fortsätt logga din aktivitet', 'Utforska nya områden']
      };
    }

    // Lägg till metadata
    analysisResult.metadata = {
      analyzed_at: new Date().toISOString(),
      analysis_type,
      ai_model: aiResponse.model,
      context_size: JSON.stringify(context_data).length,
      user_id
    };

    console.log('✅ Context Analysis completed:', analysisResult.insights?.length, 'insights generated');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in context analyzer:', error);
    
    // Fallback response vid fel
    const fallbackResponse = {
      insights: [
        {
          type: 'recommendation',
          title: 'Systemanalys pausad',
          description: 'Kontextanalysen är tillfälligt otillgänglig, men dina aktiviteter spåras fortfarande för framtida insikter.',
          confidence: 0.5,
          sources: ['system_status'],
          expires: false
        }
      ],
      summary: 'Analyssystemet upplever tillfälliga problem men kommer snart att återgå.',
      priority_actions: ['Fortsätt använda plattformen normalt'],
      error: error.message,
      fallback: true
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200, // Return 200 med fallback istället för error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});