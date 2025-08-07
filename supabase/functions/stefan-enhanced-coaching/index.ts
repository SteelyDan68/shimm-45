import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stefan's Enhanced Coaching Model Selector (for Edge Function)
class StefanCoachingEngine {
  static selectCoachingModel(userInput: string, context: any = {}) {
    const input = userInput.toLowerCase();
    
    // Neuroplastisk metod - för vanor och beteendeförändring
    if (input.match(/(vana|habit|sluta|quit|beroende|addiction|routine|rutin|snusa|röka|dricka|träna|motion|sova|äta|diet)/)) {
      return {
        id: 'neuroplastic',
        name: 'Neuroplastisk Metod',
        approach: 'Fokuserar på hjärnans förmåga att förändras genom repetition och små, konsekventa steg',
        stefanTouch: 'Stefan guidar dig genom att skapa nya neurala banor med empati och förståelse för att förändring tar tid.'
      };
    }
    
    // Livets hjul - för balans och holistisk utveckling
    if (input.match(/(balans|balance|liv|life|områden|helhetsvy|holistic|work-life|välmående|wellbeing|harmoni|jämvikt)/)) {
      return {
        id: 'wheel_of_life',
        name: 'Livets Hjul', 
        approach: 'Holistisk approach för att skapa balans mellan alla viktiga livsområden',
        stefanTouch: 'Stefan hjälper dig se helhetsbilden och hitta harmoni mellan olika delar av ditt liv.'
      };
    }
    
    // Styrkebaserad coaching - för talang och potential
    if (input.match(/(styrka|strengths|talang|talent|begåvning|potential|naturlig|bra på|excellent|kompetens|skicklighet)/)) {
      return {
        id: 'strengths_based',
        name: 'Styrkebaserad Coaching',
        approach: 'Bygger på och utvecklar dina naturliga talanger och styrkor',
        stefanTouch: 'Stefan identifierar din unika potential och guidar dig att maximera dina naturliga gåvor.'
      };
    }
    
    // KBT-inspirerad - för tankar, känslor och stress
    if (input.match(/(tankar|thoughts|känslor|emotions|oro|anxiety|stress|negativ|negative|självkritik|perfectionism)/)) {
      return {
        id: 'cognitive_behavioral',
        name: 'Kognitiv-Empatisk Metod',
        approach: 'Fokuserar på sambandet mellan tankar, känslor och beteenden med empati och förståelse',
        stefanTouch: 'Stefan hjälper dig förstå dina tankemönster och utveckla hälsosamma sätt att hantera utmaningar.'
      };
    }
    
    // Lösningsfokuserad - för mål och framtid
    if (input.match(/(lösning|solution|framtid|future|mål|goal|vision|möjligheter|opportunities|potential|framgång)/)) {
      return {
        id: 'solution_focused',
        name: 'Lösningsfokuserad Coaching',
        approach: 'Fokuserar på lösningar och bygger på dina resurser och tidigare framgångar',
        stefanTouch: 'Stefan guidar dig att bygga på det som redan fungerar och skapa tydliga vägar framåt.'
      };
    }
    
    // Mindfulness-baserad - för närvaro och inre lugn
    if (input.match(/(mindfulness|meditation|närvarande|present|medvetenhet|awareness|acceptans|acceptance|stillhet|lugn)/)) {
      return {
        id: 'mindfulness',
        name: 'Mindfulness-baserad Coaching',
        approach: 'Utvecklar närvarande medvetenhet och inre balance',
        stefanTouch: 'Stefan leder dig till djupare självkännedom genom medveten närvaro och acceptans.'
      };
    }
    
    // Default - Stefans adaptiva metod
    return {
      id: 'adaptive_ai',
      name: 'Stefans Adaptiva Coaching',
      approach: 'Stefan kombinerar flera coachingmetoder baserat på dina specifika behov och situation',
      stefanTouch: 'Stefan anpassar sin coaching dynamiskt för att ge dig exakt den typ av stöd du behöver just nu.'
    };
  }
  
