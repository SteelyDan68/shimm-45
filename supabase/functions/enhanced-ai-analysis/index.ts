import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  user_id: string;
  pillar_type: string;
  assessment_data: Record<string, any>;
  free_text_responses?: Record<string, string>;
  mode: 'standard' | 'stefan_enhanced' | 'neuroplastic_focused';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, pillar_type, assessment_data, free_text_responses, mode } = await req.json() as AnalysisRequest;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hämta användarens profil och Stefan memories
    const [userProfile, stefanMemories] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).maybeSingle(),
      supabase.from('ai_memories')
        .select('*')
        .eq('user_id', user_id)
        .eq('source', 'stefan_ai')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Bygg kontextuell prompt med alla tre dimensioner
    const contextualPrompt = await buildTripleLayerPrompt({
      pillar_type,
      assessment_data,
      free_text_responses,
      user_profile: userProfile.data,
      stefan_memories: stefanMemories.data || [],
      mode
    });

    let analysis: string;

    if (mode === 'stefan_enhanced') {
      // Använd Stefan persona med vektorminnen
      analysis = await generateStefanEnhancedAnalysis(contextualPrompt, supabase, user_id);
    } else if (mode === 'neuroplastic_focused') {
      // Fokusera på neuroplastiska principer
      analysis = await generateNeuroplasticAnalysis(contextualPrompt);
    } else {
      // Standard Wheel of Life analys
      analysis = await generateStandardAnalysis(contextualPrompt);
    }

    // Spara resultatet och minnesdata
    await Promise.all([
      saveAnalysisResult(supabase, user_id, pillar_type, analysis, assessment_data),
      storeStefanMemory(supabase, user_id, analysis, pillar_type)
    ]);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      mode_used: mode,
      context_included: {
        free_text: !!free_text_responses,
        stefan_memories: stefanMemories.data?.length || 0,
        user_profile: !!userProfile.data
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhanced AI Analysis Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function buildTripleLayerPrompt(params: {
  pillar_type: string;
  assessment_data: Record<string, any>;
  free_text_responses?: Record<string, string>;
  user_profile: any;
  stefan_memories: any[];
  mode: string;
}): Promise<string> {
  const pillarNames = {
    'self_care': 'Självomvårdnad',
    'skills': 'Kompetenser',
    'talent': 'Talang',
    'brand': 'Varumärke',
    'economy': 'Ekonomi',
    'open_track': 'Öppna spåret'
  };

  const pillarName = pillarNames[params.pillar_type as keyof typeof pillarNames] || params.pillar_type;

  let basePrompt = `# TRIPLE-LAYER ANALYSIS: ${pillarName.toUpperCase()}

## METODKOMBINATION (${params.mode})
Du ska balansera din analys mellan tre dimensioner:

### 1. METODOLOGISK GRUND
`;

  if (params.mode === 'neuroplastic_focused') {
    basePrompt += `- **Neuroplastiska principer**: Fokusera på hjärnans förmåga att förändras
- Vanor och beteendeförändringar genom repetition
- Kognitiv omstrukturering och nya tankemönster
- Gradvis progression och konsolidering`;
  } else {
    basePrompt += `- **Wheel of Life**: Balans och fullständighet inom ${pillarName}
- Systematisk bedömning av olika delområden
- Helhetssyn på personlig utveckling
- Evidensbaserade utvecklingsstrategier`;
  }

  basePrompt += `

### 2. AI-ANALYS (GPT)
- Objektiv analys av bedömningsdata
- Mönsterigenkänning i svar
- Strukturerade rekommendationer
- Data-driven insikter

### 3. STEFAN AI PERSONA
- Personlig, varm kommunikationsstil
- Motiverande och stödjande tonalitet
- Använd tidigare konversationer och minnen
- Neuroplastisk coaching-approach

## ANVÄNDARDATA

### Bedömningssvar:
${JSON.stringify(params.assessment_data, null, 2)}

### Fritextkommentarer:
${params.free_text_responses ? JSON.stringify(params.free_text_responses, null, 2) : 'Inga fritextkommentarer tillgängliga'}

### Användarkontext:
${params.user_profile ? `Namn: ${params.user_profile.email || 'Ej tillgängligt'}` : 'Profil ej tillgänglig'}

### Stefan AI Minnesfragment:
${params.stefan_memories.map(mem => `- ${mem.content.substring(0, 100)}...`).join('\n') || 'Inga tidigare minnen tillgängliga'}

## UPPGIFT
Skapa en omfattande analys som:
1. Integrerar alla tre dimensioner (metod + AI + Stefan)
2. Tar hänsyn till ALL data (sliders + fritext)
3. Levererar personliga, handlingsbara insikter
4. Undviker standardfraser från Wheel of Life
5. Använder Stefan AI:s värmande, motiverande ton

Svara på svenska med fokus på ${pillarName}.`;

  return basePrompt;
}

async function generateStefanEnhancedAnalysis(prompt: string, supabase: any, userId: string): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  // Hämta Stefan-specifika minnesfragment via vektorsökning
  const stefanContext = await getStefanVectorContext(supabase, userId, prompt);
  
  const stefanPrompt = `${prompt}

## STEFAN AI INSTRUKTIONER
Du är Stefan, en erfaren coach med fokus på neuroplastisk utveckling. 
Använd denna kontextuella information från tidigare sessioner:

${stefanContext}

VIKTIGT: Generera EXAKT 5 specifika, handlingsbara rekommendationer (inte generiska).
Svara med Stefans personliga, uppmuntrande stil. Integrera neuroplastiska principer naturligt i din analys.
Undvik standardfraser från Wheel of Life. Fokusera på klientens unika situation.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'Du är Stefan AI - en varm, professionell coach specialiserad på neuroplastisk utveckling. Svara alltid med empati, konkreta råd och motiverande tonalitet. Skapa 5 specifika rekommendationer som är unika för varje klient.'
        },
        {
          role: 'user',
          content: stefanPrompt
        }
      ],
      max_completion_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateNeuroplasticAnalysis(prompt: string): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  const neuroplasticPrompt = `${prompt}

## NEUROPLASTISK FOKUS
Analysera bedömningen med särskilt fokus på:
- Hjärnans förmåga att skapa nya neurala vägar
- Vanor som stärker önskade beteenden
- Kognitiv omstrukturering för förbättrad prestanda
- Gradvis progression för hållbar förändring
- Positiv förstärkning och belöningssystem

VIKTIGT: Skapa EXAKT 5 specifika, handlingsbara rekommendationer (ej generiska).`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'Du är en neuroplasticitetsexpert som hjälper människor förstå hur hjärnan kan tränas för personlig utveckling. Leverera alltid 5 specifika, personliga rekommendationer.'
        },
        {
          role: 'user',
          content: neuroplasticPrompt
        }
      ],
      max_completion_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateStandardAnalysis(prompt: string): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Du är en professionell coach som använder Wheel of Life och andra etablerade utvecklingsmetoder för personlig tillväxt.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getStefanVectorContext(supabase: any, userId: string, query: string): Promise<string> {
  try {
    // Generera embedding för query
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    });

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Sök relevanta Stefan-minnen via vektorlikhet
    const { data: memories } = await supabase.rpc('match_stefan_memories', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
      target_user_id: userId
    });

    return memories?.map((mem: any) => mem.content).join('\n\n') || 'Inga relevanta minnen hittades';
  } catch (error) {
    console.error('Vector search error:', error);
    return 'Kontextuell sökning misslyckades';
  }
}

async function saveAnalysisResult(supabase: any, userId: string, pillarType: string, analysis: string, assessmentData: Record<string, any>): Promise<void> {
  await supabase.from('assessment_rounds').insert({
    user_id: userId,
    created_by: userId,
    pillar_type: pillarType,
    ai_analysis: analysis,
    answers: assessmentData,
    scores: { [pillarType]: calculateScore(assessmentData), overall: calculateScore(assessmentData) }
  });
}

async function storeStefanMemory(supabase: any, userId: string, analysis: string, pillarType: string): Promise<void> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  // Generera embedding för minnet
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: analysis.substring(0, 1000) // Första 1000 tecken för embedding
    })
  });

  const embeddingData = await embeddingResponse.json();
  
  await supabase.from('ai_memories').insert({
    user_id: userId,
    content: analysis,
    source: 'stefan_ai',
    tags: [pillarType, 'assessment_analysis'],
    embedding: embeddingData.data[0].embedding,
    metadata: {
      analysis_type: 'enhanced_triple_layer',
      pillar_type: pillarType,
      generated_at: new Date().toISOString()
    }
  });
}

function calculateScore(assessmentData: Record<string, any>): number {
  const values = Object.values(assessmentData).filter(v => typeof v === 'number');
  return values.length > 0 ? Math.round(values.reduce((a, b) => (a as number) + (b as number), 0) / values.length) : 0;
}