  static buildStefanSystemPrompt(selectedModel: any, context: any = {}) {
    return `🎭 DU ÄR STEFAN - EXPERT AI-COACH MED DJUP MÄNSKLIG FÖRSTÅELSE

STEFANS KÄRNIDENTITET:
• Varm, empatisk men tydlig personlighet
• Praktisk visdom kombinerat med djup förståelse för mänsklig psykologi  
• Hög emotionell intelligens som läser mellan raderna
• Autentisk omsorg för varje klients unika utvecklingsresa
• Använder "du" och personlig, varm ton

STEFANS GRUNDLÄGGANDE COACHING-PRINCIPER:
• Varje människa har unik potential som kan utvecklas
• Små, konsekventa steg skapar bestående förändring (neuroplasticitet)
• Självkännedom är grunden för all personlig utveckling  
• Balans är nyckeln till hållbar tillväxt
• Motstånd är ofta rädsla förklädd - bemöt det med empati
• Fira framsteg, oavsett hur små de är
• Autenticitet över perfektion alltid

🎯 VALD COACHINGMODELL FÖR DETTA SAMTAL:
${selectedModel.name}
APPROACH: ${selectedModel.approach}
STEFANS TOUCH: ${selectedModel.stefanTouch}

STEFANS KOMMUNIKATIONSSTIL:
✓ Personlig, varm ton som skapar trygghet
✓ Lyssnar aktivt och läser mellan raderna  
✓ Ställer kraftfulla, insiktsfulla frågor
✓ Ger konkreta, genomförbara råd
✓ Balanserar empati med utmaning
✓ Använder berättelser och metaforer när det hjälper
✓ Erkänner komplexitet utan att överväldigande

STEFANS EXPERTOMRÅDEN:
• Neuroplasticitet och beteendeförändring
• Positiv psykologi och styrkebaserat tänkande
• Mindfulness och medveten närvaro
• Emotionell intelligens och självkännedom
• Stresshantering och välmående
• Målsättning och motivation
• Kreativitet och problemlösning

${context.userHistory ? `
KLIENTENS HISTORIK (Stefan kommer ihåg):
${context.userHistory.slice(-3).join('\n')}` : ''}

${context.currentChallenges ? `
AKTUELLA UTMANINGAR:
${context.currentChallenges.join(', ')}` : ''}

STEFANS MISSION:
Ge personlig, empatisk coaching som möter personen exakt där hen är och guidar framåt med visdom, värme och praktisk vägledning.

VIKTIGT: Stefan är aldrig generisk - varje svar är anpassat till denna specifika persons resa, utmaningar och potential.`;
  }
  
  static buildStefanUserPrompt(userInput: string, context: any = {}) {
    return `COACHING-SAMTAL MED STEFAN

KLIENTENS MEDDELANDE:
"${userInput}"

${context.assessmentData ? `
RELEVANT KONTEXT FRÅN ASSESSMENTS:
${JSON.stringify(context.assessmentData, null, 2)}` : ''}

${context.pillarType ? `
AKTUELL UTVECKLINGSOMRÅDE: ${context.pillarType}` : ''}

STEFANS UPPGIFT:
Svara som den erfarna, empatiska coach du är. Ge:

1. PERSONLIG RESPONS - Visa att du förstår och bryr dig
2. INSIKTSFULL REFLEKTION - Hjälp klienten se nya perspektiv
3. KONKRETA NÄSTA STEG - Vad kan hen göra praktiskt?
4. UPPMUNTRAN - Bygg självförtroende och motivation
5. KRAFTFULLA FRÅGOR - Om det hjälper klienten vidare

Anpassa ditt svar till den valda coachingmodellen men låt din Stefans-personlighet genomsyra allt.

Svara med värme, visdom och äkta omsorg för denna persons utveckling.`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id,
      message,
      context,
      session_type = 'general_coaching'
    } = await req.json();

    if (!user_id || !message) {
      throw new Error('Missing required fields: user_id, message');
    }

    console.log('🎭 Stefan Enhanced Coaching for user:', user_id);
    console.log('💬 Message:', message.substring(0, 100) + '...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hämta användarens kontext från senaste interaktioner
    const { data: userContext } = await supabase
      .from('path_entries')
      .select('title, details, metadata')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Hämta senaste assessments för kontext
    const { data: recentAssessments } = await supabase
      .from('assessment_rounds')
      .select('pillar_type, ai_analysis, scores')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(2);

    // Bygg omfattande kontext för Stefan
    const enhancedContext = {
      userHistory: userContext?.map(entry => `${entry.title}: ${entry.details?.substring(0, 200)}`),
      assessmentData: recentAssessments,
      pillarType: context?.pillar_type,
      currentChallenges: context?.challenges || [],
      sessionType: session_type,
      userPreferences: context?.preferences || {}
    };

    // 🎯 VÄLJ COACHINGMODELL DYNAMISKT
    const selectedModel = StefanCoachingEngine.selectCoachingModel(message, enhancedContext);
    
    console.log('🎯 Selected coaching model:', selectedModel.name);

    // 🎭 BYGG STEFAN'S PERSONLIGA PROMPT SYSTEM
    const systemPrompt = StefanCoachingEngine.buildStefanSystemPrompt(selectedModel, enhancedContext);
    const userPrompt = StefanCoachingEngine.buildStefanUserPrompt(message, enhancedContext);

    // 🤖 ANROPA AI MED STEFAN'S PERSONLIGHET
    const availability = await aiService.checkAvailability();
    if (!availability.openai && !availability.gemini) {
      throw new Error('Inga AI-tjänster tillgängliga');
    }

    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 1200,
      temperature: 0.8, // Högre för mer personlighet och kreativitet
      model: 'gpt-4.1-2025-04-14' // Använd senaste modellen för bästa förståelse
    });

    if (!aiResponse.success) {
      throw new Error('Stefan AI misslyckades: ' + aiResponse.error);
    }

    const stefanResponse = aiResponse.content;

    // 📝 SPARA INTERAKTION FÖR KONTINUITET
    await supabase.from('path_entries').insert({
      user_id: user_id,
      created_by: user_id,
      type: 'coaching_interaction',
      title: `Stefan Coaching: ${selectedModel.name}`,
      details: `MEDDELANDE: ${message}\n\nSTEFANS SVAR: ${stefanResponse}`,
      ai_generated: true,
      metadata: {
        coaching_model: selectedModel.id,
        session_type: session_type,
        model_reasoning: selectedModel.stefanTouch,
        empathy_level: 'high',
        personalization: 'maximum'
      }
    });

    // 📊 LOGGA COACHING ANALYTICS
    await supabase.from('coaching_analytics').insert({
      user_id: user_id,
      metric_type: 'stefan_coaching_interaction',
      metric_value: 1,
      metric_data: {
        coaching_model: selectedModel.id,
        message_length: message.length,
        response_length: stefanResponse.length,
        session_type: session_type,
        ai_model_used: aiResponse.model,
        context_richness: Object.keys(enhancedContext).length
      }
    });

    console.log('✅ Stefan coaching completed successfully');

    return new Response(JSON.stringify({
      success: true,
      response: stefanResponse,
      coaching_model: {
        id: selectedModel.id,
        name: selectedModel.name,
        approach: selectedModel.approach,
        stefan_touch: selectedModel.stefanTouch
      },
      context: {
        empathy_level: 'high',
        personalization: 'maximum',
        adaptive_model: true
      },
      meta: {
        ai_model: aiResponse.model,
        timestamp: new Date().toISOString(),
        session_type: session_type
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Stefan Enhanced Coaching Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      fallback_message: 'Stefan är tillfälligt otillgänglig. Försök igen om en stund.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});